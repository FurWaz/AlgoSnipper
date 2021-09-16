import * as vscode from 'vscode';

class Interpreter {
    public static launch() {
        const lines = vscode.window.activeTextEditor.document.getText().split("\n");
    }
}