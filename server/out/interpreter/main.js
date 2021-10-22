"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Interpreter = void 0;
const algo = require("./common");
const def = require("./default");
const functions_1 = require("./functions");
const global_1 = require("./global");
const variables_1 = require("./variables");
class Interpreter {
    static launch(debug = (str) => { }) {
        // finding all functions in script
        debug("==> Traitement de l'algorithme <==");
        Interpreter.processAlgorithm(debug);
        // checking for main function [algorithme] and execute it
        debug("==> Lancement de l'algorithme <==");
        debug("nombre de fonctions dans le script: " + algo.tabFuncs_get().length);
        algo.tabFuncs_get().forEach(f => {
            debug(f.toString());
        });
        // ending algorithme
        debug("==> Fin de l'algorithme <==");
    }
    static processAlgorithm(debug = (str) => { }) {
        // cleanup
        algo.tabFuncs_clear();
        algo.tabVars_clear();
        algo.tabTypes_clear();
        Interpreter.errors = [];
        algo.setAlgoRange(new algo.Range());
        // processing
        let err = (0, functions_1.saveScriptFunctions)();
        if (err != algo.Error.NO_ERROR)
            Interpreter.errors.push(err);
        err = (0, global_1.detectAlgoRange)();
        if (err != algo.Error.NO_ERROR)
            Interpreter.errors.push(err);
        if (algo.getAlgoRange().isZero())
            debug(new algo.Error("Impossible de trouver le debut de l'algorithme", 0, new algo.Range()).toString());
        else
            debug("Algo range: " + algo.getAlgoRange());
        err = (0, variables_1.saveScriptVariables)();
        if (err != algo.Error.NO_ERROR)
            Interpreter.errors.push(err);
    }
    static getFunctions(range = new algo.Range()) {
        return algo.Function.defaultFonctions.concat(algo.tabFuncs_get());
    }
    static getTypes(range = new algo.Range()) {
        return algo.Type.defaultTypes.concat(algo.Type.INTERNAL_TYPES).concat(algo.tabTypes_get());
    }
    static getVars(range = new algo.Range()) {
        return algo.Variable.defaultVars.concat(algo.tabVars_get());
    }
    static init() {
        algo.Type.defaultTypes = def.getDefaultTypes();
        algo.Function.defaultFonctions = def.getDefaultFonctions();
        algo.Variable.defaultVars = def.getDefaultVars();
    }
}
exports.Interpreter = Interpreter;
Interpreter.errors = [];
//# sourceMappingURL=main.js.map