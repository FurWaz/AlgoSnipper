class Position {
    public start: number;
    public end: number;
    public constructor(start: number, end: number) {
        this.start = start;
        this.end = end;
    }
}

class Variable {
    public static REEL = "reel";
    public static ENTIER = "entier";
    public static CHAINE = "chaine";
    public static BOOLEEN = "booleen";
    public static CARACTERE = "caractere";

    public name: string;
    public type: number;
    public desc: string;
    public constructor(name: string, type: number, desc: string) {
        this.name = name;
        this.type = type;
        this.desc = desc;
    }
}

class ScriptError {
    public message: string;
    public line: number;
    public position: Position;
    public constructor(message: string, line: number, position: Position) {
        this.message = message;
        this.line = line;
        this.position = position;
    }
}

export class Interpreter {
    public static scriptVariables: Variable[];
    public static lexiconVariables: Variable[];
    public static lexiconTypes: Variable[];
    public static scriptErrors: ScriptError[];

    public static processLexiconVariables(document: string[]): void {
        // get lexicon range
        let lexiconStart, lexiconEnd;
        lexiconEnd = document.length-1;
        for (let i = lexiconEnd; i > 0; i--)
            if (document[i].trim().toLowerCase().startsWith("lexique")) {
                lexiconStart = i+1;
                break;
            }
        
    }
    
    public static getLexiconVarInfos(): Variable | null {

        return null;
    }
}