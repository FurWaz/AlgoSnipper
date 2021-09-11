"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
const node_1 = require("vscode-languageserver/node");
const vscode_languageserver_textdocument_1 = require("vscode-languageserver-textdocument");
const interpreter_1 = require("./interpreter");
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
    interpreter_1.Interpreter.setDocument(textDocument.getText().split("\n"));
    validateTextDocument(textDocument);
});
async function validateTextDocument(textDocument) {
    interpreter_1.Interpreter.processLexiconInfos();
    let diagnostics = [];
    interpreter_1.Interpreter.LexiconErrors.forEach(e => {
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
    // is the completion global or for variable attributes
    if (interpreter_1.Interpreter.document[docPos.position.line][docPos.position.character - 1] == ".") {
        let range = new interpreter_1.Range(docPos.position.character - 2, docPos.position.character - 1);
        while (interpreter_1.Interpreter.document[docPos.position.line][range.start].match(/[a-zA-Z0-9_\\.]/))
            range.start--;
        let path = interpreter_1.Interpreter.document[docPos.position.line].substring(range.start, range.end).trim().split(".");
        let type = new interpreter_1.Type();
        for (let i = 0; i < path.length; i++) {
            const t_name = path[i];
            if (interpreter_1.Type.isNull(type))
                type = interpreter_1.Attribute.FromString(t_name).type;
            else {
                type.attrs.forEach(at => {
                    if (at.name == t_name)
                        type = at.type;
                });
            }
        }
        if (interpreter_1.Type.isNull(type))
            return [];
        let index = 0;
        type.attrs.forEach(t => {
            compList.push({
                label: t.name,
                kind: node_1.CompletionItemKind.Field,
                data: { index: index++, type: t.type.name }
            });
        });
    }
    else {
        let index = 0;
        interpreter_1.Interpreter.lexiconTypes.forEach(t => {
            compList.push({
                label: t.name,
                kind: node_1.CompletionItemKind.Class,
                data: { index: index++, type: t }
            });
        });
        interpreter_1.Interpreter.defaultTypes.forEach(t => {
            compList.push({
                label: t.name,
                kind: node_1.CompletionItemKind.Class,
                data: { index: index++, type: t }
            });
        });
        index = 0;
        interpreter_1.Interpreter.lexiconAttrs.forEach(v => {
            compList.push({
                label: v.name,
                kind: node_1.CompletionItemKind.Variable,
                data: { index: index++ }
            });
        });
    }
    return compList;
});
// This handler resolves additional information for the item selected in
// the completion list.
connection.onCompletionResolve((item) => {
    if (item.kind == node_1.CompletionItemKind.Class) {
        let type = item.data.type;
        item.detail = "Type " + type.name;
        item.documentation = { kind: node_1.MarkupKind.Markdown, value: interpreter_1.Type.GenerateDoc(type) };
    }
    if (item.kind == node_1.CompletionItemKind.Variable) {
        let attr = interpreter_1.Interpreter.lexiconAttrs[item.data.index];
        item.detail = "Variable " + attr.name;
        item.documentation = { kind: node_1.MarkupKind.Markdown, value: interpreter_1.Attribute.GenerateDoc(attr, true) };
    }
    if (item.kind == node_1.CompletionItemKind.Field) {
        let attr = new interpreter_1.Attribute(item.label, interpreter_1.Type.FromString(item.data.type));
        item.detail = "Attribut " + attr.name;
        item.documentation = { kind: node_1.MarkupKind.Markdown, value: interpreter_1.Attribute.GenerateDoc(attr, false) };
    }
    return item;
});
connection.onHover(({ textDocument, position }) => {
    const document = documents.get(textDocument.uri);
    if (document == null)
        return undefined;
    let range = (0, interpreter_1.getWordRange)(position.character, document.getText().split("\n")[position.line]);
    if (range == undefined)
        return undefined;
    let vName = document.getText({
        start: { line: position.line, character: range.start },
        end: { line: position.line, character: range.end }
    }).trim();
    let attr = interpreter_1.Attribute.FromString(vName);
    if (!interpreter_1.Attribute.isNull(attr)) {
        return {
            contents: {
                kind: node_1.MarkupKind.Markdown,
                value: interpreter_1.Attribute.GenerateDoc(attr, true),
            }
        };
    }
    let type = interpreter_1.Type.FromString(vName);
    if (!interpreter_1.Type.isNull(type)) {
        return {
            contents: {
                kind: node_1.MarkupKind.Markdown,
                value: interpreter_1.Type.GenerateDoc(type),
            }
        };
    }
    // type nor variable found, trying with variable's attribute
    let pathRange = (0, interpreter_1.getWordRange)(position.character, document.getText().split("\n")[position.line], /[a-zA-Z0-9_\\.]/);
    if (pathRange != undefined) {
        let path = document.getText({
            start: { line: position.line, character: pathRange.start },
            end: { line: position.line, character: pathRange.end }
        }).trim().split(".");
        println("Got path: " + path.join("."));
        let tp = new interpreter_1.Attribute();
        for (let i = 0; i < path.length; i++) {
            const t_name = path[i];
            if (interpreter_1.Attribute.isNull(tp))
                tp = interpreter_1.Attribute.FromString(t_name);
            else {
                tp.type.attrs.forEach(at => {
                    if (at.name == t_name)
                        tp = at;
                });
            }
            if (t_name == vName)
                break;
        }
        if (interpreter_1.Attribute.isNull(tp))
            return undefined;
        return {
            contents: {
                kind: node_1.MarkupKind.Markdown,
                value: interpreter_1.Attribute.GenerateDoc(tp, false),
            }
        };
    }
    return undefined;
});
function println(str) {
    connection.sendNotification("custom/log", str);
}
// Make the text document manager listen on the connection
// for open, change and close text document events
documents.listen(connection);
// Listen on the connection
connection.listen();
//# sourceMappingURL=server.js.map