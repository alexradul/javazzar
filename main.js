/*jslint vars: true, plusplus: true, devel: true, nomen: true, regexp: true, indent: 4, maxerr: 50 */


/*global $, app, type */

const
    path = require("path"),
    electron = require("electron");
const
    Toast = app.toast,
    ExtensionUtils = app.stylesheets,
    ProjectManager = app.project;

const rebelConfiguration = require("./configuration/model");

var Messages = require("./Messages"),
    Preferences = require("./preferences");
const JavaPipeline = require("./java/JavaPipeline"),
    IO = require("./core/io");
const JavaProfiles = require("./java/JavaProfiles");

const extensionsPanel = require("./ExtensionsPanel");
const toolTipManager = require("./ToolTipManager").ToolTipManager;

const CleanupVisitor = JavaPipeline.CleanupVisitor;
const codeGenerationPipeline = JavaPipeline.pipeline;
const JavaProfile = JavaProfiles.JavaProfile, DocumentationProfile = JavaProfiles.DocumentationProfile;

const $button = $("<a id='toolbar-extensions-view' href = '#' title = 'Javazzar Property Editor'></a>");

const javaProfile = new JavaProfile();
const documentationProfile = new DocumentationProfile();

setupMenus();
extendStarUMLPrototypes();
setupJavazzarGui();
showToolTips();

function showToolTips() {
    if (toolTipManager.isShowTips()) {
        toolTipManager.showTooltipDialog();
    }
}

function handleCodeGeneration() {
    processModel();
}

function handleExport() {
    const preferences = Preferences.getGenOptions();
    let existingProjectPath = preferences.projectCodebase;
    const files = app.dialogs.showOpenDialog("Select the export folder", null, null, { properties: ["openDirectory"] });
    const exportPath = (files && files.length)? files[0] : "";
    if (exportPath) {
        existingProjectPath = existingProjectPath? existingProjectPath : exportPath;
        generateCode(preferences, existingProjectPath, exportPath);
    }
}

function handleOverwrite() {
    const preferences = Preferences.getGenOptions();
    let path = preferences.projectCodebase;
    if (!path) {
        const files = app.dialogs.showOpenDialog("Select a destination folder", null, null, { properties: ["openDirectory"] });
        if (files && files.length > 0) {
            path = files[0];
            updateCodeGenerationPath(path);
            generateCode(preferences, path, path);
        }
    } else {
        generateCode(preferences, path, path);
    }
}

function _handleConfigure() {
    const CommandManager = app.commands;
    CommandManager.execute("application:preferences", "javazzar");
}


function processModel() {
    const preferences = Preferences.getGenOptions();
    let path = preferences.projectCodebase;
    if (!path) {
        const files = app.dialogs.showOpenDialog("Select a destination folder", null, null, { properties: ["openDirectory"] });
        if (files && files.length > 0) {
            path = files[0];
            updateCodeGenerationPath(path);
            generateCode(preferences, path);
        }
    } else {
        generateCode(preferences, path);
    }
}

function updateCodeGenerationPath(path) {
    app.preferences.set("javazzar.java.project.codebase", path);
}

function generateCode(preferences, projectPath, exportPath) {
    const repository = app.repository;
    try {
        let rootPackage = repository.select("@UMLPackage[stereotype=root]")[0],
            generationResult;
        if (!rootPackage) {
            throw Messages.Errors.rootPackageUndefined;
        }

        rootPackage.accept(new CleanupVisitor());
        rootPackage.accept(codeGenerationPipeline(preferences));
        generationResult = rootPackage.codeFragment.serialize(
            new IO.FilePerClassSerializer(
                projectPath, 
                preferences.getIndentString(), 
                exportPath))
            .done(() => Toast.info("Code has been sucessfully generated from the model."))
            .fail(err => Toast.error(`Failed to generate code from the model: ${err}`));
        return generationResult;
    } catch (ex) {
        console.log(ex.stack);
        Toast.error(ex);
    }
}

