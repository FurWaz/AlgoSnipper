"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Interpreter = void 0;
class Position {
    constructor(start, end) {
        this.start = start;
        this.end = end;
    }
}
class Variable {
    constructor(name, type, desc) {
        this.name = name;
        this.type = type;
        this.desc = desc;
    }
}
Variable.REEL = "reel";
Variable.ENTIER = "entier";
Variable.CHAINE = "chaine";
Variable.BOOLEEN = "booleen";
Variable.CARACTERE = "caractère";
class ScriptError {
    constructor(message, line, position) {
        this.message = message;
        this.line = line;
        this.position = position;
    }
}
class Interpreter {
    static processLexiconVariables(document) {
        // get lexicon range
        let lexiconStart, lexiconEnd;
        lexiconEnd = document.length - 1;
        for (let i = lexiconEnd; i > 0; i--)
            if (document[i].trim().toLowerCase().startsWith("lexique")) {
                lexiconStart = i + 1;
                break;
            }
    }
    static getLexiconVarInfos() {
        return null;
    }
}
exports.Interpreter = Interpreter;
//# sourceMappingURL=interpreter.js.map