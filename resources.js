/**
 * In order to be able to load resources throughout the code, without taking care of their relative location, we will use this resources module.
 */

const fs = require("fs"),
    path = require("path");

const stringTagTemplate = fs.readFileSync(path.join(__dirname, "./views/extension-item-string.html"), "utf-8"),
    booleanTagTemplate = fs.readFileSync(path.join(__dirname, "./views/extension-item-bool.html"), "utf-8"),
    enumTagTemplate = fs.readFileSync(path.join(__dirname, "./views/extension-item-enum.html"), "utf-8");

const extensionsPanelTemplate = fs.readFileSync(path.join(__dirname,"./views/extensions-panel.html"), "utf-8");

const toolTipDialogTemplate = fs.readFileSync(path.join(__dirname,"./dlgs/tooltip-dialog.html"), "utf-8");

const rebelTips = fs.readFileSync(path.join(__dirname,"./tipoftheday/tipoftheday.json"), "utf-8");


exports.stringTagTemplate = stringTagTemplate;
exports.booleanTagTemplate = booleanTagTemplate;
exports.enumTagTemplate = enumTagTemplate;

exports.extensionsPanelTemplate = extensionsPanelTemplate;

exports.toolTipDialogTemplate = toolTipDialogTemplate;
exports.rebelTips = rebelTips;
