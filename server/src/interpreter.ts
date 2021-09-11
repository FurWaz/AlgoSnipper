export function getWordRange(index: number, sample: string, regex: RegExp = /[a-zA-Z0-9_]/): Range | undefined {
    let start = index;
	let end = index;
	let char = sample[index];
	while (char.match(regex)) {
		start--;
		if (start <= 0) break;
        char = sample.substring(start-1, start);
	}
    char = sample.substring(end, end+1);
	while (char.match(regex)) {
		end++;
		if (end >= 30) return undefined;
		char = sample.substring(end, end+1);
	}
    return new Range(start, end);
}

export class Range {
    public start: number;
    public end: number;
    public constructor(start: number, end: number) {
        this.start = start;
        this.end = end;
    }
}

export class Attribute {
    public name: string;
    public type: Type;
    public desc: string;

    public static isNull(attr: Attribute): boolean {
        return attr.name == "";
    }

    public static GenerateDoc(attr: Attribute, varSynthaxe: boolean = false): string {
        let val = ((varSynthaxe)? "Variable": "Attribut")+" **" + attr.name + "**";
		    val += "\n```algo";
			val += "\nnom: " + attr.name;
			val += "\ntype: " + attr.type.name;
			if (varSynthaxe) val += "\ndescription: " + attr.desc;
			val += "\n```\n\n"
			if (attr.type.code == Type.COMPOSITE) {
				val += "\n**Attributs:**";
				val += "\n```algo"
				attr.type.attrs.forEach(at => {
					val += "\n"+at.name+" ("+at.type.name+") "+at.desc;
				});
				val += "\n```\n\n"
			}
        return val;
    }

    public static FromString(str: string): Attribute {
        let res = new Attribute();
        Interpreter.lexiconAttrs.forEach(t => {
            if (t.name.toLowerCase() == str.toLowerCase())
                res = new Variable(t.name, t.type, t.desc);
        });
        return res;
    }

    public constructor(name: string = "", type: Type = new Type(), desc: string = "") {
        this.name = name;
        this.type = type;
        this.desc = desc;
    }
}

export class Type {
    public static REEL = 0;
    public static ENTIER = 1;
    public static CHAINE = 2;
    public static BOOLEEN = 3;
    public static CARACTERE = 4;
    public static COMPOSITE = 5;
    public code: number;
    public name: string;
    public desc: string;
    public attrs: Attribute[];

    public static isNull(type: Type): boolean {
        return type.name == "";
    }

    public static GenerateDoc(type: Type): string {
        let val = "Type **" + type.name + "**";
		    val += "\n```algo";
			val += "\nnom: " + type.name;
			val += "\ndescription: " + type.desc;
			val += "\n```\n\n";
			if (type.code == Type.COMPOSITE) {
				val += "\n**Attributs:**"
				val += "\n```algo"
				type.attrs.forEach(a => {
					val += "\n"+a.name+" ("+a.type.name+") ";
				});
				val += "\n```";
			}
        return val;
    }

    public static String2Code(str: string): number {
        let res = Type.COMPOSITE;
        switch (str) {
            case "reel": res = Type.REEL; break;
            case "entier": res = Type.ENTIER; break;
            case "chaine": res = Type.CHAINE; break;
            case "booleen": res = Type.BOOLEEN; break;
            case "caractere": res = Type.CARACTERE; break;
            default: res = Type.COMPOSITE; break;
        }
        return res;
    }

    public static FromString(str: string): Type {
        let res = new Type();
        let code = Type.String2Code(str);
        if (code == Type.COMPOSITE)
            Interpreter.lexiconTypes.forEach(t => {
                if (t.name == str)
                    res = t;
            });
        else {
            res = new Type(str);
        }
        return res;
    }

    public static AttrsFromType(str: string): Attribute[] {
        let matchingType = this.FromString(str);
        if (!this.isNull(matchingType))
            return matchingType.attrs;
        return [];
    }

    public static DescFromType(str: string): string {
        let res: string = "// ";
        let found = true;
        switch (str) {
            case "reel": res += "Nombre reel"; break;
            case "entier": res += "Nombre entier"; break;
            case "chaine": res += "Chaine de caracteres"; break;
            case "booleen": res += "Valeur booleenne"; break;
            case "caractere": res += "Caractere"; break;
            default: found = false; break;
        }
        if (!found) {
            let matchingType: Type = new Type();
            Interpreter.lexiconTypes.forEach(t => {
                if (t.name == str) {
                    matchingType = t;
                }
            });
            if (matchingType.name != "")
                return matchingType.desc;
        }
        return res;
    }

    public constructor(name: string = "", attrs: Attribute[] = [], desc: string = "") {
        this.name = name;
        this.desc = desc;
        this.code = Type.String2Code(name);
        this.attrs = attrs;

        if (this.code != Type.COMPOSITE) {
            switch (this.code) {
                case Type.REEL: this.desc = "// Nombre reel"; break;
                case Type.ENTIER: this.desc = "// Nombre entier"; break;
                case Type.BOOLEEN: this.desc = "// valeur booleenne"; break;
                case Type.CHAINE: this.desc = "// Chaine de caracteres"; break;
                case Type.CARACTERE: this.desc = "// Caractere informatique"; break;
                default: break;
            }
        }
    }
}

export class Variable {
    public name: string;
    public desc: string;
    public type: Type;
    public value: number | boolean | string | Variable[];

    public static isNull(v: Variable): boolean {
        return v.name == "";
    }

    public static FromString(str: string): Variable {
        let res = new Variable();
        // TODO
        return res;
    }

