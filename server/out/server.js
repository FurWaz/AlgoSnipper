"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
const node_1 = require("vscode-languageserver/node");
const vscode_languageserver_textdocument_1 = require("vscode-languageserver-textdocument");
const analyzer_1 = require("./analyzer");
const algo = require("./interpreter/common");
const main_1 = require("./interpreter/main");
// Create a connection for the server, using Node's IPC as a transport.
// Also include all preview / proposed LSP features.
let connection = (0, node_1.createConnection)(node_1.ProposedFeatures.all);
// Create a simple text document manager. 
let documents = new node_1.TextDocuments(vscode_languageserver_textdocument_1.TextDocument);
let hasConfigurationCapability = false;
let hasWorkspaceFolderCapability = false;
let hasDiagnosticRelatedInformationCapability = false;
connection.onInitialize((params) => {
    let capabilities = params.capabilities;
    // Does the client support the `workspace/configuration` request?
    // If not, we fall back using global settings.
    hasConfigurationCapability = !!(capabilities.workspace && !!capabilities.workspace.configuration);
    hasWorkspaceFolderCapability = !!(capabilities.workspace && !!capabilities.workspace.workspaceFolders);
    hasDiagnosticRelatedInformationCapability = !!(capabilities.textDocument &&
        capabilities.textDocument.publishDiagnostics &&
        capabilities.textDocument.publishDiagnostics.relatedInformation);
    const result = {
        capabilities: {
            textDocumentSync: node_1.TextDocumentSyncKind.Incremental,
            // Tell the client that this server supports code completion.
            completionProvider: {
                resolveProvider: true,
                triggerCharacters: ["."]
            },
            hoverProvider: true
        }
    };
    if (hasWorkspaceFolderCapability) {
        result.capabilities.workspace = {
            workspaceFolders: {
                supported: true
            }
        };
    }
    return result;
});
connection.onInitialized(() => {
    if (hasConfigurationCapability) {
        // Register for all configuration changes.
        connection.client.register(node_1.DidChangeConfigurationNotification.type, undefined);
    }
    if (hasWorkspaceFolderCapability) {
        connection.workspace.onDidChangeWorkspaceFolders(_event => {
            connection.console.log('Workspace folder change event received.');
        });
    }
    main_1.Interpreter.init();
});
connection.onDidChangeConfiguration(change => {
    // Revalidate all open text documents
    documents.all().forEach(validateTextDocument);
});
// Only keep settings for open documents
documents.onDidClose(e => {
});
// The content of a text document has changed. This event is emitted
// when the text document first opened or when its content has changed.
documents.onDidChangeContent(async (change) => {
    let textDocument = change.document;
    analyzer_1.Analyzer.setDocument(textDocument.getText().split("\n"));
    algo.setScript(textDocument.getText().split("\n"));
    main_1.Interpreter.processAlgorithm();
    validateTextDocument(textDocument);
});
async function validateTextDocument(textDocument) {
    analyzer_1.Analyzer.cleanUp();
    analyzer_1.Analyzer.processLexiconInfos();
    analyzer_1.Analyzer.processScriptFunctions();
    analyzer_1.Analyzer.processScriptInfo();
    let diagnostics = [];
    analyzer_1.Analyzer.LexiconErrors.forEach(e => {
        diagnostics.push({
            severity: node_1.DiagnosticSeverity.Error,
            range: {
                start: node_1.Position.create(e.line, e.range.start),
                end: node_1.Position.create(e.line, e.range.end)
            },
            message: e.message,
            source: "AlgoSnipper"
        });
    });
    // Analyzer.scriptErrors.forEach(e => {
    // 	diagnostics.push({
    // 		severity: DiagnosticSeverity.Error,
    // 		range: {
    // 			start: Position.create(e.line, e.range.start),
    // 			end: Position.create(e.line, e.range.end)
    // 		},
    // 		message: e.message,
    // 		source: "AlgoSnipper"
    // 	});
    // });
    main_1.Interpreter.errors.forEach(e => {
        diagnostics.push({
            severity: node_1.DiagnosticSeverity.Error,
            range: {
                start: node_1.Position.create(e.line, e.range.start),
                end: node_1.Position.create(e.line, e.range.end)
            },
            message: e.message,
            source: "AlgoSnipper"
        });
    });
    // Send the computed diagnostics to VSCode.
    connection.sendDiagnostics({ uri: textDocument.uri, diagnostics });
}
connection.onDidChangeWatchedFiles(_change => {
    // Monitored files have change in VSCode
    connection.console.log('We received an file change event');
});
// This handler provides the initial list of the completion items.
connection.onCompletion((docPos) => {
    let compList = [];
    main_1.Interpreter.getFunctions().forEach(f => {
        compList.push({
            label: f.name,
            kind: node_1.CompletionItemKind.Function,
            data: { obj: f }
        });
    });
    main_1.Interpreter.getTypes().forEach(t => {
        compList.push({
            label: t.name,
            kind: node_1.CompletionItemKind.Class,
            data: { obj: t }
        });
    });
    main_1.Interpreter.getVars().forEach(v => {
        let state = v.scope.isIncluded(docPos.position.line) ? " is included" : " is not included";
        if (v.scope.isIncluded(docPos.position.line) || v.scope.isZero())
            compList.push({
                label: v.name,
                kind: node_1.CompletionItemKind.Variable,
                data: { obj: v }
            });
    });
    return compList;
});
// This handler resolves additional information for the item selected in
// the completion list.
connection.onCompletionResolve((item) => {
    switch (item.kind) {
        case node_1.CompletionItemKind.Class:
            item.detail = "Type " + item.data.obj.name;
            item.documentation = { kind: node_1.MarkupKind.Markdown, value: algo.Type.getDoc(item.data.obj) };
            break;
        case node_1.CompletionItemKind.Variable:
            item.detail = "Variable " + item.data.obj.name;
            item.documentation = { kind: node_1.MarkupKind.Markdown, value: algo.Variable.getDoc(item.data.obj) };
            break;
        case node_1.CompletionItemKind.Function:
            item.detail = "Fonction " + item.data.obj.name;
            item.documentation = { kind: node_1.MarkupKind.Markdown, value: algo.Function.getDoc(item.data.obj) };
            let args = "";
            item.data.obj.args.forEach((a) => { args += a.name + ", "; });
            item.label = item.data.obj.name + "(" + args.substring(0, args.length - 2) + ")";
            break;
        default:
            break;
    }
    return item;
});
connection.onHover(({ textDocument, position }) => {
    const document = documents.get(textDocument.uri);
    if (document == null)
        return undefined;
    let range = (0, analyzer_1.getWordRange)(position.character, document.getText().split("\n")[position.line]);
    if (range == undefined)
        return undefined;
    let vName = document.getText({
        start: { line: position.line, character: range.start },
        end: { line: position.line, character: range.end }
    }).trim();
    let attr = analyzer_1.Attribute.FromString(vName);
    if (!analyzer_1.Attribute.isNull(attr)) {
        return {
            contents: {
                kind: node_1.MarkupKind.Markdown,
                value: analyzer_1.Attribute.GenerateDoc(attr, true),
            }
        };
    }
    let type = analyzer_1.Type.FromString(vName);
    if (!analyzer_1.Type.isNull(type)) {
        return {
            contents: {
                kind: node_1.MarkupKind.Markdown,
                value: analyzer_1.Type.GenerateDoc(type),
            }
        };
    }
    let func = analyzer_1.Func.FromString(vName);
    if (!analyzer_1.Func.isNull(func)) {
        return {
            contents: {
                kind: node_1.MarkupKind.Markdown,
                value: analyzer_1.Func.GenerateDoc(func),
            }
        };
    }
    // type nor variable found, trying with variable's attribute
    let pathRange = (0, analyzer_1.getWordRange)(position.character, document.getText().split("\n")[position.line], /[a-zA-Z0-9_\\.]/);
    if (pathRange != undefined) {
        let path = document.getText({
            start: { line: position.line, character: pathRange.start },
            end: { line: position.line, character: pathRange.end }
        }).trim().split(".");
        let tp = new analyzer_1.Attribute();
        for (let i = 0; i < path.length; i++) {
            const t_name = path[i];
            if (analyzer_1.Attribute.isNull(tp))
                tp = analyzer_1.Attribute.FromString(t_name);
            else {
                tp.type.attrs.forEach(at => {
                    if (at.name == t_name)
                        tp = at;
                });
            }
            if (t_name == vName)
                break;
        }
        if (analyzer_1.Attribute.isNull(tp))
            return undefined;
        return {
            contents: {
                kind: node_1.MarkupKind.Markdown,
                value: analyzer_1.Attribute.GenerateDoc(tp, false),
            }
        };
    }
    return undefined;
});
connection.onNotification("custom/getScriptInfo", () => {
    connection.sendNotification("custom/setScriptInfo", {
        attrs: analyzer_1.Analyzer.scriptAttrs,
        types: analyzer_1.Analyzer.scriptTypes,
        bounds: analyzer_1.Analyzer.lexiconBounds
    });
});
connection.onNotification("custom/launchAlgo", () => {
    main_1.Interpreter.launch(println);
});
function println(str) {
    connection.sendNotification("custom/log", str);
}
analyzer_1.Analyzer.debug = println;
// Make the text document manager listen on the connection
// for open, change and close text document events
documents.listen(connection);
// Listen on the connection
connection.listen();
//# sourceMappingURL=server.js.map