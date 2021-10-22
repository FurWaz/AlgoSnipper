"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.saveScriptVariables = void 0;
const algo = require("./common");
function saveScriptVariables() {
    let script = algo.getScript();
    for (let i = 0; i < script.length; i++) {
        const line = script[i].trim();
        let parts = line.split(algo.ASSIGNATION_KEYWORD);
        if (parts.length > 1) {
            let name = parts[0].trim();
            let value = parts[1].trim();
            let range = new algo.Range();
            if (algo.getAlgoRange().isIncluded(i))
                range = algo.getAlgoRange();
            algo.tabFuncs_get().forEach(f => {
                if (f.body.isIncluded(i))
                    range = f.body;
            });
            algo.tabVars_add(new algo.Variable(name, algo.Type.FromValue(value), "", range));
        }
    }
    return algo.Error.NO_ERROR;
}
exports.saveScriptVariables = saveScriptVariables;
//# sourceMappingURL=variables.js.map