"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAlgoRange = exports.setAlgoRange = exports.getScript = exports.setScript = exports.tabTypes_get = exports.tabTypes_rem = exports.tabTypes_add = exports.tabTypes_clear = exports.tabVars_get = exports.tabVars_rem = exports.tabVars_add = exports.tabVars_clear = exports.tabFuncs_get = exports.tabFuncs_rem = exports.tabFuncs_add = exports.tabFuncs_clear = exports.Variable = exports.Function = exports.Type = exports.Error = exports.Range = exports.ASSIGNATION_KEYWORD = exports.FTANT_KEYWORD = exports.TANT_KEYWORD = exports.FPOUR_KEYWORD = exports.POUR_KEYWORD = exports.FIN_KEYWORD = exports.DEBUT_KEYWORD = void 0;
class Range {
    constructor(start = 0, end = 0) {
        this.start = start;
        this.end = end;
    }
    isZero() {
        return this.start == 0 && this.end == 0;
    }
    toString() {
        return `Range{start: ${this.start}, end: ${this.end}}`;
    }
    isIncluded(nbr) {
        return nbr >= this.start && nbr <= this.end;
    }
    equals(r) {
        return r.start == this.start && r.end == this.end;
    }
}
exports.Range = Range;
class Error {
    constructor(message = "", line = 0, range = new Range()) {
        this.message = message;
        this.line = line;
        this.range = range;
    }
    static HasFailed(err) {
        return err.line >= 0;
    }
    toString() {
        return `Erreur ligne ${this.line + 1} : ${this.message}`;
    }
}
exports.Error = Error;
Error.NO_ERROR = new Error("", -1);
class Type {
    constructor(name = "", desc = "", subtype = null, isComposite = false, attrs = []) {
        this.id = Type.ID_COUNTER++;
        this.name = name;
        this.subtype = subtype;
        this.desc = desc;
        this.isComposite = isComposite;
        this.attrs = attrs;
    }
    static FromValue(str) {
        // fonction call, get function return value
        if (str.match(/[a-zA-Z0-9]+\(.*\)/)) {
            str = str.trim();
            let func = Function.FromString(str.split("(")[0]);
            if (func != null)
                return func.type;
        }
        // default types
        if (str.startsWith('"') && str.endsWith('"'))
            return new Type("chaine");
        if (str.startsWith("'") && str.endsWith("'") && str.length == 3)
            return new Type("caractere");
        if (str == "vrai" || str == "faux")
            return new Type("booleen");
        if (str.match(/^[0-9]+$/))
            return new Type("entier");
        if (str.match(/^[0-9]+\.[0-9]+$/))
            return new Type("reel");
        return Type.UNKNOWN;
    }
    static FromString(str) {
        let res = Type.UNKNOWN;
        this.INTERNAL_TYPES.concat(this.defaultTypes).concat(tab_types).forEach(t => {
            if (t.name == str)
                res = t;
        });
        return res;
    }
    static getDoc(t) {
        let doc = "Type **" + t.name + "**\n\n";
        doc += "**Description:**\n";
        doc += "```\n";
        doc += t.desc + "\n";
        doc += "```\n";
        return doc;
    }
    toString() {
        return `Type{name: ${this.name}, desc: ${this.desc}}`;
    }
}
exports.Type = Type;
Type.ID_COUNTER = 1;
Type.UNKNOWN = new Type("Inconnu", "// Type inconnu");
Type.INT = new Type("entier", "// Nombre entier");
Type.FLOAT = new Type("reel", "// Nombre reel");
Type.STRING = new Type("chaine", "// Chaine de caracteres");
Type.CHAR = new Type("caractere", "// Caractere informatique");
Type.BOOL = new Type("booleen", "// Valeur booleenne");
Type.INTERNAL_TYPES = [Type.UNKNOWN, Type.INT, Type.FLOAT, Type.STRING, Type.CHAR, Type.BOOL];
Type.defaultTypes = [];
class Variable {
    constructor(name = "", type = new Type(), desc = "// Aucune description", scope = new Range(), value = null) {
        this.id = Variable.ID_COUNTER++;
        this.name = name;
        this.desc = desc;
        this.type = type;
        this.value = value;
        this.scope = scope;
    }
    static getDoc(attr, varSynthaxe = true) {
        let val = ((varSynthaxe) ? "Variable" : "Attribut") + " **" + attr.name + "**";
        val += "\n```algo";
        val += "\nnom: " + attr.name;
        val += "\ntype: " + attr.type.name;
        if (varSynthaxe)
            val += "\ndescription: " + attr.desc;
        val += "\n```\n\n";
        if (attr.type.isComposite) {
            val += "\n**Attributs:**";
            val += "\n```algo";
            attr.type.attrs.forEach(at => {
                val += "\n" + at.name + " (" + at.type.name + ") " + at.desc;
            });
            val += "\n```\n\n";
        }
        return val;
    }
    toString() {
        return `Attribute{name: ${this.name}, type: ${this.type}}`;
    }
}
exports.Variable = Variable;
Variable.ID_COUNTER = 1;
Variable.defaultVars = [];
class Function {
    constructor(name = "", args = [], type = new Type(), body = new Range()) {
        this.id = Function.ID_COUNTER++;
        this.name = name;
        this.args = args;
        this.type = type;
        this.body = body;
    }
    static FromString(str) {
        let res = null;
        this.defaultFonctions.concat(tab_funcs).forEach(f => {
            if (f.name == str)
                res = f;
        });
        return res;
    }
    static getDoc(f) {
        let args = [];
        f.args.forEach(a => {
            args.push(`${a.name} (${a.type.name})`);
        });
        let doc = "Fonction **" + f.name + "**\n\n";
        doc += "**Arguments:**\n";
        doc += "```\n";
        doc += args.join("\n") + "\n";
        doc += "```\n";
        doc += "**Type de retour:**\n";
        doc += "```\n";
        doc += f.type.name + "\n";
        doc += "```\n";
        return doc;
    }
    toString() {
        return `Function{name: ${this.name}, args: ${this.args.length}, type: ${this.type}, body: ${this.body}}`;
    }
}
exports.Function = Function;
Function.ID_COUNTER = 1;
Function.defaultFonctions = [];
let tab_funcs = [];
let tab_vars = [];
let tab_types = [];
let script = [];
let algoRange = new Range();
function tabFuncs_clear() {
    tab_funcs = [];
}
exports.tabFuncs_clear = tabFuncs_clear;
function tabVars_clear() {
    tab_vars = [];
}
exports.tabVars_clear = tabVars_clear;
function tabTypes_clear() {
    tab_types = [];
}
exports.tabTypes_clear = tabTypes_clear;
function tabFuncs_add(f) {
    tab_funcs.push(f);
}
exports.tabFuncs_add = tabFuncs_add;
function tabVars_add(v) {
    let exists = false;
    tab_vars.forEach(vr => {
        if (vr.name == v.name && v.scope.equals(vr.scope))
            exists = true;
    });
    if (!exists)
        tab_vars.push(v);
}
exports.tabVars_add = tabVars_add;
function tabTypes_add(t) {
    tab_types.push(t);
}
exports.tabTypes_add = tabTypes_add;
function tabFuncs_rem(f) {
    for (let i = 0; i < tab_funcs.length; i++)
        if (tab_funcs[i].id == f.id) {
            tab_funcs.splice(i, 1);
            break;
        }
}
exports.tabFuncs_rem = tabFuncs_rem;
function tabVars_rem(v) {
    for (let i = 0; i < tab_vars.length; i++)
        if (tab_vars[i].id == v.id) {
            tab_vars.splice(i, 1);
            break;
        }
}
exports.tabVars_rem = tabVars_rem;
function tabTypes_rem(t) {
    for (let i = 0; i < tab_vars.length; i++)
        if (tab_vars[i].id == t.id) {
            tab_vars.splice(i, 1);
            break;
        }
}
exports.tabTypes_rem = tabTypes_rem;
function tabVars_get() {
    return tab_vars;
}
exports.tabVars_get = tabVars_get;
function tabFuncs_get() {
    return tab_funcs;
}
exports.tabFuncs_get = tabFuncs_get;
function tabTypes_get() {
    return tab_types;
}
exports.tabTypes_get = tabTypes_get;
function setScript(s) {
    script = s;
}
exports.setScript = setScript;
function getScript() {
    return script;
}
exports.getScript = getScript;
function setAlgoRange(range) {
    algoRange = range;
}
exports.setAlgoRange = setAlgoRange;
function getAlgoRange() {
    return algoRange;
}
exports.getAlgoRange = getAlgoRange;
exports.DEBUT_KEYWORD = "debut";
exports.FIN_KEYWORD = "fin";
exports.POUR_KEYWORD = "pour";
exports.FPOUR_KEYWORD = "fpour";
exports.TANT_KEYWORD = "tant";
exports.FTANT_KEYWORD = "ftant";
exports.ASSIGNATION_KEYWORD = "<-";
//# sourceMappingURL=common.js.map