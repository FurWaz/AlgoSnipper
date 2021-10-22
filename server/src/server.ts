/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
import {
	createConnection,
	TextDocuments,
	Diagnostic,
	DiagnosticSeverity,
	ProposedFeatures,
	InitializeParams,
	DidChangeConfigurationNotification,
	CompletionItem,
	CompletionItemKind,
	TextDocumentPositionParams,
	TextDocumentSyncKind,
	InitializeResult,
	Position,
	MarkupKind,
	Hover
} from 'vscode-languageserver/node';
import { TextDocument } from 'vscode-languageserver-textdocument';

import { Attribute, Type, Range, getWordRange, Analyzer, Func } from './analyzer';
import { debug } from 'console';
import * as algo from './interpreter/common';
import { Interpreter } from './interpreter/main';
// Create a connection for the server, using Node's IPC as a transport.
// Also include all preview / proposed LSP features.
let connection = createConnection(ProposedFeatures.all);

// Create a simple text document manager. 
let documents: TextDocuments<TextDocument> = new TextDocuments(TextDocument);

let hasConfigurationCapability: boolean = false;
let hasWorkspaceFolderCapability: boolean = false;
let hasDiagnosticRelatedInformationCapability: boolean = false;

connection.onInitialize((params: InitializeParams) => {
	let capabilities = params.capabilities;

	// Does the client support the `workspace/configuration` request?
	// If not, we fall back using global settings.
	hasConfigurationCapability = !!(
		capabilities.workspace && !!capabilities.workspace.configuration
	);
	hasWorkspaceFolderCapability = !!(
		capabilities.workspace && !!capabilities.workspace.workspaceFolders
	);
	hasDiagnosticRelatedInformationCapability = !!(
		capabilities.textDocument &&
		capabilities.textDocument.publishDiagnostics &&
		capabilities.textDocument.publishDiagnostics.relatedInformation
	);

	const result: InitializeResult = {
		capabilities: {
			textDocumentSync: TextDocumentSyncKind.Incremental,
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
		connection.client.register(DidChangeConfigurationNotification.type, undefined);
	}
	if (hasWorkspaceFolderCapability) {
		connection.workspace.onDidChangeWorkspaceFolders(_event => {
			connection.console.log('Workspace folder change event received.');
		});
	}

	Interpreter.init();
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
documents.onDidChangeContent(async change => {
	let textDocument = change.document;
	Analyzer.setDocument(textDocument.getText().split("\n"));
	algo.setScript(textDocument.getText().split("\n"));
	Interpreter.processAlgorithm();
	validateTextDocument(textDocument);
});

async function validateTextDocument(textDocument: TextDocument): Promise<void> {
	Analyzer.cleanUp();
	Analyzer.processLexiconInfos();
	Analyzer.processScriptFunctions();
	Analyzer.processScriptInfo();
	let diagnostics: Diagnostic[] = [];
	Analyzer.LexiconErrors.forEach(e => {
		diagnostics.push({
			severity: DiagnosticSeverity.Error,
			range: {
				start: Position.create(e.line, e.range.start),
				end: Position.create(e.line, e.range.end)
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
	Interpreter.errors.forEach(e => {
		diagnostics.push({
			severity: DiagnosticSeverity.Error,
			range: {
				start: Position.create(e.line, e.range.start),
				end: Position.create(e.line, e.range.end)
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
connection.onCompletion(
	(docPos: TextDocumentPositionParams): CompletionItem[] => {
		let compList: CompletionItem[] = [];
		Interpreter.getFunctions().forEach(f => {
			compList.push({
				label: f.name,
				kind: CompletionItemKind.Function,
				data: {obj: f}
			});
		});
		Interpreter.getTypes().forEach(t => {
			compList.push({
				label: t.name,
				kind: CompletionItemKind.Class,
				data: {obj: t}
			});
		});
		Interpreter.getVars().forEach(v => {
			let state = v.scope.isIncluded(docPos.position.line)? " is included": " is not included";
			if (v.scope.isIncluded(docPos.position.line) || v.scope.isZero())
				compList.push({
					label: v.name,
					kind: CompletionItemKind.Variable,
					data: {obj: v}
				});
		});

		return compList;
	}
);

// This handler resolves additional information for the item selected in
// the completion list.
connection.onCompletionResolve(
	(item: CompletionItem): CompletionItem => {
		switch (item.kind) {
			case CompletionItemKind.Class:
				item.detail = "Type "+item.data.obj.name;
				item.documentation = { kind: MarkupKind.Markdown, value: algo.Type.getDoc(item.data.obj) }
				break;

			case CompletionItemKind.Variable:
				item.detail = "Variable "+item.data.obj.name;
				item.documentation = { kind: MarkupKind.Markdown, value: algo.Variable.getDoc(item.data.obj) }
				break;

			case CompletionItemKind.Function:
				item.detail = "Fonction "+item.data.obj.name;
				item.documentation = { kind: MarkupKind.Markdown, value: algo.Function.getDoc(item.data.obj) }
				let args = "";
				item.data.obj.args.forEach((a: any) => {args += a.name+", ";});
				item.label = item.data.obj.name + "("+args.substring(0, args.length-2)+")";
				break;

			default:
				break;
		}
		return item;
	}
);

connection.onHover(({ textDocument, position }): Hover | undefined => {
    const document = documents.get(textDocument.uri);
	if (document == null)
		return undefined;

	let range = getWordRange(position.character, document.getText().split("\n")[position.line]);
	if (range == undefined)
		return undefined;
	let vName = document.getText({
		start: {line: position.line, character: range.start},
		end: {line: position.line, character: range.end}
	}).trim();
	let attr = Attribute.FromString(vName);
    if (!Attribute.isNull(attr)) {
		return {
			contents: {
				kind: MarkupKind.Markdown,
				value: Attribute.GenerateDoc(attr, true),
			}
		};
    }
	let type = Type.FromString(vName);
    if (!Type.isNull(type)) {
		return {
			contents: {
				kind: MarkupKind.Markdown,
				value: Type.GenerateDoc(type),
			}
		};
    }
	let func = Func.FromString(vName);
    if (!Func.isNull(func)) {
		return {
			contents: {
				kind: MarkupKind.Markdown,
				value: Func.GenerateDoc(func),
			}
		};
    }

	// type nor variable found, trying with variable's attribute
	let pathRange = getWordRange(position.character, document.getText().split("\n")[position.line], /[a-zA-Z0-9_\\.]/);
	if (pathRange != undefined) {
		let path = document.getText({
			start: {line: position.line, character: pathRange.start},
			end: {line: position.line, character: pathRange.end}
		}).trim().split(".");
		let tp = new Attribute();
		for (let i = 0; i < path.length; i++) {
			const t_name = path[i];
			if (Attribute.isNull(tp))
				tp = Attribute.FromString(t_name);
			else {
				tp.type.attrs.forEach(at => {
					if (at.name == t_name)
						tp = at;
				});
			}
			if(t_name == vName) break;
		}
		if (Attribute.isNull(tp))
			return undefined;
		return {
			contents: {
				kind: MarkupKind.Markdown,
				value: Attribute.GenerateDoc(tp, false),
			}
		};
	}
    return undefined;
});

connection.onNotification("custom/getScriptInfo", () => {
	connection.sendNotification("custom/setScriptInfo", {
		attrs: Analyzer.scriptAttrs,
		types: Analyzer.scriptTypes,
		bounds: Analyzer.lexiconBounds
	});
});

connection.onNotification("custom/launchAlgo", () => {
	Interpreter.launch(println);
});

function println(str: string) {
	connection.sendNotification("custom/log", str);
}
Analyzer.debug = println;

// Make the text document manager listen on the connection
// for open, change and close text document events
documents.listen(connection);

// Listen on the connection
connection.listen();