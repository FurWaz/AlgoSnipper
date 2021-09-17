type Value = number | boolean | string | Attribute[] | null;

class Range {
    public start: number;
    public end: number;

    public constructor(start = 0, end = 0) {
        this.start = start;
        this.end = end;
    }
}

class Error {
    public static NO_ERROR = new Error("", -1);

    public static HasFailed(err: Error) {
        return err.line >= 0;
    }

    public line: number;
    public range: Range;
    public message: string;

    public constructor(message = "", line = 0, range = new Range()) {
        this.message = message;
        this.line = line;
        this.range = range;
    }
}

class Type {
    public static UNKNOWN = new Type("Inconnu",   0, "// Type inconnu");
    public static INT     = new Type("entier",    1, "// Nombre entier");
    public static FLOAT   = new Type("reel",      2, "// Nombre reel");
    public static STRING  = new Type("chaine",    3, "// Chaine de caracteres");
    public static CHAR    = new Type("caractere", 4, "// Caractere informatique");
    public static BOOL    = new Type("booleen",   5, "// Valeur booleenne");

    public static FromString(str: string): Type {
        return new Type(); // TODO
    }

    public name: string;
    public code: number;
    public desc: string;

    public constructor(name = "", code = 0, desc = "") {
        this.name = name;
        this.code = code;
        this.desc = desc;
    }
}

class Attribute {
    private static ID_COUNTER = 1;

    public id: number;
    public name: string;
    public type: Type;

    public constructor(name = "", type = new Type()) {
        this.id = Attribute.ID_COUNTER++;
        this.name = name;
        this.type = type;
    }
}

class Function {
    private static ID_COUNTER = 1;

    public id: number;
    public name: string;
    public args: Attribute[];
    public type: Type;
    public body: Range;

    public constructor(name = "", args = [], type = new Type(), body = new Range()) {
        this.id = Function.ID_COUNTER++;
        this.name = name;
        this.args = args;
        this.type = type;
        this.body = body;
    }
}

class Variable {
    private static ID_COUNTER = 1;
    
    public id: number;
    public name: string;
    public type: Type;
    public value: Value;
    public scope: Range;

    public constructor(name = "", type = new Type(), value = null, scope = new Range()) {
        this.id = Variable.ID_COUNTER++;
        this.name = name;
        this.type = type;
        this.value = value;
        this.scope = scope;
    }
}

let tab_funcs: Function[] = [];
let tab_vars: Variable[] = [];
let script: string[] = [];

function tabFuncs_clear() {
    tab_funcs = [];
}
function tabVars_clear() {
    tab_vars = [];
}
function tabFuncs_add(f: Function) {
    tab_funcs.push(f);
}
function tabVars_add(v: Variable) {
    tab_vars.push(v);
}
function tabFuncs_rem(f: Function) {
    for (let i = 0; i < tab_funcs.length; i++)
        if (tab_funcs[i].id == f.id) {
            tab_funcs.splice(i, 1);
            break;
        }
}
function tabVars_rem(v: Variable) {
    for (let i = 0; i < tab_vars.length; i++)
        if (tab_vars[i].id == v.id) {
            tab_vars.splice(i, 1);
            break;
        }
}

function setScript(script:string[]) {
    script = script;
}
function getScript(): string[] {
    return script;
}

export {
    Range, Error, Value, Type, Attribute, Function, 
    tabFuncs_clear, tabFuncs_add, tabFuncs_rem,
    tabVars_clear, tabVars_add, tabVars_rem,
    setScript, getScript
};