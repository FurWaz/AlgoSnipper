/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

import * as path from 'path';
import * as vscode from 'vscode';
import {DoomView} from './doom';
import {
	LanguageClient,
	LanguageClientOptions,
	ServerOptions,
	TransportKind
} from 'vscode-languageclient/node';

let client: LanguageClient;

export function activate(context: vscode.ExtensionContext) {
	let insertArrow: vscode.Disposable = vscode.commands.registerCommand('algosnipper.insertArrow', function () {
		vscode.window.activeTextEditor.edit( (editBuilder) => {
			let position = vscode.window.activeTextEditor.selection.start;
			editBuilder.insert(position, "◄-");
		});
	});
	let genLexique: vscode.Disposable = vscode.commands.registerCommand('algosnipper.genLexique', function () {
		client.sendNotification("custom/getScriptInfo");
	});
	let launch: vscode.Disposable = vscode.commands.registerCommand('algosnipper.launch', function () {
		vscode.window.showInformationMessage("Lancement de l'algorithme ...");
		let program = vscode.window.activeTextEditor.document.getText().split("\n");
		let output = vscode.window.createOutputChannel("Algorithme");
		output.show(true);

		output.appendLine("--- Désolé, cette fonctionnalité n'est pas encore disponible ---");
	});

	let doom: vscode.Disposable = vscode.commands.registerCommand('algosnipper.launchDoom', function () {
		DoomView.createOrShow(vscode.Uri.file(context.extensionPath));
	})

	// The server is implemented in node
	let serverModule = context.asAbsolutePath(
		path.join('server', 'out', 'server.js')
	);
	// The debug options for the server
	// --inspect=6009: runs the server in Node's Inspector mode so VS Code can attach to the server for debugging
	let debugOptions = { execArgv: ['--nolazy', '--inspect=6009'] };

	// If the extension is launched in debug mode then the debug server options are used
	// Otherwise the run options are used
	let serverOptions: ServerOptions = {
		run: { module: serverModule, transport: TransportKind.ipc },
		debug: {
			module: serverModule,
			transport: TransportKind.ipc,
			options: debugOptions
		}
	};

	// Options to control the language client
	let clientOptions: LanguageClientOptions = {
		// Register the server for plain text documents
		documentSelector: [{ scheme: 'file', language: 'Algo' }],
		synchronize: {
			// Notify the server about file changes to '.clientrc files contained in the workspace
			fileEvents: vscode.workspace.createFileSystemWatcher('**/.clientrc')
		}
	};

	// Create the language client and start the client.
	client = new LanguageClient(
		'languageServerAlgo',
		'Language Server Algo',
		serverOptions,
		clientOptions
	);

	// Start the client. This will also launch the server
	client.start();
	client.onReady().then(() => {
		let output = vscode.window.createOutputChannel("Server output");
		output.show(true)
		client.onNotification("custom/log", (message: string) => {
			output.appendLine(message);
		});

		client.onNotification("custom/setScriptInfo", (data) => {
			generateLexique(data);
		});
	});

	context.subscriptions.push(genLexique);
	context.subscriptions.push(insertArrow);
	context.subscriptions.push(launch);
	context.subscriptions.push(doom);
}

function generateLexique(data: any) {
	vscode.window.activeTextEditor.edit( (editBuilder) => {
		let lexique = "lexique:\n";
		let attrs = data.attrs;
		let types = data.types;
		let bounds = data.bounds;
		types.forEach(t => {
			let attributes = "<";
			t.attrs.forEach(a => {
				let empty = true;
				a.name.split("").forEach(l=>{if(l!="_")empty=false;});
				if (empty) a.name = "a"+a.name.length;
				attributes += a.name+": "+a.type.name+", ";
			});
			attributes = attributes.substring(0, attributes.length-2)+">";
			lexique += "    "+t.name+" = "+attributes+" // description\n";
		});
		attrs.forEach(a => {
			lexique += "    "+a.name+": "+a.type.name+" // description\n";
		});
		editBuilder.insert(new vscode.Position(vscode.window.activeTextEditor.document.lineCount, 0), lexique);
	});
	vscode.window.showInformationMessage('Le lexique à bien été généré !');
}

export function deactivate(): Thenable<void> | undefined {
	if (!client) {
		return undefined;
	}
	return client.stop();
}