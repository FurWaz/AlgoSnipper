import * as vscode from 'vscode';
import * as algo from './common';

class Interpreter {
    public static launch() {
        const lines = vscode.window.activeTextEditor.document.getText().split("\n");
        let output = vscode.window.createOutputChannel("Algosnipper");
        output.show(true);

        // cleanup
        algo.tabFuncs_clear();
        algo.tabVars_clear();
        algo.setScript(lines);

        // finding all functions in script
        output.appendLine("==> Traitement de l'algorithme <==");

        // checking for main function [algorithme] and execute it
        output.appendLine("==> Lancement de l'algorithme <==");

        // ending algorithme
        output.appendLine("==> Fin de l'algorithme <==");
    }
}