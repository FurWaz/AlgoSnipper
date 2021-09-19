"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getScript = exports.setScript = exports.tabVars_rem = exports.tabVars_add = exports.tabVars_clear = exports.tabFuncs_rem = exports.tabFuncs_add = exports.tabFuncs_clear = exports.Function = exports.Attribute = exports.Type = exports.Error = exports.Range = void 0;
class Range {
    constructor(start = 0, end = 0) {
        this.start = start;
        this.end = end;
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
}
exports.Error = Error;
Error.NO_ERROR = new Error("", -1);
class Type {
    constructor(name = "", code = 0, desc = "") {
        this.name = name;
        this.code = code;
        this.desc = desc;
    }
    static FromString(str) {
        return new Type(); // TODO
    }
}
exports.Type = Type;
Type.UNKNOWN = new Type("Inconnu", 0, "// Type inconnu");
Type.INT = new Type("entier", 1, "// Nombre entier");
Type.FLOAT = new Type("reel", 2, "// Nombre reel");
Type.STRING = new Type("chaine", 3, "// Chaine de caracteres");
Type.CHAR = new Type("caractere", 4, "// Caractere informatique");
Type.BOOL = new Type("booleen", 5, "// Valeur booleenne");
class Attribute {
    constructor(name = "", type = new Type()) {
        this.id = Attribute.ID_COUNTER++;
        this.name = name;
        this.type = type;
    }
}
exports.Attribute = Attribute;
Attribute.ID_COUNTER = 1;
class Function {
    constructor(name = "", args = [], type = new Type(), body = new Range()) {
        this.id = Function.ID_COUNTER++;
        this.name = name;
        this.args = args;
        this.type = type;
        this.body = body;
    }
}
exports.Function = Function;
Function.ID_COUNTER = 1;
class Variable {
    constructor(name = "", type = new Type(), value = null, scope = new Range()) {
        this.id = Variable.ID_COUNTER++;
        this.name = name;
        this.type = type;
        this.value = value;
        this.scope = scope;
    }
}
Variable.ID_COUNTER = 1;
let tab_funcs = [];
let tab_vars = [];
let script = [];
function tabFuncs_clear() {
    tab_funcs = [];
}
exports.tabFuncs_clear = tabFuncs_clear;
function tabVars_clear() {
    tab_vars = [];
}
exports.tabVars_clear = tabVars_clear;
function tabFuncs_add(f) {
    tab_funcs.push(f);
}
exports.tabFuncs_add = tabFuncs_add;
function tabVars_add(v) {
    tab_vars.push(v);
}
exports.tabVars_add = tabVars_add;
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
function setScript(script) {
    script = script;
}
exports.setScript = setScript;
function getScript() {
    return script;
}
exports.getScript = getScript;
//# sourceMappingURL=common.js.map