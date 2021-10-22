type Value = number | boolean | string | Variable[] | null;

class Range {
    public start: number;
    public end: number;

    public isZero() {
        return this.start == 0 && this.end == 0;
    }

    public constructor(start = 0, end = 0) {
        this.start = start;
        this.end = end;
    }
    
    public toString() {
        return `Range{start: ${this.start}, end: ${this.end}}`;
    }

    public isIncluded(nbr: number): boolean {
        return nbr >= this.start && nbr <= this.end;
    }

    public equals(r: Range): boolean {
        return r.start == this.start && r.end == this.end;
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

    public toString(): string {
        return `Erreur ligne ${this.line+1} : ${this.message}`;
    }
}

class Type {
    private static ID_COUNTER = 1;

    public static UNKNOWN = new Type("Inconnu", "// Type inconnu");
    public static INT     = new Type("entier", "// Nombre entier");
    public static FLOAT   = new Type("reel", "// Nombre reel");
    public static STRING  = new Type("chaine", "// Chaine de caracteres");
    public static CHAR    = new Type("caractere", "// Caractere informatique");
    public static BOOL    = new Type("booleen", "// Valeur booleenne");
    public static INTERNAL_TYPES = [Type.UNKNOWN, Type.INT, Type.FLOAT, Type.STRING, Type.CHAR, Type.BOOL];

    public static defaultTypes: Type[] = [];
    
    public static FromValue(str: string): Type {
        // fonction call, get function return value
        if (str.match(/[a-zA-Z0-9]+\(.*\)/)) {
            str = str.trim()
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

    public static FromString(str: string): Type {
        let res = Type.UNKNOWN;
        this.INTERNAL_TYPES.concat(this.defaultTypes).concat(tab_types).forEach(t => {
            if (t.name == str)
                res = t;
        });
        return res;
    }

    public static getDoc(t: Type): string {
        let doc = "Type **"+t.name+"**\n\n";
        doc += "**Description:**\n"
        doc += "```\n";
        doc += t.desc+"\n";
        doc += "```\n";
        return doc;
    }

    public id: number;
    public name: string;
    public subtype: Type|null;
    public desc: string;
    public isComposite: boolean;
    public attrs: Variable[];

    public constructor(name = "", desc = "", subtype: Type|null = null, isComposite = false, attrs = []) {
        this.id = Type.ID_COUNTER++;
        this.name = name;
        this.subtype = subtype;
        this.desc = desc;
        this.isComposite = isComposite;
        this.attrs = attrs;
    }
    
    public toString() {
        return `Type{name: ${this.name}, desc: ${this.desc}}`;
    }
}

class Variable {
    private static ID_COUNTER = 1;

    public id: number;
    public name: string;
    public type: Type;
    public desc: string;
    public value: Value;
    public scope: Range;

    public static defaultVars: Variable[] = [];

    public constructor(name = "", type = new Type(), desc = "// Aucune description", scope = new Range(), value = null) {
        this.id = Variable.ID_COUNTER++;
        this.name = name;
        this.desc = desc;
        this.type = type;
        this.value = value;
        this.scope = scope;
    }

    public static getDoc(attr: Variable, varSynthaxe: boolean = true): string {
        let val = ((varSynthaxe)? "Variable": "Attribut")+" **" + attr.name + "**";
		    val += "\n```algo";
			val += "\nnom: " + attr.name;
			val += "\ntype: " + attr.type.name;
			if (varSynthaxe) val += "\ndescription: " + attr.desc;
			val += "\n```\n\n"
			if (attr.type.isComposite) {
				val += "\n**Attributs:**";
				val += "\n```algo"
				attr.type.attrs.forEach(at => {
					val += "\n"+at.name+" ("+at.type.name+") "+at.desc;
				});
				val += "\n```\n\n"
			}
        return val;
    }
    
    public toString() {
        return `Attribute{name: ${this.name}, type: ${this.type}}`;
    }
}

class Function {
    private static ID_COUNTER = 1;

    public id: number;
    public name: string;
    public args: Variable[];
    public type: Type;
    public body: Range;

    public static defaultFonctions: Function[] = [];

    public constructor(name = "", args: Variable[] = [], type = new Type(), body = new Range()) {
        this.id = Function.ID_COUNTER++;
        this.name = name;
        this.args = args;
        this.type = type;
        this.body = body;
    }

    public static FromString(str: string): Function|null {
        let res: Function|null = null;
        this.defaultFonctions.concat(tab_funcs).forEach(f => {
            if (f.name == str)
                res = f;
        });
        return res;
    }

    public static getDoc(f: Function): string {
        let args: string[] = [];
        f.args.forEach(a => {
            args.push(`${a.name} (${a.type.name})`)
        });
        let doc = "Fonction **"+f.name+"**\n\n";
        doc += "**Arguments:**\n"
        doc += "```\n";
        doc += args.join("\n")+"\n";
        doc += "```\n";
        doc += "**Type de retour:**\n";
        doc += "```\n";
        doc += f.type.name+"\n";
        doc += "```\n";
        return doc;
    }

    public toString() {
        return `Function{name: ${this.name}, args: ${this.args.length}, type: ${this.type}, body: ${this.body}}`;
    }
}

let tab_funcs: Function[] = [];
let tab_vars: Variable[] = [];
let tab_types: Type[] = [];
let script: string[] = [];
let algoRange: Range = new Range();

function tabFuncs_clear() {
    tab_funcs = [];
}
function tabVars_clear() {
    tab_vars = [];
}
function tabTypes_clear() {
    tab_types = [];
}
function tabFuncs_add(f: Function) {
    tab_funcs.push(f);
}
function tabVars_add(v: Variable) {
    let exists = false;
    tab_vars.forEach(vr => {
        if (vr.name == v.name && v.scope.equals(vr.scope))
            exists = true;
    })
    if (!exists)
        tab_vars.push(v);
}
function tabTypes_add(t: Type) {
    tab_types.push(t);
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
function tabTypes_rem(t: Type) {
    for (let i = 0; i < tab_vars.length; i++)
        if (tab_vars[i].id == t.id) {
            tab_vars.splice(i, 1);
            break;
        }
}
function tabVars_get() {
    return tab_vars;
}
function tabFuncs_get() {
    return tab_funcs;
}
function tabTypes_get() {
    return tab_types;
}

function setScript(s:string[]) {
    script = s;
}
function getScript(): string[] {
    return script;
}
function setAlgoRange(range: Range) {
    algoRange = range;
}
function getAlgoRange(): Range {
    return algoRange;
}

export const DEBUT_KEYWORD = "debut";
export const FIN_KEYWORD = "fin";
export const POUR_KEYWORD = "pour";
export const FPOUR_KEYWORD = "fpour";
export const TANT_KEYWORD = "tant";
export const FTANT_KEYWORD = "ftant";
export const ASSIGNATION_KEYWORD = "<-";

export {
    Range, Error, Value, Type, Function, Variable,
    tabFuncs_clear, tabFuncs_add, tabFuncs_rem, tabFuncs_get,
    tabVars_clear, tabVars_add, tabVars_rem, tabVars_get,
    tabTypes_clear, tabTypes_add, tabTypes_rem, tabTypes_get,
    setScript, getScript, setAlgoRange, getAlgoRange
};