function setupMenus() {

    // setup main menu
    (function () {
        var CommandManager = app.commands;
        // Define commands
        CommandManager.register("javazzar.assemble", handleCodeGeneration);
        CommandManager.register("javazzar.configure", _handleConfigure);
        CommandManager.register("javazzar.export", handleExport);
        CommandManager.register("javazzar.overwrite", handleOverwrite);
        CommandManager.register("javazzar.tipOfTheDay", showTipOfTheDay);
        CommandManager.register("javazzar.about", () => {
            electron.shell.openExternal("https://github.com/alexradul/javazzar");
        });
    })();
}

function extendStarUMLPrototypes() {
    String.prototype.toUpperCamelCase = function () {
        return this.substr(0, 1).toUpperCase() + this.substr(1);
    };
    String.prototype.toLowerCamelCase = function () {
        return this.substr(0, 1).toLowerCase() + this.substr(1);
    };
    String.prototype.repeat = function (count) {
        var _repeated = "";
        let i = 0;
        let str = new String(this);
        for (; i < count; i++) {
            _repeated += str;
        }
        return _repeated;
    };
    String.prototype.replaceAll = function (search, replacement) {
        var target = this;
        return target.split(search).join(replacement);
    };
    String.prototype.startsWith = function (search, pos) {
        return this.substr(!pos || pos < 0 ? 0 : +pos, search.length) === search;
    };

    // extend StarUML prototypes
    var Repository = app.repository;
    const type = this.type;

    // classifiers
    /**
         * @return {Array.<type.UMLClassifier>} super classes of the given classifier
         */
    type.UMLClassifier.prototype.getSuperClasses = function () {
        var generalizations = Repository.getRelationshipsOf(this, rel => rel instanceof type.UMLGeneralization && rel.source === this);
        return generalizations.map(gen => gen.target);
    };
    type.UMLClassifier.prototype.getAbstractSuperClasses = function () {
        var generalizations = Repository.getRelationshipsOf(this, rel => rel instanceof type.UMLGeneralization && rel.source === this && rel.target.isAbstract);
        return generalizations.map(gen => gen.target);
    };

    // classifiers
    /**
         * @return {Array.<type.UMLInterface>} interfaces of the given classifier
         */
    type.UMLClassifier.prototype.getRealizedInterfaces = function () {
        var realisations = Repository.getRelationshipsOf(this, rel => rel instanceof type.UMLInterfaceRealization && rel.source === this);

        return realisations.map(rel => rel.target);
    };

    type.UMLClassifier.prototype.isRoot = function () {
        return this.getSuperClasses().length === 0;
    };

    type.UMLClassifier.prototype.getSubclasses = function () {
        var generalizations = Repository.getRelationshipsOf(this, rel => rel instanceof type.UMLGeneralization && rel.target === this);
        return generalizations.map(gen => gen.source);
    };

    type.UMLClassifier.prototype.hasSubclasses = function () {
        return this.getSubclasses().length !== 0;
    };

    type.UMLClassifier.prototype.isValueType = function () {
        return this.stereotype === "valuetype";
    };

    type.UMLClassifier.prototype.getTemplateSubstitutionParams = function (target) {
        const templateBinding = Repository.getRelationshipsOf(this, rel => rel instanceof type.UMLTemplateBinding &&
            rel.source === this && rel.target === target);

        return templateBinding && templateBinding.length ?
            templateBinding[0].parameterSubstitutions.map(substitution => ({
                "formal": substitution.formal,
                "actual": substitution.actual
            })) :
            [];
    };


    ///////////////////////////////////////////////
    /**
         * Returns true if attribute type is an Enumeration. 
         */
    type.UMLAttribute.prototype.isEnumType = function () {
        return this.type instanceof type.UMLEnumeration;
    };

    const temporalTypes = ["date", "dateTime", "time"];

    function isString(s) {
        return typeof(s) === "string" || s instanceof String;
    }

    type.UMLAttribute.prototype.isTemporalType = function () {
        return temporalTypes.indexOf(this.type) !== -1;
    };

    type.UMLAttribute.prototype.isBasicType = function () {
        return (isString(this.type));
    };

    type.UMLAttribute.prototype.isValueType = function () {
        const attributeType = this.type;
        return attributeType instanceof type.UMLClass && attributeType.isValueType();
    };

    type.UMLAttribute.prototype.isNullableType = function () {
        return ["integer", "int", "bool", "boolean", "float", "double"].indexOf(this.type) === -1;
    };

    type.UMLAttribute.prototype.isMultiValued = function () {
        return !this.isZeroOrOneMultiplicity();
    };
    type.ExtensibleModel.prototype.isNullable = function () {
        const multiplicity = this.multiplicity || "";

        return multiplicity.startsWith("0");
    };

    type.ExtensibleModel.prototype.accept = function () {
    };

    const zeroOrOneMultiplicity = ["1", "0..1"];

    /**
        * Returns true if multiplicity of the umlElement is zero or one.
        */
    type.ExtensibleModel.prototype.isZeroOrOneMultiplicity = function () {
        let multiplicity = this.multiplicity || "1";
        return zeroOrOneMultiplicity.indexOf(multiplicity) !== -1;
    };

    /**
        * Called in the beggining of the code generation.
        */
    type.ExtensibleModel.prototype.reset = function () {
        this.annotations = [];
    };
    type.ExtensibleModel.prototype.cleanup = function () {
        this.codeFragment = null;
    };

    type.ExtensibleModel.prototype.annotate = function (value) {
        if (!this.annotations) {
            this.annotations = [];
        }
        this.annotations.push(value);
        return this;
    };

    type.UMLClassifier.prototype.reset = function () {
        this.annotations = [];
        this.extendedClasses = [];
        this.interfaces = [];
        this.templateParams = [];
    };

    type.ExtensibleModel.prototype.unlinkCodeFragment = function () {
        if (this.codeFragment) {
            this.codeFragment.element = null;
        }
        this.codeFragment = null;
    };

    type.ExtensibleModel.prototype.isRootPackage = function () {
        return false;
    };

    type.UMLPackage.prototype.isRootPackage = function () {
        return this.stereotype === "root";
    };

    type.UMLPackage.prototype.accept = function (visitor) {
        var packageElements = this.ownedElements;

        visitor.visitPackage(this);

        packageElements.forEach(elem => elem.accept(visitor));
    };

    type.UMLPackage.prototype.getPackagePrefix = function () {
        return javaProfile.get("packagePrefix", this);
    };

    type.ExtensibleModel.prototype.getDocumentationFormat = function () {
        const docFormat = documentationProfile.get("docFormat", this);
        return docFormat === "inheritFromParent" ?
            this.isRootPackage() ?
                "javadoc" :
                this._parent.getDocumentationFormat() :
            docFormat;
    };

    type.UMLClass.prototype.accept = function (visitor) {
        let attributes = this.attributes,
            operations = this.operations,
            associations = Repository.getRelationshipsOf(this, rel => rel instanceof type.UMLAssociation);

        visitor.visitClass(this);

        attributes.forEach(attribute => visitor.visitAttribute(this, attribute));
        operations.forEach(operation => visitor.visitOperation(this, operation));
        associations.forEach(association => visitor.visitAssociation(this, association));

        visitor.leaveClass(this);
    };

    type.UMLClass.prototype.getOverridenMethod = function (operation) {
        const overridenMethods = this.operations.filter(op => op.isEqualTo(operation));
        return overridenMethods.length ? overridenMethods[0] : null;
    };

    type.UMLInterface.prototype.accept = function (visitor) {
        let operations = this.operations,
            attributes = this.attributes;
        visitor.visitInterface(this);

        attributes.forEach(attribute => visitor.visitAttribute(this, attribute));
        operations.forEach(operation => visitor.visitOperation(this, operation));

        visitor.leaveInterface(this);
    };

    type.UMLEnumeration.prototype.accept = function (visitor) {
        let operations = this.operations,
            attributes = this.attributes;
        visitor.visitEnumeration(this);

        attributes.forEach(attribute => visitor.visitAttribute(this, attribute));
        operations.forEach(operation => visitor.visitOperation(this, operation));

        visitor.leaveEnumeration(this);
    };

    type.UMLAssociation.prototype.isSelfAssociated = function () {
        return this.end1.reference === this.end2.reference;
    };

    type.UMLInterface.prototype.getMethods = function () {
        let methods = [];
        const superInterfaces = this.getSuperClasses();
        methods = methods.concat(this.operations);
        superInterfaces.forEach(_interface => {
            methods = methods.concat(_interface.getMethods());
        });
        return methods;
    };

    type.UMLClassifier.prototype.getAbstractMethods = function () {
        const superClasses = this.getAbstractSuperClasses();
        const superInterfaces = this.getRealizedInterfaces();
        let methods = this.operations.filter(o => o.isAbstract);
        superClasses.forEach(_class => {
            methods = methods.concat(_class.getAbstractMethods());
        });
        superInterfaces.forEach(_interface => {
            const inheritedFromInterfaces = _interface.getMethods().filter(m => !this.getOverridenMethod(m));
            methods = methods.concat(inheritedFromInterfaces);
        });
        return methods;
    };

    function areEqual(params, otherParams) {
        let i = 0;
        if (!(params.length === otherParams.length)) {
            return false;
        }

        for (i = 0; i < params.length; i++) {
            if (!params[i].name === otherParams[i].name) {
                return false;
            }
            if (!params[i].type === otherParams[i].type) {
                return false;
            }
        }

        return true;
    }

    type.UMLOperation.prototype.isEqualTo = function (other) {
        if (!other) {
            return false;
        }
        if (!(other instanceof type.UMLOperation)) {
            return false;
        }
        if (this.name === other.name && this.isStatic === other.isStatic && areEqual(this.parameters, other.parameters)) {
            return true;
        }

        return false;
    };

    /**
         * getQualifiedName returns qualified name of an element. It ends up at model element having stereotype root,
         * intented for the root package of the code generation.
         * @return {string} qualified name of the package
         */
    type.UMLModelElement.prototype.getQualifiedName = function () {
        let qualifiedName = "";
        if (this.stereotype === "root" || this._parent instanceof type.UMLModel || this._parent instanceof type.Project) {
            var packagePrefix = this.getPackagePrefix ? this.getPackagePrefix() : "";
            qualifiedName = packagePrefix ? packagePrefix + "." + this.name : this.name;
        } else {
            qualifiedName = this._parent.getQualifiedName() + "." + this.name;
        }
        return qualifiedName;
    };

    type.UMLRelationshipEnd.prototype.isNavigable = function() {
        const parentAssociation = this._parent;
        if (this.navigable === true) {
            return true;
        }
        if (this.navigable === "navigable") {
            return true;
        }
        if (parentAssociation.end1.navigable === "unspecified" && parentAssociation.end2.navigable === "unspecified") {
            return true;
        }
        return false;
    };
}

