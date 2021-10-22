import * as algo from './common';
import * as def from './default';
import { saveScriptFunctions } from "./functions";
import { detectAlgoRange } from './global';
import { saveScriptVariables } from './variables';

export class Interpreter {
    public static errors: algo.Error[] = [];

    public static launch(debug = (str:string)=>{}) {
        // finding all functions in script
        debug("==> Traitement de l'algorithme <==");
        Interpreter.processAlgorithm(debug);

        // checking for main function [algorithme] and execute it
        debug("==> Lancement de l'algorithme <==");
        debug("nombre de fonctions dans le script: "+algo.tabFuncs_get().length);
        algo.tabFuncs_get().forEach(f => {
            debug(f.toString());
        });

        // ending algorithme
        debug("==> Fin de l'algorithme <==");
    }

    public static processAlgorithm(debug=(str:string)=>{}) {
        // cleanup
        algo.tabFuncs_clear();
        algo.tabVars_clear();
        algo.tabTypes_clear();
        Interpreter.errors = [];
        algo.setAlgoRange(new algo.Range());

        // processing
        let err = saveScriptFunctions();
        if (err != algo.Error.NO_ERROR) Interpreter.errors.push(err);
        err = detectAlgoRange();
        if (err != algo.Error.NO_ERROR) Interpreter.errors.push(err);
        if (algo.getAlgoRange().isZero())
            debug(new algo.Error("Impossible de trouver le debut de l'algorithme", 0, new algo.Range()).toString());
        else debug("Algo range: "+algo.getAlgoRange());
        err = saveScriptVariables();
        if (err != algo.Error.NO_ERROR) Interpreter.errors.push(err);
    }

    public static getFunctions(range = new algo.Range()): algo.Function[] {
        return algo.Function.defaultFonctions.concat(algo.tabFuncs_get());
    }

    public static getTypes(range = new algo.Range()): algo.Type[] {
        return algo.Type.defaultTypes.concat(algo.Type.INTERNAL_TYPES).concat(algo.tabTypes_get());
    }

    public static getVars(range = new algo.Range()): algo.Variable[] {
        return algo.Variable.defaultVars.concat(algo.tabVars_get());
    }

    public static init() {
        algo.Type.defaultTypes = def.getDefaultTypes();
        algo.Function.defaultFonctions = def.getDefaultFonctions();
        algo.Variable.defaultVars = def.getDefaultVars();
    }
}