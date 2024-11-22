/**
* Preferences to be specified for mddToolkit.
*/

/* global app*/

const TypeMapping = require("./core/generator").TypeMapping;

const PreferenceManager = app.preferences;
const preferenceId = "javazzar";
const typeMapping = new TypeMapping();

typeMapping.registerMappings([
    ["string", "String"],
    ["integer", "int"],
    ["long", "long"],
    ["bool", "boolean"],
    ["float", "float"],
    ["double", "double"],
    ["dateTime", "LocalDateTime"],
    ["date", "LocalDate"],
    ["time", "LocalTime"],
    ["binary", "byte[]"]
]);

function getPreferenceId() {
    return preferenceId;
}

function loadPreferredTypeMapping() {
    var baseKey = `${preferenceId}.java.typemapping.`;

    for (var type in typeMapping.getMappings()) {
        var mappedType = PreferenceManager.get(baseKey + type);
        typeMapping.register(type, mappedType);
    }

    return typeMapping;
}

function getGenOptions() {
    return {
        isSuppressProperties: PreferenceManager.get("javazzar.rebel.suppressProperties"),
        showTipsOnStartup: PreferenceManager.get("javazzar.rebel.showTipsAtStartup"),
        useTabForIndentation: PreferenceManager.get("javazzar.java.codegen.useTabForIndentation"),
        indentSpaces: PreferenceManager.get("javazzar.java.codegen.indentSpaces"),
        useDiamondOperator: PreferenceManager.get("javazzar.java.codegen.useDiamondOperator"),
        projectCodebase: PreferenceManager.get("javazzar.java.project.codebase"),
        generateAccessors: PreferenceManager.get("javazzar.java.project.generateAccessors"),
        generateJavadoc: PreferenceManager.get("javazzar.java.project.generateJavadoc"),
        generatePackageInfo: PreferenceManager.get("javazzar.java.project.generatePackageInfo"),
        fileHeaderComment: PreferenceManager.get("javazzar.java.project.fileHeaderComment"),
        standardImports: PreferenceManager.get("javazzar.java.additional.standardImports"),
        fluentSetters: PreferenceManager.get("javazzar.java.additional.fluentSetters"),
        linkMethodsEnabled: PreferenceManager.get("javazzar.java.additional.linkMethodsEnabled"),
        fluentLinkMethods: PreferenceManager.get("javazzar.java.additional.fluentLinkMethods"),
        unorderedCollection: PreferenceManager.get("javazzar.java.additional.unorderedCollection"),
        unorderedCollectionImpl: PreferenceManager.get("javazzar.java.additional.unorderedCollectionImpl"),
        orderedCollection: PreferenceManager.get("javazzar.java.additional.orderedCollection"),
        orderedCollectionImpl: PreferenceManager.get("javazzar.java.additional.orderedCollectionImpl"),
        typeMapping: loadPreferredTypeMapping(),
        getIndentString: function () {
            let indentString;
            if (this.useTabForIndentation) {
                indentString = "\t";
            } else {
                indentString = " ".repeat(this.indentSpaces);
            }
            return indentString;
        },
        enablePersistence: PreferenceManager.get("javazzar.java.persistence.enable"),
        idAttributeType: PreferenceManager.get("javazzar.java.persistence.idAttributeType"),
        isGenerateSerializable: PreferenceManager.get("javazzar.java.persistence.generateSerializable"),
        generateEquals: PreferenceManager.get("javazzar.java.persistence.generateEquals"),
        useStringEnumTypes: PreferenceManager.get("javazzar.java.persistence.useStringEnumTypes"),
        useTemporalAnnotation: PreferenceManager.get("javazzar.java.persistence.useTemporalAnnotation"),
        useNotNullAnnotation: PreferenceManager.get("javazzar.java.persistence.useNotNullAnnotation"),
        commonRepositoryInterface: PreferenceManager.get("javazzar.spring.data.commonRepositoryInterface"),
        enableSpring: PreferenceManager.get("javazzar.spring.enable"),
        enableCustomAnnotations: PreferenceManager.get("javazzar.java.annotations.custom.enable"),
        enableJackson: PreferenceManager.get("javazzar.jackson.enable")
    };
}

exports.getPreferenceId = getPreferenceId;
exports.getGenOptions = getGenOptions;