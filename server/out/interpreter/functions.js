"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.saveScriptFunctions = void 0;
const algo = require("./common");
function saveScriptFunctions() {
    let script = algo.getScript();
    for (let i = 0; i < script.length; i++) {
        const line = script[i].trim();
        if (line.trim().toLowerCase().startsWith("fonction")) { // function declaration
            let parts = line.split(/(\(|\))/); // split the name, the arguments, and the return type
            for (let j = 0; j < parts.length; j++) {
                if (parts[j] == "(" || parts[j] == ")") {
                    parts.splice(j, 1);
                    j--;
                }
            }
            if (parts.length < 3)
                return new algo.Error("Declaration de fonction incorrecte", i, new algo.Range(0, line.length));
            // get the function's name
            let name = parts[0].split(" ")[1].trim();
            let strargs = parts[1].trim().split(",");
            let strtype = parts[2].trim();
            let argsList = [];
            // get the function's return type
            let rtype;
            if (strtype.length > 0)
                rtype = algo.Type.FromString(strtype.split(":")[1].trim());
            else
                rtype = algo.Type.UNKNOWN;
            // get the function's arguments
            for (let j = 0; j < strargs.length; j++) {
                let carg = strargs[j];
                let argParts = carg.split(":");
                if (argParts.length < 2)
                    return new algo.Error("Declaration des arguments de fonction incorrecte", i, new algo.Range(0, line.length));
                let argName = argParts[0].trim();
                if (argName.length < 1)
                    return new algo.Error("Nom d'argument incorrect", i, new algo.Range(0, line.length));
                let typeName = argParts[1].trim();
                if (typeName.length < 1)
                    return new algo.Error("Type d'argument incorrect", i, new algo.Range(0, line.length));
                let argType = algo.Type.FromString(typeName);
                argsList.push(new algo.Variable(argName, argType));
            }
            ;
            let start = i, end = i;
            for (let j = i; j < script.length; j++) {
                const subline = script[j].trim().split(" ");
                if (subline.length > 0 && subline[0].toLowerCase() == algo.DEBUT_KEYWORD)
                    if (start == i)
                        start = j;
                if (subline.length > 0 && subline[0].toLowerCase() == algo.FIN_KEYWORD)
                    if (end == i)
                        end = j;
                if (start != i && end != i)
                    break;
            }
            if (start == i)
                return new algo.Error("Impossible de trouver le debut de la fonction", i, new algo.Range(0, line.length));
            if (end == i)
                return new algo.Error("Impossible de trouver la fin de la fonction", i, new algo.Range(0, line.length));
            // get the function range
            let range = new algo.Range(start, end);
            algo.tabFuncs_add(new algo.Function(name, argsList, rtype, range));
        }
    }
    ;
    return algo.Error.NO_ERROR;
}
exports.saveScriptFunctions = saveScriptFunctions;
//# sourceMappingURL=functions.js.map