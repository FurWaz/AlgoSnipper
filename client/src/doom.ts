import * as vscode from 'vscode';

/**
 * Manages cat coding webview panels
 */
export class DoomView {
	/**
	 * Track the currently panel. Only allow a single panel to exist at a time.
	 */
	public static currentPanel: DoomView | undefined;

	public static readonly viewType = 'DoomView';
	public static _extensionURI: vscode.Uri;

	private readonly _panel: vscode.WebviewPanel;
	private _disposables: vscode.Disposable[] = [];

	public static createOrShow(extensionUri: vscode.Uri) {
		const column = vscode.window.activeTextEditor
			? vscode.window.activeTextEditor.viewColumn
			: undefined;
			
		vscode.window.showInformationMessage(extensionUri.fsPath);
		DoomView._extensionURI = extensionUri;
		// If we already have a panel, show it.
		if (DoomView.currentPanel) {
			DoomView.currentPanel._panel.reveal(column);
			return;
		}
		
		// Otherwise, create a new panel.
		const panel = vscode.window.createWebviewPanel(
			DoomView.viewType,
			'Doom view',
			column || vscode.ViewColumn.One,
			{enableScripts: true}
		);
			
		DoomView.currentPanel = new DoomView(panel);
	}

	public static revive(panel: vscode.WebviewPanel) {
		DoomView.currentPanel = new DoomView(panel);
	}

	private constructor(panel: vscode.WebviewPanel) {
		this._panel = panel;

		// Set the webview's initial html content
		this._update(DoomView._extensionURI);

		// Listen for when the panel is disposed
		// This happens when the user closes the panel or when the panel is closed programatically
		this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

		// Update the content based on view changes
		this._panel.onDidChangeViewState(
			e => {
				if (this._panel.visible) {
					this._update(DoomView._extensionURI);
				}
			},
			null,
			this._disposables
		);

		// Handle messages from the webview
		this._panel.webview.onDidReceiveMessage(
			message => {
				switch (message.command) {
					case 'alert':
						vscode.window.showErrorMessage(message.text);
						return;
				}
			},
			null,
			this._disposables
		);
	}

	public doRefactor() {
		// Send a message to the webview webview.
		// You can send any JSON serializable data.
		this._panel.webview.postMessage({ command: 'refactor' });
	}

	public dispose() {
		DoomView.currentPanel = undefined;

		// Clean up our resources
		this._panel.dispose();

		while (this._disposables.length) {
			const x = this._disposables.pop();
			if (x) {
				x.dispose();
			}
		}
	}

	private _update(extUri: vscode.Uri) {
		this._panel.title = "Doom view";
		this._panel.webview.html = this._getHtmlForWebview(extUri);
	}

	private _getHtmlForWebview(extUri: vscode.Uri) {
		return `
		<!DOCTYPE html>
		<html>
			<head>
				<title>Doom view</title>
			</head>
			<body style="margin: 0px; padding: 0px; overflow: hidden;">
			<iframe
				src="https://dos.zone/en/play/https%3A%2F%2Fdoszone-uploads.s3.dualstack.eu-central-1.amazonaws.com%2Foriginal%2F2X%2Fe%2Fede529c8e71c94363f9f3c8fd84519608bd632ea.jsdos?turbo=0"
				style="width: 100vw; height: 100vh; border: none; transform-origin: bottom center; transform: scale(1.1); z-index: 1;"
				>
			</iframe>
			<div style="background-color: black; position: fixed; top: 0px; right: 0px; width: 100px; height: 100px; z-index: 10"></div>
			</body>
		</html>
		`;
	}
}