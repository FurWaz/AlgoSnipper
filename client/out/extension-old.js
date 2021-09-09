"use strict";
/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = void 0;
const path = require("path");
const vscode = require("vscode");
const doom_1 = require("./doom");
const node_1 = require("vscode-languageclient/node");
let client;
let nbrMsgs = 0;
function activate(context) {
    let insertArrow = vscode.commands.registerCommand('algosnipper.insertArrow', function () {
        vscode.window.activeTextEditor.edit((editBuilder) => {
            let position = vscode.window.activeTextEditor.selection.start;
            editBuilder.insert(position, "◄-");
        });
    });
    let toogleFurryMode = vscode.commands.registerCommand('algosnipper.furryMode', function () {
        vscode.window.showErrorMessage('Alert : Furry mode activated.');
        setTimeout(showFurryMsg, Math.random() * 4000 + 4000);
    });
    function showFurryMsg() {
        if (nbrMsgs < 16) {
            let msgIndex = Math.round(Math.random() * 30) % 10;
            switch (msgIndex) {
                case 0:
                    vscode.window.activeTextEditor.edit((editBuilder) => {
                        let position = vscode.window.activeTextEditor.selection.start;
                        editBuilder.insert(position, " OwO ");
                    });
                    break;
                case 1:
                    vscode.window.activeTextEditor.edit((editBuilder) => {
                        let position = vscode.window.activeTextEditor.selection.start;
                        editBuilder.insert(position, " furry ");
                    });
                    break;
                case 2:
                    vscode.window.showInformationMessage('Awoo !');
                    break;
                case 3:
                    vscode.window.activeTextEditor.edit((editBuilder) => {
                        editBuilder.insert(new vscode.Position(0, 0), "furries > gamers\n");
                    });
                    break;
                case 4:
                    vscode.window.activeTextEditor.edit((editBuilder) => {
                        let position = vscode.window.activeTextEditor.selection.start;
                        editBuilder.insert(position, " UwU ");
                    });
                    break;
                case 5:
                    vscode.window.activeTextEditor.edit((editBuilder) => {
                        let lCount = vscode.window.activeTextEditor.document.lineCount;
                        let lLength = vscode.window.activeTextEditor.document.lineAt(lCount - 1).text.length;
                        let text = "\nFurries";
                        let long = Math.random() * 12;
                        let lxc = ["UwO", "OwO", "Furries", "Furry", "Awoo", "Furries > Gamers"];
                        for (let i = 0; i < long; i++) {
                            text += "\n" + lxc[Math.round(Math.random() * (lxc.length - 1))];
                        }
                        editBuilder.insert(new vscode.Position(lCount - 1, lLength), text);
                    });
                    break;
                case 6:
                    vscode.window.activeTextEditor.edit((editBuilder) => {
                        let position = vscode.window.activeTextEditor.selection.start;
                        editBuilder.insert(position, " furries > gamers ");
                    });
                    break;
                case 7:
                    vscode.window.activeTextEditor.edit((editBuilder) => {
                        let position = vscode.window.activeTextEditor.selection.start;
                        editBuilder.insert(position, " OwO ");
                    });
                    break;
                case 8:
                    vscode.window.activeTextEditor.edit((editBuilder) => {
                        editBuilder.insert(new vscode.Position(0, 0), "furry\n");
                    });
                    break;
                case 9:
                    vscode.window.activeTextEditor.edit((editBuilder) => {
                        let position = vscode.window.activeTextEditor.selection.start;
                        editBuilder.insert(position, " Awoo ");
                    });
                    break;
                default:
                    break;
            }
            nbrMsgs++;
            setTimeout(showFurryMsg, Math.random() * 4000 + 4000);
        }
        else {
            nbrMsgs = 0;
            vscode.window.showInformationMessage('Fixed : Furry mode disabled');
        }
    }
    let genLexique = vscode.commands.registerCommand('algosnipper.genLexique', function () {
        vscode.window.activeTextEditor.edit((editBuilder) => {
            let lexique = "";
            let newLexique = true;
            let count = vscode.window.activeTextEditor.document.lineCount;
            // check is lexicon already exists
            for (let i = 0; i < count; i++) {
                let line = vscode.window.activeTextEditor.document.lineAt(i);
                if (line.text.trim().toLocaleLowerCase().startsWith("lexique")) {
                    newLexique = false;
                    count = i - 1;
                }
            }
            if (newLexique)
                lexique += "\n\nlexique:";
            // get all the variables from the script
            let variables = [];
            for (let i = 0; i < count; i++) {
                const line = vscode.window.activeTextEditor.document.lineAt(i);
                if (line.text.trim().startsWith("fonction")) { // fonction declaration
                    let deb = 0;
                    let fin = 0;
                    for (let i = 0; i < line.text.length; i++) {
                        let cur_char = line.text.charAt(i);
                        if (cur_char == "(" && deb == 0)
                            deb = i;
                        if (cur_char == ")")
                            fin = i;
                    }
                    let args = line.text.substring(deb + 1, fin - 1).trim();
                    if (args.length > 0) {
                        args = args.split(",");
                        for (let i = 0; i < args.length; i++) {
                            const arg = args[i];
                            let parts = arg.trim().split(":");
                            if (parts.length > 1)
                                variables.push({ name: parts[0].replace("InOut", "").trim(), type: parts[1].trim() });
                        }
                    }
                }
                else {
                    let words = line.text.split(" ");
                    for (let j = 0; j < words.length; j++) {
                        const w = words[j];
                        if (w == "◄-" || w == "←" || w == "<-" || w == "<=") {
                            let alreadyExists = false;
                            for (let k = 0; k < variables.length; k++) {
                                if (variables[k].name.trim() == words[j - 1].trim())
                                    alreadyExists = true;
                            }
                            if (!alreadyExists)
                                variables.push({ name: words[j - 1], type: getVarType(words[j + 1], variables) });
                        }
                    }
                }
            }
            // store already existing variables from lexique
            let existing_variables = [];
            for (let i = count + 2; i < vscode.window.activeTextEditor.document.lineCount; i++) {
                const line = vscode.window.activeTextEditor.document.lineAt(i).text.trim();
                let parts = line.split(":");
                if (parts.length > 1) { // variable declaration
                    let name = parts[0].trim();
                    let type = parts[1].trim();
                    let cutPos = type.length;
                    for (let i = 0; i < type.length - 1; i++) {
                        if (type.charAt(i) == "/" && (type.charAt(i + 1) == "*" || type.charAt(i + 1) == "/")) {
                            cutPos = i;
                        }
                    }
                    type = type.substr(0, cutPos).trim();
                    existing_variables.push({ name: name, type: type });
                }
                else {
                    parts = line.split("=");
                    if (parts.length > 1) { // type declaration
                    }
                }
            }
            // adds the variables to the lexicon
            for (let i = 0; i < variables.length; i++) {
                const v = variables[i];
                let exists = false;
                for (let i = 0; i < existing_variables.length; i++) {
                    const ex_var = existing_variables[i];
                    if (ex_var.name == v.name)
                        exists = true;
                }
                if (!exists)
                    lexique += "\n    " + v.name + " : " + v.type + " // commentaire";
            }
            editBuilder.insert(new vscode.Position(vscode.window.activeTextEditor.document.lineCount, 0), lexique);
        });
        vscode.window.showInformationMessage('Le lexique à bien été généré !');
    });
    let launch = vscode.commands.registerCommand('algosnipper.launch', function () {
        vscode.window.showInformationMessage("Lancement de l'algorithme ...");
        let program = vscode.window.activeTextEditor.document.getText().split("\n");
        let output = vscode.window.createOutputChannel("Algorithme");
        output.show(true);
        output.appendLine("--- Désolé, cette fonctionnalité n'est pas encore disponible ---");
    });
    let doom = vscode.commands.registerCommand('algosnipper.launchDoom', function () {
        doom_1.DoomView.createOrShow(vscode.Uri.file(context.extensionPath));
    });
    // The server is implemented in node
    let serverModule = context.asAbsolutePath(path.join('server', 'out', 'server.js'));
    // The debug options for the server
    // --inspect=6009: runs the server in Node's Inspector mode so VS Code can attach to the server for debugging
    let debugOptions = { execArgv: ['--nolazy', '--inspect=6009'] };
    // If the extension is launched in debug mode then the debug server options are used
    // Otherwise the run options are used
    let serverOptions = {
        run: { module: serverModule, transport: node_1.TransportKind.ipc },
        debug: {
            module: serverModule,
            transport: node_1.TransportKind.ipc,
            options: debugOptions
        }
    };
    // Options to control the language client
    let clientOptions = {
        // Register the server for plain text documents
        documentSelector: [{ scheme: 'file', language: 'Algo' }],
        synchronize: {
            // Notify the server about file changes to '.clientrc files contained in the workspace
            fileEvents: vscode.workspace.createFileSystemWatcher('**/.clientrc')
        }
    };
    // Create the language client and start the client.
    client = new node_1.LanguageClient('languageServerAlgo', 'Language Server Algo', serverOptions, clientOptions);
    // Start the client. This will also launch the server
    client.start();
    context.subscriptions.push(genLexique);
    context.subscriptions.push(insertArrow);
    context.subscriptions.push(launch);
    context.subscriptions.push(toogleFurryMode);
    context.subscriptions.push(doom);
}
exports.activate = activate;
function deactivate() {
    if (!client) {
        return undefined;
    }
    return client.stop();
}
exports.deactivate = deactivate;
function getVarType(value, variables) {
    if (value.startsWith('"')) { // chaîne
        return "chaîne";
    }
    else if (value.startsWith("'")) { // chaîne
        return "caractère";
    }
    else if (!isNaN(parseFloat(value))) { // nombre
        if (parseInt(value) == parseFloat(value))
            return "entier";
        else
            return "réel";
    }
    else if (value == "vrai" || value == "faux") {
        return "booléen";
    }
    else {
        for (let k = 0; k < variables.length; k++) {
            const v = variables[k].name;
            if (v.trim() == value.trim()) {
                return variables[k].type;
            }
        }
        return "Inconnu";
    }
}
function getVarValue(line, variables) {
    let splitted = line.split(" ");
    let value = "";
    for (let i = 0; i < splitted.length; i++) {
        if (splitted[i] == "←") {
            for (let k = 0; k < variables.length; k++) {
                const v = variables[k].name;
                if (v.trim() == splitted[i + 1].trim()) {
                    value = variables[k].value;
                    break;
                }
            }
            break;
        }
    }
    if (value == "") {
        for (let i = 0; i < splitted.length; i++) {
            if (splitted[i] == "←") {
                for (let j = i + 1; j < splitted.length; j++) {
                    value += splitted[j] + " ";
                }
            }
        }
        if (value.startsWith('"')) {
            value = value.substr(1, value.length - 4);
        }
    }
    return value;
}
//# sourceMappingURL=extension-old.js.map