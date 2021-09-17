import * as algo from './common';

export function saveScriptFunctions(): algo.Error {
    let script = algo.getScript();
    for (let i = 0; i < script.length; i++) {
        const line = script[i].trim();

        if (line.startsWith("fonction")) { // function declaration
            let parts = line.split(/(\(\))/); // split the name, the arguments, and the return type
            if (parts.length < 3)
                return new algo.Error("Declaration de fonction incorrecte", i, new algo.Range(0, line.length));

            let name = parts[0].split(" ")[1].trim();
            let strargs = parts[1].trim().split(",");
            let strtype = parts[2].trim();

            let rtype = new algo.Type();
            if (strtype.length > 0)
                rtype = algo.Type.FromString(strtype.split(":")[1].trim());
            // TODO
        }
    };
}