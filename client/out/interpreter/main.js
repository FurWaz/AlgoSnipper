"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Interpreter = void 0;
const vscode = require("vscode");
const algo = require("./common");
const def = require("./default");
const functions_1 = require("./functions");
const global_1 = require("./global");
class Interpreter {
    static launch() {
        const lines = vscode.window.activeTextEditor.document.getText().split("\n");
        let output = vscode.window.createOutputChannel("Algosnipper");
        output.show(true);
        // cleanup
        algo.tabFuncs_clear();
        algo.tabVars_clear();
        algo.tabTypes_clear();
        algo.setAlgoRange(new algo.Range());
        algo.setScript(lines);
        // finding all functions in script
        output.appendLine("==> Traitement de l'algorithme <==");
        let err = (0, functions_1.saveScriptFunctions)();
        if (err != algo.Error.NO_ERROR)
            output.appendLine(err.toString());
        err = (0, global_1.detectAlgoRange)();
        if (err != algo.Error.NO_ERROR)
            output.appendLine(err.toString());
        if (algo.getAlgoRange().isZero())
            output.appendLine(new algo.Error("Impossible de trouver le debut de l'algorithme", 0, new algo.Range()).toString());
        else
            output.appendLine("Algo range: " + algo.getAlgoRange());
        // checking for main function [algorithme] and execute it
        output.appendLine("==> Lancement de l'algorithme <==");
        output.appendLine("nombre de fonctions dans le script: " + algo.tabFuncs_get().length);
        algo.tabFuncs_get().forEach(f => {
            output.appendLine(f.toString());
        });
        // ending algorithme
        output.appendLine("==> Fin de l'algorithme <==");
    }
    static getFunctions(range = new algo.Range()) {
        return def.defaultFonctions.concat(algo.tabFuncs_get());
    }
    static getTypes(range = new algo.Range()) {
        return def.defaultTypes.concat(algo.tabTypes_get());
    }
    static getVars(range = new algo.Range()) {
        return def.defaultVars.concat(algo.tabVars_get());
    }
}
exports.Interpreter = Interpreter;
//# sourceMappingURL=main.js.map