    public constructor(name: string = "", type: Type = new Type(), desc: string = "", value: number | boolean | string | Variable[] = []) {
        this.name = name;
        this.desc = desc;
        this.value = value;
        this.type = type;
    }
}

export class ScriptError {
    public message: string;
    public line: number;
    public range: Range;
    public constructor(message: string, line: number, range: Range) {
        this.message = message;
        this.line = line;
        this.range = range;
    }
}

export class Interpreter {
    public static scriptVariables: Variable[] = [];
    public static lexiconAttrs: Attribute[] = [];
    public static lexiconTypes: Type[] = [];
    public static LexiconErrors: ScriptError[] = [];
    public static document: string[] = [];

    public static defaultTypes = [
        new Type("reel"),
        new Type("entier"),
        new Type("chaine"),
        new Type("caractere"),
        new Type("booleen"),
    ];

    private static LEXICON_VAR_REGEX = / *[a-zA-Z][a-zA-Z0-9]* *: *[a-zA-Z][a-zA-Z0-9]* *(\/\/.*)*$/;
    private static LEXICON_TYPE_REGEX = /^ *[a-zA-Z][a-zA-Z0-9]* *= *< *([a-z][a-zA-Z0-9]*) *: *([a-zA-Z0-9]+ *)(, *([a-z][a-zA-Z0-9]*) *: *([a-zA-Z0-9]+) *)*> *(\/\/.*)*$/;

    public static setDocument(document: string[]) {
        this.document = document;
    }

    public static processLexiconInfos() {
        this.LexiconErrors = [];
        // get lexicon range (first line included, last line not included)
        let lexiconStart = -1, lexiconEnd = -1;
        for (let i = this.document.length-1; i > 0; i--)
            if (this.document[i].trim().match(this.LEXICON_VAR_REGEX) || this.document[i].trim().match(this.LEXICON_TYPE_REGEX)) {
                lexiconEnd = i+1;
                break;
            }
        for (let i = this.document.length-1; i > 0; i--)
            if (this.document[i].trim().toLowerCase().startsWith("lexique")) {
                lexiconStart = i+1;
                break;
            }

        if (lexiconStart == -1 || lexiconEnd == -1) {
            // this.LexiconErrors.push(
            //     new ScriptError(
            //         "Lexique introuvable",
            //         Interpreter.document.length-1,
            //         new Range(0, Interpreter.document[Interpreter.document.length-1].length)
            //     )
            // );
            return;
        }

        // get the lexicon types
        this.lexiconTypes = [];
        for (let i = lexiconStart; i < lexiconEnd; i++) {
            const line = this.document[i];
            if (!line.trim().match(Interpreter.LEXICON_TYPE_REGEX))
                continue;
            let part1 = line.split("=");
            if (part1.length < 2) {
                this.LexiconErrors.push(
                    new ScriptError("Syntaxe de declaration de type incorrecte", i, new Range(0, line.length))
                );
                continue;
            }
            let name = part1[0].trim();
            let part2 = part1[1].split("//");
            let desc = "// commentaire";
            if (part2.length > 1)
                desc = "// " + part2[1].trim();
            let type = part2[0].trim();
            let typeCode = Type.String2Code(type);
            if (typeCode != Type.COMPOSITE) {
                this.LexiconErrors.push(
                    new ScriptError("Valeur de type incorrecte", i, new Range(0, line.length))
                );
                continue;
            }
            let parts = type.substring(1, type.length-1).split(",");
            let attrs: Attribute[] = [];
            let shift = line.split("<")[0].length;
            parts.forEach(p => {
                shift += p.length+1;
                let curvar = p.split(":");
                if (curvar.length < 2) {
                    this.LexiconErrors.push(
                        new ScriptError("Syntaxe de declaration d'attribut incorrecte", i, new Range(shift-p.length, shift))
                    );
                    return;
                }
                let n = curvar[0].trim();
                let tp = curvar[1].trim();
                let t = new Type(tp, Type.AttrsFromType(tp));
                if (Type.String2Code(tp) == Type.COMPOSITE)
                    t = Type.FromString(tp);
                if (Type.isNull(t)) {
                    this.LexiconErrors.push(
                        new ScriptError("Type d'attribut inconnu", i, new Range(shift-p.length, shift))
                    );
                    return;
                }
                attrs.push(new Attribute(n, t));
            });
            this.lexiconTypes.push(new Type(name, attrs, desc));
        }

        // get the lexicon variables
        this.lexiconAttrs = [];
        for (let i = lexiconStart; i < lexiconEnd; i++) {
            const line = this.document[i];
            if (!line.trim().match(Interpreter.LEXICON_VAR_REGEX)) 
                continue;
            let part1 = line.split(":");
            if (part1.length < 2) {
                this.LexiconErrors.push(
                    new ScriptError("Syntaxe de declaration de variable incorrecte", i, new Range(0, line.length))
                );
                continue;
            }
            let name = part1[0].trim();
            let part2 = part1[1].split("//");
            let desc = "// commentaire";
            if (part2.length > 1)
                desc = "// " + part2[1].trim();
            let tp = part2[0].trim();
            let t = new Type(tp, Type.AttrsFromType(tp));
            if (Type.String2Code(tp) == Type.COMPOSITE)
                t = Type.FromString(tp);
            if (Type.isNull(t)) {
                this.LexiconErrors.push(
                    new ScriptError("Type d'attribut inconnu", i, new Range(0, line.length))
                );
                return;
            }
            this.lexiconAttrs.push(new Attribute(name, t, desc));
        }
    }
}