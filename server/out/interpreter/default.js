"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDefaultFonctions = exports.getDefaultTypes = exports.getDefaultVars = void 0;
const algo = require("./common");
function getDefaultVars() {
    return [];
}
exports.getDefaultVars = getDefaultVars;
function getDefaultTypes() {
    return [
        new algo.Type("Liste", "// Liste d'elements", algo.Type.UNKNOWN),
        new algo.Type("Place", "// Place d'un element dans une liste", null),
        new algo.Type("ArBin", "// Arbre binaire", algo.Type.UNKNOWN),
        new algo.Type("Noeud", "// Noeud d'un arbre binaire", algo.Type.UNKNOWN),
        new algo.Type("Fichier", "// Type representant un fichier", null)
    ];
}
exports.getDefaultTypes = getDefaultTypes;
function getDefaultFonctions() {
    return [
        new algo.Function("adjtlis", [
            new algo.Variable("liste", algo.Type.FromString("Liste")),
            new algo.Variable("element", algo.Type.UNKNOWN)
        ]),
        new algo.Function("adjqlis", [
            new algo.Variable("liste", algo.Type.FromString("Liste")),
            new algo.Variable("element", algo.Type.UNKNOWN)
        ]),
        new algo.Function("adjlis", [
            new algo.Variable("liste", algo.Type.FromString("Liste")),
            new algo.Variable("element", algo.Type.UNKNOWN),
            new algo.Variable("place", algo.Type.FromString("Place"))
        ]),
        new algo.Function("suptlis", [
            new algo.Variable("liste", algo.Type.FromString("Liste"))
        ]),
        new algo.Function("supqlis", [
            new algo.Variable("liste", algo.Type.FromString("Liste"))
        ]),
        new algo.Function("suplis", [
            new algo.Variable("liste", algo.Type.FromString("Liste")),
            new algo.Variable("place", algo.Type.FromString("Place"))
        ]),
        new algo.Function("chglis", [
            new algo.Variable("liste", algo.Type.FromString("Liste")),
            new algo.Variable("element", algo.Type.UNKNOWN),
            new algo.Variable("place", algo.Type.FromString("Place"))
        ]),
        new algo.Function("lisvide", [], algo.Type.FromString("Liste")),
        new algo.Function("suc", [
            new algo.Variable("liste", algo.Type.FromString("Liste")),
            new algo.Variable("place", algo.Type.FromString("Place"))
        ], algo.Type.FromString("Place")),
        new algo.Function("val", [
            new algo.Variable("liste", algo.Type.FromString("Liste")),
            new algo.Variable("place", algo.Type.FromString("Place"))
        ], algo.Type.UNKNOWN),
        new algo.Function("tete", [
            new algo.Variable("liste", algo.Type.FromString("Liste"))
        ], algo.Type.FromString("Place")),
        new algo.Function("fichierCreer", [
            new algo.Variable("nom", algo.Type.STRING)
        ], algo.Type.FromString("Fichier")),
        new algo.Function("fichierLire", [
            new algo.Variable("fichier", algo.Type.FromString("Fichier"))
        ], algo.Type.STRING),
        new algo.Function("fichierEcrire", [
            new algo.Variable("fichier", algo.Type.FromString("Fichier")),
            new algo.Variable("donnee", algo.Type.STRING)
        ], algo.Type.STRING),
        new algo.Function("fichierFermer", [
            new algo.Variable("fichier", algo.Type.FromString("Fichier"))
        ]),
        new algo.Function("fichierOuvrir", [
            new algo.Variable("fichier", algo.Type.FromString("Fichier"))
        ]),
        new algo.Function("racine", [
            new algo.Variable("arbre", algo.Type.FromString("ArBin"))
        ], algo.Type.FromString("Noeud")),
        new algo.Function("val", [
            new algo.Variable("arbre", algo.Type.FromString("ArBin")),
            new algo.Variable("noeud", algo.Type.FromString("Noeud"))
        ], algo.Type.UNKNOWN),
        new algo.Function("fg", [
            new algo.Variable("arbre", algo.Type.FromString("ArBin")),
            new algo.Variable("noeud", algo.Type.FromString("Noeud"))
        ], algo.Type.UNKNOWN),
        new algo.Function("fd", [
            new algo.Variable("arbre", algo.Type.FromString("ArBin")),
            new algo.Variable("noeud", algo.Type.FromString("Noeud"))
        ], algo.Type.UNKNOWN),
        new algo.Function("noeudVide", [
            new algo.Variable("arbre", algo.Type.FromString("ArBin")),
            new algo.Variable("noeud", algo.Type.FromString("Noeud"))
        ], algo.Type.BOOL),
        new algo.Function("creerArb", [
            new algo.Variable("valeur", algo.Type.UNKNOWN)
        ], algo.Type.FromString("ArBin")),
        new algo.Function("adjfg", [
            new algo.Variable("arbre", algo.Type.FromString("ArBin")),
            new algo.Variable("noeud", algo.Type.FromString("Noeud")),
            new algo.Variable("valeur", algo.Type.UNKNOWN)
        ]),
        new algo.Function("adjfd", [
            new algo.Variable("arbre", algo.Type.FromString("ArBin")),
            new algo.Variable("noeud", algo.Type.FromString("Noeud")),
            new algo.Variable("valeur", algo.Type.UNKNOWN)
        ]),
        new algo.Function("ecrire", [
            new algo.Variable("message", algo.Type.UNKNOWN)
        ])
    ];
}
exports.getDefaultFonctions = getDefaultFonctions;
//# sourceMappingURL=default.js.map