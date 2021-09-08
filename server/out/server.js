"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
const node_1 = require("vscode-languageserver/node");
const vscode_languageserver_textdocument_1 = require("vscode-languageserver-textdocument");
// Create a connection for the server, using Node's IPC as a transport.
// Also include all preview / proposed LSP features.
let connection = (0, node_1.createConnection)(node_1.ProposedFeatures.all);
// Create a simple text document manager. 
let documents = new node_1.TextDocuments(vscode_languageserver_textdocument_1.TextDocument);
let hasConfigurationCapability = false;
let hasWorkspaceFolderCapability = false;
let hasDiagnosticRelatedInformationCapability = false;
connection.onInitialize((params) => {
    let capabilities = params.capabilities;
    // Does the client support the `workspace/configuration` request?
    // If not, we fall back using global settings.
    hasConfigurationCapability = !!(capabilities.workspace && !!capabilities.workspace.configuration);
    hasWorkspaceFolderCapability = !!(capabilities.workspace && !!capabilities.workspace.workspaceFolders);
    hasDiagnosticRelatedInformationCapability = !!(capabilities.textDocument &&
        capabilities.textDocument.publishDiagnostics &&
        capabilities.textDocument.publishDiagnostics.relatedInformation);
    const result = {
        capabilities: {
            textDocumentSync: node_1.TextDocumentSyncKind.Incremental,
            // Tell the client that this server supports code completion.
            completionProvider: {
                resolveProvider: true
            }
        }
    };
    if (hasWorkspaceFolderCapability) {
        result.capabilities.workspace = {
            workspaceFolders: {
                supported: true
            }
        };
    }
    return result;
});
connection.onInitialized(() => {
    if (hasConfigurationCapability) {
        // Register for all configuration changes.
        connection.client.register(node_1.DidChangeConfigurationNotification.type, undefined);
    }
    if (hasWorkspaceFolderCapability) {
        connection.workspace.onDidChangeWorkspaceFolders(_event => {
            connection.console.log('Workspace folder change event received.');
        });
    }
});
// The global settings, used when the `workspace/configuration` request is not supported by the client.
// Please note that this is not the case when using this server with the client provided in this example
// but could happen with other clients.
const defaultSettings = { maxNumberOfProblems: 1000 };
let globalSettings = defaultSettings;
// Cache the settings of all open documents
let documentSettings = new Map();
connection.onDidChangeConfiguration(change => {
    if (hasConfigurationCapability) {
        // Reset all cached document settings
        documentSettings.clear();
    }
    else {
        globalSettings = ((change.settings.languageServerExample || defaultSettings));
    }
    // Revalidate all open text documents
    documents.all().forEach(validateTextDocument);
});
function getDocumentSettings(resource) {
    if (!hasConfigurationCapability) {
        return Promise.resolve(globalSettings);
    }
    let result = documentSettings.get(resource);
    if (!result) {
        result = connection.workspace.getConfiguration({
            scopeUri: resource,
            section: 'languageServerAlgo'
        });
        documentSettings.set(resource, result);
    }
    return result;
}
// Only keep settings for open documents
documents.onDidClose(e => {
    documentSettings.delete(e.document.uri);
});
// The content of a text document has changed. This event is emitted
// when the text document first opened or when its content has changed.
documents.onDidChangeContent(async (change) => {
    let textDocument = change.document;
    validateTextDocument(textDocument);
});
let lexiqueTypes = [];
let lexiqueVars = [];
let messages = [];
async function validateTextDocument(textDocument) {
    let settings = await getDocumentSettings(textDocument.uri);
    messages = [];
    let diagnostics = [];
    lexiqueTypes = [];
    lexiqueVars = [];
    //try to get the lexique
    let lines = textDocument.getText().split("\n");
    let lexiqueIndex = 0;
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].toLowerCase().startsWith("lexique")) {
            lexiqueIndex = i + 1;
            break;
        }
    }
    let lexiqueEnd = false;
    while (!lexiqueEnd) {
        let currentLine = lines[lexiqueIndex];
        if (currentLine.toLowerCase().startsWith("fonction") ||
            currentLine.toLowerCase().startsWith("algorithme"))
            lexiqueEnd = true;
        if (!lexiqueEnd) {
            //add line to types or vars lists
            let isVariable = true;
            let chars = currentLine.split("");
            //check if variable or class
            for (let i = 0; i < chars.length; i++) {
                if (chars[i] == "=") {
                    isVariable = false;
                    break;
                }
            }
            if (isVariable) {
                let parts = currentLine.split(":");
                let name = parts[0].trim();
                let desc = "";
                let type = parts[1];
                let chars = parts[1].split("");
                for (let i = 0; i < chars.length; i++) {
                    if (chars[i] == "/" && i < chars.length - 1) {
                        type = parts[1].substring(0, i - 1).trim();
                        desc = parts[1].substring(i, chars.length).trim();
                        break;
                    }
                }
                if (!existsType(type.trim())) {
                    let start = getWordPosition(currentLine, type);
                    messages.push({
                        severity: node_1.DiagnosticSeverity.Error,
                        range: {
                            start: node_1.Position.create(lexiqueIndex, start),
                            end: node_1.Position.create(lexiqueIndex, start + type.length)
                        },
                        message: "Le type [" + type + "] n'est pas défini.",
                        source: "AlgoSnipper"
                    });
                }
                lexiqueVars.push({ name: name, type: type, desc: desc });
            }
            else {
                let sep = currentLine.split("=");
                let name = sep[0].trim();
                if (sep[1].trim().charAt(0) == "<") {
                    let parts = getPartsFromString(sep[1]);
                    lexiqueTypes.push({ name: name, vars: parts, type: "composite", more: null });
                }
                else if (sep[1].trim().split(" ")[0] == "tableau") {
                    let attribs = sep[1].trim().split(" ");
                    attribs = attribs.reverse();
                    attribs.pop();
                    attribs = attribs.reverse();
                    let infos = attribs.join("").split("[");
                    let bounds = infos[1].replace("]", "").split("..");
                    let newBounds = [parseInt(bounds[0].trim().split(".").join("").replace("]", "")), parseInt(bounds[1].trim().split(".").join(""))];
                    if (!isNaN(newBounds[0]))
                        bounds[0] = newBounds[0];
                    if (!isNaN(newBounds[1]))
                        bounds[1] = newBounds[1];
                    let type_name = "";
                    let type = infos[0].trim();
                    let parts = [];
                    if (type.charAt(0) == "<") {
                        parts = getPartsFromString(type);
                        type_name = "Inconnu";
                    }
                    else {
                        let infos = getInfosFromType(type);
                        if (infos != null) {
                            parts = infos.vars;
                            type_name = infos.name;
                        }
                        else {
                            parts = [];
                            type_name = "Inconnu";
                            let start = getWordPosition(currentLine, type.trim());
                            messages.push({
                                severity: node_1.DiagnosticSeverity.Error,
                                range: {
                                    start: node_1.Position.create(lexiqueIndex, start),
                                    end: node_1.Position.create(lexiqueIndex, start + type.length)
                                },
                                message: "Le type [" + type + "] n'est pas défini.",
                                source: "AlgoSnipper"
                            });
                        }
                    }
                    lexiqueTypes.push({ name: name, vars: parts, type: "tableau", more: { bounds: bounds, type_name: type_name } });
                }
                else if (sep[1].trim().split("(")[0].trim() == "Liste") {
                    let attribs = sep[1].trim().split("(");
                    attribs = attribs.reverse();
                    attribs.pop();
                    attribs = attribs.reverse();
                    let type = attribs.join("").replace(")", "").trim();
                    let type_name = "";
                    let parts = [];
                    if (type.charAt(0) == "<") {
                        parts = getPartsFromString(type);
                        type_name = "Inconnu";
                    }
                    else {
                        let infos = getInfosFromType(type);
                        if (infos != null) {
                            parts = infos.vars;
                            type_name = infos.name;
                        }
                        else {
                            parts = [];
                            type_name = "Inconnu";
                            let start = getWordPosition(currentLine, type.trim());
                            messages.push({
                                severity: node_1.DiagnosticSeverity.Error,
                                range: {
                                    start: node_1.Position.create(lexiqueIndex, start),
                                    end: node_1.Position.create(lexiqueIndex, start + type.length)
                                },
                                message: "Le type [" + type + "] n'est pas défini.",
                                source: "AlgoSnipper"
                            });
                        }
                    }
                    lexiqueTypes.push({ name: name, vars: parts, type: "liste", more: { type_name: type_name } });
                }
                else if (sep[1].trim().split("[")[0].trim() == "Table") {
                    let attribs = sep[1].trim().split("[");
                    attribs = attribs.reverse();
                    attribs.pop();
                    attribs = attribs.reverse();
                    let content = attribs.join("").replace("]", "").trim();
                    let separators = ["->", "=>", "-►", "→"];
                    let separator = "";
                    for (let i = 0; i < separators.length; i++) {
                        let pos = getWordPosition(content, separators[i]);
                        if (pos != 0) {
                            separator = separators[i];
                            break;
                        }
                    }
                    let types = content.split(separator);
                    types[0] = types[0].trim();
                    types[1] = types[1].trim();
                    //get first type
                    let cle_type_name = "";
                    let cle_parts = [];
                    if (types[0].charAt(0) == "<") {
                        cle_parts = getPartsFromString(types[0]);
                        cle_type_name = "Inconnu";
                    }
                    else {
                        let infos = getInfosFromType(types[0]);
                        if (infos != null) {
                            cle_parts = infos.vars;
                            cle_type_name = infos.name;
                        }
                        else if (!existsType(types[0])) {
                            cle_parts = [];
                            cle_type_name = "Inconnu";
                            let start = getWordPosition(currentLine, types[0].trim());
                            messages.push({
                                severity: node_1.DiagnosticSeverity.Error,
                                range: {
                                    start: node_1.Position.create(lexiqueIndex, start),
                                    end: node_1.Position.create(lexiqueIndex, start + types[0].length)
                                },
                                message: "Le type [" + types[0] + "] n'est pas défini.",
                                source: "AlgoSnipper"
                            });
                        }
                    }
                    //get second type
                    let val_type_name = "";
                    let val_parts = [];
                    if (types[1].charAt(0) == "<") {
                        val_parts = getPartsFromString(types[1]);
                        val_type_name = "Inconnu";
                    }
                    else {
                        let infos = getInfosFromType(types[1]);
                        if (infos != null) {
                            val_parts = infos.vars;
                            val_type_name = infos.name;
                        }
                        else if (!existsType(types[1])) {
                            val_parts = [];
                            val_type_name = "Inconnu";
                            let start = getWordPosition(currentLine, types[1].trim());
                            messages.push({
                                severity: node_1.DiagnosticSeverity.Error,
                                range: {
                                    start: node_1.Position.create(lexiqueIndex, start),
                                    end: node_1.Position.create(lexiqueIndex, start + types[1].length)
                                },
                                message: "Le type [" + types[1] + "] n'est pas défini.",
                                source: "AlgoSnipper"
                            });
                        }
                    }
                    lexiqueTypes.push({ name: name, vars: [], type: "table", more: { cle_type: cle_type_name, val_type: val_type_name } });
                }
                else if (existsType(sep[1].trim())) {
                    let infos = getInfosFromType(sep[1].trim());
                    if (infos != null)
                        lexiqueTypes.push({ name: name, vars: infos.vars, type: "variable", more: null });
                }
                else {
                    let found = getInfosFromType(sep[1].trim());
                    if (found == null) {
                        messages.push({
                            severity: node_1.DiagnosticSeverity.Error,
                            range: {
                                start: node_1.Position.create(lexiqueIndex, 4),
                                end: node_1.Position.create(lexiqueIndex, currentLine.length)
                            },
                            message: "Déclaration de type incorrecte.",
                            source: "AlgoSnipper"
                        });
                    }
                    else {
                        lexiqueTypes.push({ name: name, vars: found.vars, type: found.type, more: found.more });
                    }
                }
            }
        }
        lexiqueIndex++;
        if (lexiqueIndex == lines.length)
            lexiqueEnd = true;
    }
    // get all ortho errors
    let orthoDiagnose = correctOrtho(textDocument, lexiqueTypes, lexiqueVars);
    messages.forEach(diag => {
        diagnostics.push(diag);
    });
    orthoDiagnose.forEach(diag => {
        diagnostics.push(diag);
    });
    // Send the computed diagnostics to VSCode.
    connection.sendDiagnostics({ uri: textDocument.uri, diagnostics });
}
connection.onDidChangeWatchedFiles(_change => {
    // Monitored files have change in VSCode
    connection.console.log('We received an file change event');
});
// This handler provides the initial list of the completion items.
connection.onCompletion((_textDocumentPosition) => {
    let compList = [];
    let index = 0;
    lexiqueTypes.forEach(el => {
        compList.push({
            label: el.name.toString(),
            kind: node_1.CompletionItemKind.Class,
            data: index++
        });
    });
    lexiqueVars.forEach(el => {
        compList.push({
            label: el.name.toString(),
            kind: node_1.CompletionItemKind.Variable,
            data: index++
        });
    });
    return compList;
});
// This handler resolves additional information for the item selected in
// the completion list.
connection.onCompletionResolve((item) => {
    if (item.data < lexiqueTypes.length) {
        let cur_type = lexiqueTypes[item.data];
        item.detail = "Type " + cur_type.name;
        let val = getDocFromType(cur_type);
        item.documentation = { kind: node_1.MarkupKind.Markdown, value: val };
    }
    else {
        let cur_var = lexiqueVars[item.data - lexiqueTypes.length];
        item.detail = "Variable " + cur_var.name;
        let val = "```algo";
        val += "\nnom: " + lexiqueVars[item.data - lexiqueTypes.length].name;
        val += "\ntype: " + lexiqueVars[item.data - lexiqueTypes.length].type;
        val += "\n" + lexiqueVars[item.data - lexiqueTypes.length].desc;
        val += "\n```\n\n";
        let infos = getInfosFromType(cur_var.type.trim());
        if (infos != null)
            val += getDocFromType(infos);
        item.documentation = { kind: node_1.MarkupKind.Markdown, value: val };
    }
    return item;
});
connection.onHover((param) => {
    let hov = { contents: { language: "algo", value: "salut" }, range: undefined };
    return hov;
});
// Make the text document manager listen on the connection
// for open, change and close text document events
documents.listen(connection);
// Listen on the connection
connection.listen();
function correctOrtho(textDocument, types, vars) {
    let text = textDocument.getText();
    let diagnoses = [];
    let diagnostic = {
        severity: node_1.DiagnosticSeverity.Information,
        range: {
            start: textDocument.positionAt(6),
            end: textDocument.positionAt(8)
        },
        message: "salut",
        source: "AlgoSnipper"
    };
    return diagnoses;
}
function getPartsFromString(str) {
    let parts = [];
    let attribs = str.replace(">", "").replace("<", "").split(",");
    attribs.forEach(attr => {
        let pt = attr.split(":");
        let attrName = pt[0].trim();
        let attrType = pt[1].trim();
        parts.push({ name: attrName, type: attrType });
    });
    return parts;
}
function getInfosFromType(type) {
    var found = null;
    switch (type) {
        case "entier":
            found = { name: "entier", type: "variable", vars: [{ name: "entier", type: "entier" }], more: null };
            break;
        case "chaîne":
            found = { name: "chaîne", type: "variable", vars: [{ name: "chaîne", type: "chaîne" }], more: null };
            break;
        case "caractère":
            found = { name: "caractère", type: "variable", vars: [{ name: "caractère", type: "caractère" }], more: null };
            break;
        case "booléen":
            found = { name: "booléen", type: "variable", vars: [{ name: "booléen", type: "booléen" }], more: null };
            break;
        case "Inconnu":
            found = { name: "booléen", type: "variable", vars: [{ name: "booléen", type: "booléen" }], more: null };
            break;
        default:
            lexiqueTypes.forEach(ltype => {
                if (ltype.name == type)
                    found = ltype;
            });
            break;
    }
    return found;
}
function getDocFromType(cur_type) {
    let val = "";
    switch (cur_type.type) {
        case "variable":
            val += "Variable de base\n\n";
            val += "__**Type de variable:**__\n```algo";
            val += "\n" + cur_type.vars[0].type;
            break;
        case "composite":
            val += "Variable composite\n\n";
            val += "__**Attributs:**__\n```algo";
            cur_type.vars.forEach(el => {
                val += "\n" + el.name + " ( " + el.type + " )";
            });
            break;
        case "tableau":
            val += "Tableau d'éléments " + cur_type.more.type_name + "\n\n";
            val += "Index: " + cur_type.more.bounds[0] + " - " + cur_type.more.bounds[1] + "\n\n";
            val += "__**Attributs des éléments:**__\n```algo";
            cur_type.vars.forEach(el => {
                val += "\n" + el.name + " ( " + el.type + " )";
            });
            break;
        case "liste":
            val += "Liste d'éléments " + cur_type.more.type_name + "\n\n";
            val += "__**Attributs des éléments:**__\n```algo";
            cur_type.vars.forEach(el => {
                val += "\n" + el.name + " ( " + el.type + " )";
            });
            break;
        case "table":
            val += "Table de couple (" + cur_type.more.cle_type + ", " + cur_type.more.val_type + ")\n\n";
            let infos = getInfosFromType(cur_type.more.cle_type);
            if (infos != null) {
                val += "__**Attributs des clés:**__\n```algo";
                infos.vars.forEach(el => {
                    val += "\n" + el.name + " ( " + el.type + " )";
                });
            }
            val += "\n```\n\n";
            infos = getInfosFromType(cur_type.more.val_type);
            if (infos != null) {
                val += "__**Attributs des valeurs:**__\n```algo";
                infos.vars.forEach(el => {
                    val += "\n" + el.name + " ( " + el.type + " )";
                });
            }
            break;
        default: break;
    }
    val += "\n\n```";
    return val;
}
function existsType(type) {
    let result = false;
    if (getInfosFromType(type) == null) {
        result = (type == "entier") || (type == "chaîne") || (type == "caractère") ||
            (type == "réel") || (type == "booléen") || (type == "Inconnu") ||
            (type == "Place");
    }
    else
        result = true;
    return result;
}
function getWordPosition(sentence, word) {
    let position = 0;
    for (let i = 0; i <= sentence.length - word.length; i++) {
        if (sentence.substr(i, word.length) == word)
            position = i;
    }
    return position;
}
//# sourceMappingURL=server.js.map