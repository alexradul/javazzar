/**
* This module contains concepts related to errors, warnings and other messages that program may need.
*/

    var Errors, Warnings, InfoMessages;

    Errors = {
        rootPackageUndefined: "UML package having stereotype root not found.\nPlease see our Getting Started Guide, Code Generation Setup section for more details.",
        projectCodebaseEmpty: "Code generation destination directory not set.\n Please configure project codebase using Javazzar Preferences."
    };

    Warnings = {

    };

    InfoMessages = {

    };

    exports.Errors = Errors;
    exports.Warnings = Warnings;
    exports.InfoMessages = InfoMessages;