"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.defaultFonctions = exports.defaultTypes = exports.defaultVars = void 0;
const algo = require("./common");
exports.defaultVars = [];
exports.defaultTypes = [
    new algo.Type("Liste", "// Liste d'elements", algo.Type.UNKNOWN),
    new algo.Type("Place", "// Place d'un element dans une liste", null)
];
exports.defaultFonctions = [
    new algo.Function("adjtlis", [
        new algo.Attribute("liste", algo.Type.FromString("Liste")),
        new algo.Attribute("element", algo.Type.UNKNOWN)
    ]),
    new algo.Function("adjtlis", [
        new algo.Attribute("liste", algo.Type.FromString("Liste")),
        new algo.Attribute("element", algo.Type.UNKNOWN)
    ]),
    new algo.Function("adjlis", [
        new algo.Attribute("liste", algo.Type.FromString("Liste")),
        new algo.Attribute("element", algo.Type.UNKNOWN),
        new algo.Attribute("place", algo.Type.FromString("Place"))
    ])
];
//# sourceMappingURL=default.js.map