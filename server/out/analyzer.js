"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Analyzer = exports.ScriptError = exports.Func = exports.Type = exports.Attribute = exports.Range = exports.getWordRange = void 0;
function getWordRange(index, sample, regex = /[a-zA-Z0-9_]/) {
    let start = index;
    let end = index;
    let char = sample[index];
    while (char.match(regex)) {
        start--;
        if (start <= 0)
            break;
        char = sample.substring(start, start + 1);
    }
    char = sample.substring(end, end + 1);
    while (char.match(regex)) {
        end++;
        if (end >= 30)
            return undefined;
        char = sample.substring(end, end + 1);
    }
    return new Range(start + 1, end);
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
    canFitIn(attr, indices, underscoreIndex) {
        let empty = true;
        attr.name.split("").forEach(l => { if (l != '_')
            empty = false; });
        if (attr.name == this.name)
            empty = true;
        if (!empty && underscoreIndex <= 0)
            return false;
        if (attr.type.code != this.type.code)
            return false;
        if (this.type.code == Type.COMPOSITE) {
            let attribs = attr.type.attrs.concat();
            for (let i = 0; i < this.type.attrs.length; i++) {
                const at = this.type.attrs[i];
                let found = false;
                for (let j = 0; j < attribs.length; j++)
                    if (at.canFitIn(attribs[j], indices, underscoreIndex - 1)) {
                        found = true;
                        indices.push(attr.type.attrs.indexOf(attribs[j]));
                        attribs.splice(j, 1);
                        break;
                    }
                if (!found)
                    return false;
            }
            ;
        }
        return true;
    }
    static FromString(str) {
        let res = new Attribute();
        Analyzer.lexiconAttrs.concat(Analyzer.scriptAttrs).forEach(t => {
            if (t.name == str)
                res = t;
        });
        return res;
    }
    equals(attr, ignoreNames = true) {
        if (ignoreNames)
            return this.type.equals(attr.type, ignoreNames);
        else
            return this.type.equals(attr.type, ignoreNames) && this.name == attr.name;
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
                case Type.UNKNOWN:
                    this.desc = "// Type inconnu";
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
            case "Inconnu":
                res = Type.UNKNOWN;
                break;
            default:
                res = Type.COMPOSITE;
                break;
        }
        return res;
    }
    static DetermineValueType(str) {
        // fonction call, get function return value
        if (str.match(/[a-zA-Z0-9]+\(.*\)/)) {
            str = str.trim();
            let func = Func.FromString(str.split("(")[0]);
            if (!Func.isNull(func))
                return func.type;
        }
        if (str.match(Analyzer.SCRIPT_OPERATORS_REGEX))
            return Analyzer.getOperationType(str);
        // is couple of values
        let mtch = str.match(/^ *\(.*\) *$/); // TODO change composite detection
        if (mtch) {
            let parts = mtch[0].substring(1, mtch[0].length - 1).split(",");
            let attrs = [];
            let index = 1;
            for (let j = 0; j < parts.length; j++) {
                let p = parts[j];
                let pt = p.trim();
                let compositeType = false;
                if (pt.startsWith('(')) { // in case of composite inside composite | doesn't work
                    while (!pt.endsWith(")"))
                        pt += ", " + parts[++j];
                    compositeType = true;
                }
                let subtype = this.DetermineValueType(pt.trim());
                if (compositeType) {
                    subtype.name = "Type" + (Analyzer.scriptTypes.length + 1);
                    let found = false;
                    Analyzer.lexiconTypes.concat(Analyzer.scriptTypes).forEach(t => {
                        if (subtype.equals(t)) {
                            subtype = t;
                            found = true;
                        }
                    });
                    if (!found) // no matching type detected, this is a new type
                        Analyzer.scriptTypes.push(subtype);
                }
                let name = "";
                for (let i = 0; i < index; i++)
                    name += "_";
                attrs.push(new Attribute(name, subtype));
                index++;
            }
            ;
            let foundType = new Type("", attrs, "// Type inconnu");
            Analyzer.lexiconTypes.concat(Analyzer.scriptTypes).forEach(t => {
                if (foundType.equals(t)) {
                    foundType = t;
                }
            });
            return new Type(foundType.name, foundType.attrs, foundType.desc);
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
        let type = new Type();
        // is it a composite attribute
        mtch = str.match(/[^\s](\.[^\s]+)*/);
        if (mtch) {
            let parts = str.split(".");
            let name = parts.splice(0, 1)[0];
            let attr = new Attribute();
            Analyzer.lexiconAttrs.concat(Analyzer.scriptAttrs).forEach(at => {
                if (name == at.name)
                    attr = at;
            });
            parts.forEach(p => {
                attr.type.attrs.forEach(at => {
                    if (at.name == p.trim())
                        attr = at;
                });
            });
            type = new Type(attr.type.name, attr.type.attrs, attr.type.desc);
        }
        return type;
    }
    static FromString(str) {
        let res = new Type();
        let code = Type.String2Code(str);
        if (code == Type.COMPOSITE)
            Analyzer.lexiconTypes.concat(Analyzer.scriptTypes).forEach(t => {
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
            Analyzer.lexiconTypes.concat(Analyzer.scriptTypes).forEach(t => {
                if (t.name == str) {
                    matchingType = t;
                }
            });
            if (matchingType.name != "")
                return matchingType.desc;
        }
        return res;
    }
    equals(type, ignoreNames = true) {
        if (this.code != type.code)
            return false;
        if (this.code == Type.COMPOSITE) {
            if (this.attrs.length != type.attrs.length)
                return false;
            for (let i = 0; i < this.attrs.length; i++) {
                const at = this.attrs[i];
                const _at = type.attrs[i];
                if (!at.equals(_at, ignoreNames))
                    return false;
            }
            ;
        }
        return true;
    }
}
exports.Type = Type;
Type.REEL = 0;
Type.ENTIER = 1;
Type.CHAINE = 2;
Type.BOOLEEN = 3;
Type.CARACTERE = 4;
Type.COMPOSITE = 5;
Type.UNKNOWN = 6;
class Func {
    constructor(name = "", args = [], type = new Type()) {
        this.name = name;
        this.type = type;
        this.args = args;
    }
    static isNull(func) {
        return func.name == "";
    }
    static GenerateDoc(func) {
        let res = "Fonction **" + func.name + "**";
        res += "\n\n**Arguments:**";
        res += "\n```algo";
        func.args.forEach(arg => {
            res += "\n" + arg.name + " (" + arg.type.name + ")";
        });
        res += "\n```\n\n**Type de retour:**\n```algo\n" + func.type.name + "\n```";
        return res;
    }
    static FromString(str) {
        str = str.split("(")[0];
        for (let i = 0; i < Analyzer.scriptFunctions.length; i++) {
            const f = Analyzer.scriptFunctions[i];
            if (f.name == str)
                return f;
        }
        return new Func();
    }
}
exports.Func = Func;
class ScriptError {
    constructor(message, line, range) {
        this.message = message;
        this.line = line;
        this.range = range;
    }
}
exports.ScriptError = ScriptError;
const opsDic = [
    // entier
    { type1: Type.ENTIER, op: "+", type2: Type.ENTIER, res: Type.ENTIER }, { type1: Type.ENTIER, op: "-", type2: Type.ENTIER, res: Type.ENTIER },
    { type1: Type.ENTIER, op: "/", type2: Type.ENTIER, res: Type.ENTIER }, { type1: Type.ENTIER, op: "*", type2: Type.ENTIER, res: Type.ENTIER },
    { type1: Type.ENTIER, op: "<", type2: Type.ENTIER, res: Type.BOOLEEN }, { type1: Type.ENTIER, op: ">", type2: Type.ENTIER, res: Type.BOOLEEN },
    { type1: Type.ENTIER, op: "<=", type2: Type.ENTIER, res: Type.BOOLEEN }, { type1: Type.ENTIER, op: ">=", type2: Type.ENTIER, res: Type.BOOLEEN },
    { type1: Type.ENTIER, op: "+", type2: Type.REEL, res: Type.REEL }, { type1: Type.ENTIER, op: "-", type2: Type.REEL, res: Type.REEL },
    { type1: Type.ENTIER, op: "/", type2: Type.REEL, res: Type.REEL }, { type1: Type.ENTIER, op: "*", type2: Type.REEL, res: Type.REEL },
    { type1: Type.ENTIER, op: "<", type2: Type.REEL, res: Type.BOOLEEN }, { type1: Type.ENTIER, op: ">", type2: Type.REEL, res: Type.BOOLEEN },
    { type1: Type.ENTIER, op: "<=", type2: Type.REEL, res: Type.BOOLEEN }, { type1: Type.ENTIER, op: ">=", type2: Type.REEL, res: Type.BOOLEEN },
    { type1: Type.ENTIER, op: "=", type2: Type.ENTIER, res: Type.BOOLEEN }, { type1: Type.ENTIER, op: "=", type2: Type.REEL, res: Type.BOOLEEN },
    { type1: Type.ENTIER, op: "%", type2: Type.ENTIER, res: Type.ENTIER }, { type1: Type.ENTIER, op: "mod", type2: Type.ENTIER, res: Type.ENTIER },
    // reel
    { type1: Type.REEL, op: "+", type2: Type.REEL, res: Type.REEL }, { type1: Type.REEL, op: "-", type2: Type.REEL, res: Type.REEL },
    { type1: Type.REEL, op: "/", type2: Type.REEL, res: Type.REEL }, { type1: Type.REEL, op: "*", type2: Type.REEL, res: Type.REEL },
    { type1: Type.REEL, op: "+", type2: Type.ENTIER, res: Type.REEL }, { type1: Type.REEL, op: "-", type2: Type.ENTIER, res: Type.REEL },
    { type1: Type.REEL, op: "/", type2: Type.ENTIER, res: Type.REEL }, { type1: Type.REEL, op: "*", type2: Type.ENTIER, res: Type.REEL },
    { type1: Type.REEL, op: "<", type2: Type.REEL, res: Type.BOOLEEN }, { type1: Type.REEL, op: ">", type2: Type.REEL, res: Type.BOOLEEN },
    { type1: Type.REEL, op: "<=", type2: Type.REEL, res: Type.BOOLEEN }, { type1: Type.REEL, op: ">=", type2: Type.REEL, res: Type.BOOLEEN },
    { type1: Type.REEL, op: "<", type2: Type.ENTIER, res: Type.BOOLEEN }, { type1: Type.REEL, op: ">", type2: Type.ENTIER, res: Type.BOOLEEN },
    { type1: Type.REEL, op: "<=", type2: Type.ENTIER, res: Type.BOOLEEN }, { type1: Type.REEL, op: ">=", type2: Type.ENTIER, res: Type.BOOLEEN },
    { type1: Type.REEL, op: "=", type2: Type.REEL, res: Type.BOOLEEN }, { type1: Type.REEL, op: "=", type2: Type.ENTIER, res: Type.BOOLEEN },
    { type1: Type.REEL, op: "%", type2: Type.REEL, res: Type.REEL }, { type1: Type.REEL, op: "mod", type2: Type.REEL, res: Type.REEL },
    // chaine | caractere
    { type1: Type.CHAINE, op: "+", type2: Type.CHAINE, res: Type.CHAINE }, { type1: Type.CHAINE, op: "=", type2: Type.CHAINE, res: Type.BOOLEEN },
    { type1: Type.CARACTERE, op: "+", type2: Type.CARACTERE, res: Type.CHAINE }, { type1: Type.CARACTERE, op: "=", type2: Type.CARACTERE, res: Type.BOOLEEN },
    // booleen
    { type1: Type.BOOLEEN, op: "et", type2: Type.BOOLEEN, res: Type.BOOLEEN }, { type1: Type.BOOLEEN, op: "ou", type2: Type.BOOLEEN, res: Type.BOOLEEN },
    { type1: Type.BOOLEEN, op: "=", type2: Type.BOOLEEN, res: Type.BOOLEEN }
];
class Analyzer {
    static setDocument(document) {
        this.document = document;
    }
    static getOperationType(str) {
        // check if there is parenthesis to build them first
        let parenthesis = new Range(0, 0);
        while (parenthesis.start > -1 && parenthesis.end > -1) {
            parenthesis = new Range(-1, -1);
            let index = -1;
            let parenthesisAmount = 0;
            str.split("").forEach(l => {
                index++;
                if (l == '(') {
                    parenthesisAmount++;
                    if (parenthesis.start == -1)
                        parenthesis.start = index;
                }
                if (l == ')') {
                    parenthesisAmount--;
                    if (parenthesisAmount == 0 && parenthesis.end == -1)
                        parenthesis.end = index;
                }
            });
            if (parenthesis.start != -1 && parenthesis.end != -1) {
                let type = this.getOperationType(str.substring(parenthesis.start + 1, parenthesis.end).trim()).code;
                let res = "";
                switch (type) {
                    case Type.ENTIER:
                        res = "0";
                        break;
                    case Type.REEL:
                        res = "0.0";
                        break;
                    case Type.CARACTERE:
                        res = "''";
                        break;
                    case Type.CHAINE:
                        res = "\"\"";
                        break;
                    case Type.BOOLEEN:
                        res = "vrai";
                        break;
                }
                str = str.substring(0, parenthesis.start) + res + str.substring(parenthesis.end + 1, str.length);
            }
        }
        let str2op = (str) => {
            switch (str) {
                case "et": return 1;
                case "ou": return 2;
                case "=": return 3;
                case "<=":
                case ">=":
                case "<":
                case ">": return 4;
                case "+":
                case "-": return 5;
                case "%": return 6;
                case "*":
                case "/": return 7;
                default: return 0;
            }
        };
        let getOpResult = (ob1, op, ob2) => {
            let t1 = Type.DetermineValueType(ob1);
            let t2 = Type.DetermineValueType(ob2);
            let res = "";
            opsDic.forEach(opd => {
                if (t1.code == opd.type1 && t2.code == opd.type2 && op.trim() == opd.op) {
                    switch (opd.res) {
                        case Type.ENTIER:
                            res = "0";
                            break;
                        case Type.REEL:
                            res = "0.0";
                            break;
                        case Type.CARACTERE:
                            res = "''";
                            break;
                        case Type.CHAINE:
                            res = "\"\"";
                            break;
                        case Type.BOOLEEN:
                            res = "vrai";
                            break;
                    }
                }
            });
            if (res == "")
                Analyzer.scriptErrors.push(new ScriptError("Operation [" + op + "] impossible entre les type [" + t1.name + "] et [" + t2.name + "]", Analyzer.currentLine, new Range(0, Analyzer.document[Analyzer.currentLine].length)));
            return res;
        };
        let lastPos = 0;
        let cursor = 0;
        let operations = [];
        // parse the string to get operations
        while (cursor < str.length) {
            if (str[cursor].match(/(\+|-|\/|%|\*|=|<|>|\^)/)) {
                operations.push({ str: str.substring(lastPos, cursor).trim(), op: str[cursor] });
                lastPos = cursor + 1;
            }
            else if (str.substr(cursor, 2).match(/(<=|>=)/)) {
                operations.push({ str: str.substring(lastPos, cursor).trim(), op: str.substr(cursor, 2) });
                lastPos = cursor + 2;
            }
            else if (str.substr(cursor, 4).match(/( et | ou )/)) {
                operations.push({ str: str.substring(lastPos, cursor).trim(), op: str.substr(cursor, 4) });
                lastPos = cursor + 4;
            }
            else if (str.substr(cursor, 5).match(/( mod )/)) {
                operations.push({ str: str.substring(lastPos, cursor).trim(), op: str.substr(cursor, 5) });
                lastPos = cursor + 5;
            }
            cursor++;
        }
        operations.push({ str: str.substring(lastPos, cursor).trim(), op: "" });
        // go through the operations
        let index = 0;
        while (operations.length > 1) { // stop when only one object in the list (the result)
            const cur_ob = operations[index];
            const next_ob = operations[index + 1];
            if (str2op(cur_ob.op) < str2op(next_ob.op)) { // if the next operation is higher, execute it before
                index++;
            }
            else { // execute the operation and store the result
                cur_ob.str = getOpResult(cur_ob.str, cur_ob.op, next_ob.str);
                cur_ob.op = next_ob.op;
                operations.splice(index + 1, 1);
                if (index > 0)
                    index--;
            }
        }
        let type = Type.DetermineValueType(operations[0].str);
        return type;
    }
    static cleanUp() {
        this.LexiconErrors = [];
        this.lexiconTypes = [];
        this.lexiconAttrs = [];
        this.scriptErrors = [];
        this.scriptFunctions = [];
        this.scriptAttrs = [];
        this.scriptTypes = [];
    }
    static processLexiconInfos() {
        // get lexicon range (first line included, last line not included)
        let lexiconStart = -1, lexiconEnd = -1;
        for (let i = this.document.length - 1; i > 0; i--)
            if (this.document[i].trim().match(this.LEXICON_VAR_REGEX) || this.document[i].trim().match(this.LEXICON_TYPE_REGEX)) {
                lexiconEnd = i + 1;
                break;
            }
        for (let i = this.document.length - 1; i > 0; i--)
            if (this.document[i].trim().toLowerCase().startsWith("lexique:")) {
                lexiconStart = i + 1;
                break;
            }
        this.lexiconBounds = new Range(lexiconStart, lexiconEnd);
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
        for (let i = lexiconStart; i < lexiconEnd; i++) {
            this.currentLine = i;
            const line = this.document[i];
            if (!line.trim().match(this.LEXICON_TYPE_REGEX))
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
            if (!line.trim().match(this.LEXICON_VAR_REGEX))
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
    static processScriptFunctions() {
        for (let i = 0; i < this.document.length; i++) {
            this.currentLine = i;
            const line = this.document[i].trim();
            if (!line.match(this.SCRIPT_FUNC_REGEX))
                continue;
            let chunk = line.substring(9, line.length); // remove "fonction" from line
            let parts = chunk.split(/[\(|\)]/);
            if (parts.length < 3)
                this.scriptErrors.push(new ScriptError("Declaration de fonction incorrecte", i, new Range(0, line.length)));
            let argChunk = parts[1].trim();
            let args = [];
            if (argChunk.length > 0) {
                let argsList = argChunk.split(",");
                argsList.forEach(ar => {
                    let attr = ar.split(":");
                    if (attr[0].trim().length < 1 || attr[1].trim().length < 1) {
                        this.scriptErrors.push(new ScriptError("Declaration d'arguments incorrecte", i, new Range(0, line.length)));
                        return;
                    }
                    args.push(new Attribute(attr[0].trim(), Type.FromString(attr[1].trim()), ""));
                });
            }
            let rt = parts[2].trim();
            rt = rt.substring(1, rt.length).trim();
            let rtype = (rt.length < 1) ? new Type("Inconnu") : Type.FromString(rt);
            let func = new Func(parts[0].trim(), args, rtype);
            this.scriptFunctions.push(func);
        }
    }
    static processScriptInfo() {
        for (let i = 0; i < this.document.length; i++) {
            this.currentLine = i;
            const line = this.document[i];
            let isMatch = line.match(this.SCRIPT_STORE_REGEX);
            if (isMatch) {
                // getting basic informations
                let parts = isMatch[0].split("<-");
                let vName = parts[0].trim().split(".");
                let vValue = parts[1].trim();
                let vType = Type.DetermineValueType(vValue);
                if (vValue.match(/[a-zA-Z0-9]+\(.*\)/)) { // function call, check if it is called correctly
                    let pts = [];
                    let parenthesis = new Range(-1, -1);
                    let index = -1;
                    let parenthesisAmount = 0;
                    vValue.split("").forEach(l => {
                        index++;
                        if (l == '(') {
                            parenthesisAmount++;
                            if (parenthesis.start == -1)
                                parenthesis.start = index;
                        }
                        if (l == ')') {
                            parenthesisAmount--;
                            if (parenthesisAmount == 0 && parenthesis.end == -1)
                                parenthesis.end = index;
                        }
                    });
                    pts.push(vValue.substring(0, parenthesis.start));
                    pts.push(vValue.substring(parenthesis.start + 1, parenthesis.end));
                    let fname = pts[0].trim();
                    let fargs = pts[1].trim();
                    let func = Func.FromString(fname);
                    if (Func.isNull(func)) {
                        // this.scriptErrors.push(
                        //     new ScriptError("La fonction n'existe pas", i, new Range(0, line.length))
                        // );
                        continue;
                    }
                    let argsPts = fargs.split(",");
                    if (argsPts.length == 1 && argsPts[0].length == 0)
                        argsPts = [];
                    if (argsPts.length != func.args.length) {
                        // this.scriptErrors.push(
                        //     new ScriptError("Le nombre d'arguments est incorrect ("+argsPts.length+" au lieu de "+func.args.length+")", i, new Range(0, line.length))
                        // );
                        continue;
                    }
                    for (let j = 0; j < argsPts.length; j++) {
                        const aName = argsPts[j].trim();
                        let arg = Type.DetermineValueType(aName);
                        const farg = func.args[j];
                        if (Type.isNull(arg)) {
                            this.scriptErrors.push(new ScriptError("L'attribut [" + aName + "] n'existe pas", i, new Range(0, line.length)));
                            break;
                        }
                        if (!arg.equals(farg.type)) {
                            this.scriptErrors.push(new ScriptError("Le type de l'attribut est incorrect ([" + arg.name + "] au lieu de [" + farg.type.name + "])", i, new Range(0, line.length)));
                            break;
                        }
                    }
                }
                if (vType.code == Type.UNKNOWN) { // look in scriptTypes for matching types
                    this.scriptTypes.concat(this.lexiconTypes).forEach(t => {
                        if (t.equals(vType))
                            vType == t;
                    });
                }
                if (vType.name == "") { // if this type is a new type, create it
                    vType.name = "Type" + (this.scriptTypes.length + 1);
                    vType.code = Type.COMPOSITE;
                    this.scriptTypes.push(vType);
                }
                let list = this.lexiconAttrs.concat(this.scriptAttrs);
                if (vName.length < 2) { // not dot in variable name, not an attribute
                    let isInList = false;
                    list.forEach(e => {
                        if (vName[0] == e.name) {
                            isInList = true;
                            // if (!vType.equals(e.type))
                            //     this.scriptErrors.push(
                            //         new ScriptError(
                            //             "Type de valeur incorrect (["+vType.name+"] au lieu de ["+e.type.name+"])",
                            //             i, new Range(0, line.length)
                            //         )
                            //     );
                        }
                    });
                    if (!isInList)
                        this.scriptAttrs.push(new Attribute(vName[0], vType, ""));
                }
                else { // composite variable
                    let attr = new Attribute();
                    this.lexiconAttrs.forEach(a => {
                        if (a.name == vName[0])
                            attr = a;
                    });
                    if (Attribute.isNull(attr)) { // doesn't exists in lexicon
                        let newAttr = new Attribute();
                        this.scriptAttrs.forEach(a => {
                            if (a.name == vName[0])
                                newAttr = a;
                        });
                        if (!Attribute.isNull(newAttr)) { // is already declared in script
                            let index = 0;
                            while (++index < vName.length) { // go to the end of the variable attributes' list
                                let found = false;
                                newAttr.type.attrs.forEach(a => {
                                    if (a.name == vName[index]) {
                                        newAttr = a;
                                        found = true;
                                    }
                                });
                                if (!found)
                                    break;
                            }
                            // TODO: check if an empty variable's attribute of the type of the new written attribute is available
                            // before saying that the wrotten attribute is renaming anything /!\
                            if (index < vName.length) { // variable attribute renaming
                                let xedni = vName.length - 1;
                                let lastAttr = new Attribute(vName[xedni], vType, "");
                                while (xedni-- >= index) { // requires variable type reconstruction for type checking
                                    let type = new Type("composite", [lastAttr], "");
                                    lastAttr = new Attribute(vName[xedni], type, "");
                                }
                                let tab = [];
                                if (!lastAttr.canFitIn(newAttr, tab, vName.length - index)) // attribute can't exist
                                 {
                                    this.scriptErrors.push(new ScriptError("L'attribut " + vName[vName.length - 1] + " n'existe pas", i, new Range(0, line.length)));
                                }
                                else {
                                    let curAttr = newAttr;
                                    tab = tab.reverse();
                                    for (let j = 0; j < tab.length; j++) {
                                        lastAttr = lastAttr.type.attrs[0];
                                        const tab_j = tab[j];
                                        curAttr.type.attrs[tab_j].name = lastAttr.name;
                                        curAttr = curAttr.type.attrs[tab_j];
                                    }
                                    ;
                                    for (let j = 0; j < this.scriptAttrs.length; j++) {
                                        if (this.scriptAttrs[j].name == newAttr.name) {
                                            this.scriptAttrs.splice(j, 1);
                                            break;
                                        }
                                    }
                                    this.scriptAttrs.push(newAttr);
                                }
                            }
                            else { // new attribute value assignation
                                // check last attribute type assignation
                                if (!newAttr.type.equals(vType)) // error
                                    this.scriptErrors.push(new ScriptError("Type de valeur incorrect ([" + vType.name + "] au lieu de [" + newAttr.type.name + "])", i, new Range(0, line.length)));
                            }
                        }
                        else { // not declared in script
                            let lastAttr = new Attribute(vName[vName.length - 1], vType, "");
                            for (let j = vName.length - 2; j >= 0; j--) {
                                let type = new Type("Type" + (this.scriptTypes.length + 1), [lastAttr], "");
                                let found = false;
                                this.scriptTypes.concat(this.lexiconTypes).forEach(t => {
                                    if (t.equals(type)) {
                                        type = t;
                                        found = true;
                                    }
                                });
                                if (!found)
                                    this.scriptTypes.push(type);
                                lastAttr = new Attribute(vName[j], type, "");
                            }
                            newAttr = lastAttr;
                            this.scriptAttrs.push(newAttr);
                        }
                    }
                    else { // variable is in lexicon (just a type verification)
                        // go to the last attribute
                        for (let j = 1; j < vName.length; j++) {
                            let found = false;
                            for (let k = 0; k < attr.type.attrs.length; k++) {
                                const a = attr.type.attrs[k];
                                if (a.name == vName[j]) {
                                    found = true;
                                    attr = a;
                                    break;
                                }
                            }
                            ;
                            if (!found) // error
                                this.scriptErrors.push(new ScriptError("L'attribut " + vName[j] + " n'existe pas", i, new Range(0, line.length)));
                        }
                        if (!attr.type.equals(vType)) // error
                            this.scriptErrors.push(new ScriptError("Type de valeur incorrect ([" + vType.name + "] au lieu de [" + attr.type.name + "])", i, new Range(0, line.length)));
                    }
                }
            }
            // check for [pour] loops variables
            isMatch = line.match(/^ *pour *(chaque)? * [^\s]*/);
            if (isMatch) {
                let parts = isMatch[0].split(" ");
                let name = parts[parts.length - 1];
                let attrType = new Type("entier");
                // try to get the type
                isMatch = line.match(/dans +[^\s]+/);
                if (isMatch) {
                    let parts = isMatch[0].split(" ");
                    let ensemble = parts[parts.length - 1];
                    // lists implementation required 
                }
                else {
                    isMatch = line.match(/de +[^\s] +a +[^\s]+/);
                    if (isMatch) {
                        let parts = isMatch[0].split(" ");
                        let startType = Type.DetermineValueType(parts[1]);
                        let endType = Type.DetermineValueType(parts[1]);
                        if (!startType.equals(endType))
                            this.scriptErrors.push(new ScriptError("Le type de debut et de fin ne sont pas les memes", i, new Range(0, line.length)));
                        else
                            attrType = startType;
                    }
                }
                let newAttr = new Attribute(name, attrType, "");
                let exists = false;
                this.scriptAttrs.concat(this.lexiconAttrs).forEach(at => {
                    if (at.name == newAttr.name)
                        exists = true;
                });
                if (!exists) {
                    Analyzer.scriptAttrs.push(newAttr);
                }
            }
        }
        ;
    }
}
exports.Analyzer = Analyzer;
Analyzer.scriptAttrs = [];
Analyzer.scriptTypes = [];
Analyzer.scriptFunctions = [];
Analyzer.lexiconAttrs = [];
Analyzer.lexiconTypes = [];
Analyzer.LexiconErrors = [];
Analyzer.scriptErrors = [];
Analyzer.lexiconBounds = new Range(-1, -1);
Analyzer.document = [];
Analyzer.debug = (str) => { };
Analyzer.currentLine = 0;
Analyzer.defaultTypes = [
    new Type("reel"),
    new Type("entier"),
    new Type("chaine"),
    new Type("caractere"),
    new Type("booleen"),
];
Analyzer.LEXICON_VAR_REGEX = / *[a-zA-Z][a-zA-Z0-9]* *: *[a-zA-Z][a-zA-Z0-9]* *(\/\/.*)*$/;
Analyzer.LEXICON_TYPE_REGEX = /^ *[a-zA-Z][a-zA-Z0-9]* *= *< *([a-z][a-zA-Z0-9]*) *: *([a-zA-Z0-9]+ *)(, *([a-z][a-zA-Z0-9]*) *: *([a-zA-Z0-9]+) *)*> *(\/\/.*)*$/;
Analyzer.SCRIPT_STORE_REGEX = /[^\s]+.*<-.*[^\s]+/;
Analyzer.SCRIPT_FUNC_REGEX = /^(fonction) *[a-zA-Z0-9]+ *\(.*\)( *: *[a-zA-Z0-9]+ *)?$/;
Analyzer.SCRIPT_OPERATORS_REGEX = /(\+|-|\/|%|\*|<=|>=|=|<|>|\^| et | ou | mod )/;
//# sourceMappingURL=analyzer.js.map