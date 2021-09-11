"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Interpreter = exports.ScriptError = exports.Variable = exports.Type = exports.Attribute = exports.Range = exports.getWordRange = void 0;
function getWordRange(index, sample, regex = /[a-zA-Z0-9_]/) {
    let start = index;
    let end = index;
    let char = sample[index];
    while (char.match(regex)) {
        start--;
        if (start <= 0)
            break;
        char = sample.substring(start - 1, start);
    }
    char = sample.substring(end, end + 1);
    while (char.match(regex)) {
        end++;
        if (end >= 30)
            return undefined;
        char = sample.substring(end, end + 1);
    }
    return new Range(start, end);
}
exports.getWordRange = getWordRange;
class Range {
    constructor(start, end) {
        this.start = start;
        this.end = end;
    }
}
exports.Range = Range;
class Attribute {
    constructor(name = "", type = new Type(), desc = "") {
        this.name = name;
        this.type = type;
        this.desc = desc;
    }
    static isNull(attr) {
        return attr.name == "";
    }
    static GenerateDoc(attr, varSynthaxe = false) {
        let val = ((varSynthaxe) ? "Variable" : "Attribut") + " **" + attr.name + "**";
        val += "\n```algo";
        val += "\nnom: " + attr.name;
        val += "\ntype: " + attr.type.name;
        if (varSynthaxe)
            val += "\ndescription: " + attr.desc;
        val += "\n```\n\n";
        if (attr.type.code == Type.COMPOSITE) {
            val += "\n**Attributs:**";
            val += "\n```algo";
            attr.type.attrs.forEach(at => {
                val += "\n" + at.name + " (" + at.type.name + ") " + at.desc;
            });
            val += "\n```\n\n";
        }
        return val;
    }
    static FromString(str) {
        let res = new Attribute();
        Interpreter.lexiconAttrs.forEach(t => {
            if (t.name.toLowerCase() == str.toLowerCase())
                res = new Variable(t.name, t.type, t.desc);
        });
        return res;
    }
}
exports.Attribute = Attribute;
class Type {
    constructor(name = "", attrs = [], desc = "") {
        this.name = name;
        this.desc = desc;
        this.code = Type.String2Code(name);
        this.attrs = attrs;
        if (this.code != Type.COMPOSITE) {
            switch (this.code) {
                case Type.REEL:
                    this.desc = "// Nombre reel";
                    break;
                case Type.ENTIER:
                    this.desc = "// Nombre entier";
                    break;
                case Type.BOOLEEN:
                    this.desc = "// valeur booleenne";
                    break;
                case Type.CHAINE:
                    this.desc = "// Chaine de caracteres";
                    break;
                case Type.CARACTERE:
                    this.desc = "// Caractere informatique";
                    break;
                default: break;
            }
        }
    }
    static isNull(type) {
        return type.name == "";
    }
    static GenerateDoc(type) {
        let val = "Type **" + type.name + "**";
        val += "\n```algo";
        val += "\nnom: " + type.name;
        val += "\ndescription: " + type.desc;
        val += "\n```\n\n";
        if (type.code == Type.COMPOSITE) {
            val += "\n**Attributs:**";
            val += "\n```algo";
            type.attrs.forEach(a => {
                val += "\n" + a.name + " (" + a.type.name + ") ";
            });
            val += "\n```";
        }
        return val;
    }
    static String2Code(str) {
        let res = Type.COMPOSITE;
        switch (str) {
            case "reel":
                res = Type.REEL;
                break;
            case "entier":
                res = Type.ENTIER;
                break;
            case "chaine":
                res = Type.CHAINE;
                break;
            case "booleen":
                res = Type.BOOLEEN;
                break;
            case "caractere":
                res = Type.CARACTERE;
                break;
            default:
                res = Type.COMPOSITE;
                break;
        }
        return res;
    }
    static FromString(str) {
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
    static AttrsFromType(str) {
        let matchingType = this.FromString(str);
        if (!this.isNull(matchingType))
            return matchingType.attrs;
        return [];
    }
    static DescFromType(str) {
        let res = "// ";
        let found = true;
        switch (str) {
            case "reel":
                res += "Nombre reel";
                break;
            case "entier":
                res += "Nombre entier";
                break;
            case "chaine":
                res += "Chaine de caracteres";
                break;
            case "booleen":
                res += "Valeur booleenne";
                break;
            case "caractere":
                res += "Caractere";
                break;
            default:
                found = false;
                break;
        }
        if (!found) {
            let matchingType = new Type();
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
}
exports.Type = Type;
Type.REEL = 0;
Type.ENTIER = 1;
Type.CHAINE = 2;
Type.BOOLEEN = 3;
Type.CARACTERE = 4;
Type.COMPOSITE = 5;
class Variable {
    constructor(name = "", type = new Type(), desc = "", value = []) {
        this.name = name;
        this.desc = desc;
        this.value = value;
        this.type = type;
    }
    static isNull(v) {
        return v.name == "";
    }
    static FromString(str) {
        let res = new Variable();
        // TODO
        return res;
    }
}
exports.Variable = Variable;
class ScriptError {
    constructor(message, line, range) {
        this.message = message;
        this.line = line;
        this.range = range;
    }
}
exports.ScriptError = ScriptError;
class Interpreter {
    static setDocument(document) {
        this.document = document;
    }
    static processLexiconInfos() {
        this.LexiconErrors = [];
        // get lexicon range (first line included, last line not included)
        let lexiconStart = -1, lexiconEnd = -1;
        for (let i = this.document.length - 1; i > 0; i--)
            if (this.document[i].trim().match(this.LEXICON_VAR_REGEX) || this.document[i].trim().match(this.LEXICON_TYPE_REGEX)) {
                lexiconEnd = i + 1;
                break;
            }
        for (let i = this.document.length - 1; i > 0; i--)
            if (this.document[i].trim().toLowerCase().startsWith("lexique")) {
                lexiconStart = i + 1;
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
                this.LexiconErrors.push(new ScriptError("Syntaxe de declaration de type incorrecte", i, new Range(0, line.length)));
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
                this.LexiconErrors.push(new ScriptError("Valeur de type incorrecte", i, new Range(0, line.length)));
                continue;
            }
            let parts = type.substring(1, type.length - 1).split(",");
            let attrs = [];
            let shift = line.split("<")[0].length;
            parts.forEach(p => {
                shift += p.length + 1;
                let curvar = p.split(":");
                if (curvar.length < 2) {
                    this.LexiconErrors.push(new ScriptError("Syntaxe de declaration d'attribut incorrecte", i, new Range(shift - p.length, shift)));
                    return;
                }
                let n = curvar[0].trim();
                let tp = curvar[1].trim();
                let t = new Type(tp, Type.AttrsFromType(tp));
                if (Type.String2Code(tp) == Type.COMPOSITE)
                    t = Type.FromString(tp);
                if (Type.isNull(t)) {
                    this.LexiconErrors.push(new ScriptError("Type d'attribut inconnu", i, new Range(shift - p.length, shift)));
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
                this.LexiconErrors.push(new ScriptError("Syntaxe de declaration de variable incorrecte", i, new Range(0, line.length)));
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
                this.LexiconErrors.push(new ScriptError("Type d'attribut inconnu", i, new Range(0, line.length)));
                return;
            }
            this.lexiconAttrs.push(new Attribute(name, t, desc));
        }
    }
}
exports.Interpreter = Interpreter;
Interpreter.scriptVariables = [];
Interpreter.lexiconAttrs = [];
Interpreter.lexiconTypes = [];
Interpreter.LexiconErrors = [];
Interpreter.document = [];
Interpreter.defaultTypes = [
    new Type("reel"),
    new Type("entier"),
    new Type("chaine"),
    new Type("caractere"),
    new Type("booleen"),
];
Interpreter.LEXICON_VAR_REGEX = / *[a-zA-Z][a-zA-Z0-9]* *: *[a-zA-Z][a-zA-Z0-9]* *(\/\/.*)*$/;
Interpreter.LEXICON_TYPE_REGEX = /^ *[a-zA-Z][a-zA-Z0-9]* *= *< *([a-z][a-zA-Z0-9]*) *: *([a-zA-Z0-9]+ *)(, *([a-z][a-zA-Z0-9]*) *: *([a-zA-Z0-9]+) *)*> *(\/\/.*)*$/;
//# sourceMappingURL=interpreter.js.map