String.prototype.hashCode = function () {
    let hash = 0;
    if (this.length == 0) { return hash; }
    for (i = 0; i < this.length; i++) {
        char = this.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash &= hash; // Convert to 32bit integer
    }
    if (hash < 0) {
        hash = -hash;
    }
    return hash;
};


if (typeof Object.assign != "function") {
    // Must be writable: true, enumerable: false, configurable: true
    Object.defineProperty(Object, "assign", {
        value: function assign(target, varArgs) { // .length of function is 2
            "use strict";
            if (target == null) { // TypeError if undefined or null
                throw new TypeError("Cannot convert undefined or null to object");
            }

            var to = Object(target);

            for (var index = 1; index < arguments.length; index++) {
                var nextSource = arguments[index];

                if (nextSource != null) { // Skip over if undefined or null
                    for (var nextKey in nextSource) {
                        // Avoid bugs when hasOwnProperty is shadowed
                        if (Object.prototype.hasOwnProperty.call(nextSource, nextKey)) {
                            to[nextKey] = nextSource[nextKey];
                        }
                    }
                }
            }
            return to;
        },
        writable: true,
        configurable: true
    });
}

function showTipOfTheDay() {
    toolTipManager.setShowTips(true);
    toolTipManager.showTooltipDialog();
}

function setupJavazzarGui() {
    ExtensionUtils.loadStyleSheet(path.join(__dirname, "styles.css"));
    $("#toolbar .buttons").append($button);
    $button.click(() => extensionsPanel.toggle());

    extensionsPanel.show();

    ProjectManager.on("projectLoaded", (filename, project) => {
        rebelConfiguration.load(filename);
    });
    ProjectManager.on("projectSaved", (filename, project) => {
        rebelConfiguration.save(filename);
    });
}
