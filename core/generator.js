/**
 * This module contains core concepts related to transformation of UML into the executable artifacts.
 **/

/* global */

/**
  * TypeMapping
  */
class TypeMapping {
    constructor() {
        this.mappings = {};
    }
    /**
* Registers type mapping.
* @param {string} type type from the Model, like string, Text, Integer, int, etc.
* @param {string} mappedType type to be used in the generated code.
*/
    register(type, mappedType) {
        this.mappings[type] = mappedType;
    }
    /**
* Registers multiple mappings
* @param {Array.Array.<string, string>} mappings mappings to be used
*/
    registerMappings(mappings) {
        mappings.forEach(mapping => this.register(mapping[0], mapping[1]));
    }
    /**
* Maps type to its mapping. If mapping not found, returns 'type' itself.
* @param {string} type model type
* @return {string} mappedType or value of type param if not found
*/
    map(type) {
        if (this.mappings[type]) {
            return this.mappings[type];
        } else {
            return type;
        }
    }
    /**
* Returns mappings registered within this type mapping.
* @return {object} registered type mappings.
*/
    getMappings() {
        return this.mappings;
    }

}

exports.TypeMapping = TypeMapping;

class DependencyResolver {

    constructor() {
        /**
        * current UMLPackage
        */
        this.umlPackage = {};
        /**
         * Contains classes, resolved during code generation as types of attributes,
         * association ends, super classes and interfaces and method parameters.
         */
        this.classImports = [];
    }
    /**
     *  Resolves classifier: checks if it has already been contained within classImports and adds it to the list if not.
     * @param {type.UMLClassifier} classifier to be resolved
     */
    resolve(classifier) {
        const qualifiedName = classifier.getQualifiedName();
        const packageName = qualifiedName.substring(0, qualifiedName.lastIndexOf("."));
        if (this.umlPackage !== classifier._parent && 
            packageName !== "java.lang" &&
            this.classImports.indexOf(qualifiedName) === -1) {
            this.classImports.push(qualifiedName);
        }
    }
    /**
     * Clears resolved class imports and sets umlPackage to the current class package.
     * @param {type.UMLPackage} umlPackage
     */
    reset(umlPackage) {
        this.umlPackage = umlPackage;
        this.classImports = [];
    }
    /**
    * Returns resolved imports.
    */
    getResolvedImports() {
        return this.classImports;
    }

}

exports.DependencyResolver = DependencyResolver;

class CodeBuilder {
    constructor() {
    }

    buildModule(/* umlPackage */) { }
    buildClass(/* umlClass */) { }
    buildAttribute(/* umlAttribute */) { }
    buildMethod(/* umlOperation */) { }
    buildMethodParam(/* umlParam */) { }
    buildEnum(/* umlEnum */) { }
    buildInterface(/* umlInterface */) { }
    buildOneToOne(/* umlAssociation, myAssociationEnd, otherAssociationEnd */) { }
    buildOneToMany(/* umlAssociation, myAssociationEnd, otherAssociationEnd */) { }
    buildManyToOne(/* umlAssociation, myAssociationEnd, otherAssociationEnd */) { }
    buildManyToMany(/* umlAssociation, myAssociationEnd, otherAssociationEnd */) { }
    buildOneToOneDirected(/* umlAssociation, myAssociationEnd, otherAssociationEnd */) { }
    buildManyToOneDirected(/* umlAssociation, myAssociationEnd, otherAssociationEnd */) { }
    buildOneToManyDirected(/* umlAssociation, myAssociationEnd, otherAssociationEnd */) { }
    buildManyToManyDirected(/* umlAssociation, myAssociationEnd, otherAssociationEnd */) { }
    /**
* Invoked at the end of classifier processing.
*/
    leave(/* umlClassifier */) { }
}

exports.CodeBuilder = CodeBuilder;

class CompositeCodeBuilder extends CodeBuilder {
    constructor() {
        super();
        this.builders = [];
    }
    add(builder) {
        this.builders.push(builder);
    }
    buildModule(umlPackage) {
        this.builders.forEach(builder => builder.buildModule(umlPackage));
    }
    buildClass(umlClass) {
        this.builders.forEach(builder => builder.buildClass(umlClass));
    }
    buildAttribute(umlAttribute) {
        this.builders.forEach(builder => builder.buildAttribute(umlAttribute));
    }
    buildMethod(umlOperation) {
        this.builders.forEach(builder => builder.buildMethod(umlOperation));
    }
    buildMethodParam(umlParam) {
        this.builders.forEach(builder => builder.buildMethodParam(umlParam));
    }
    buildEnum(umlEnumeration) {
        this.builders.forEach(builder => builder.buildEnum(umlEnumeration));
    }
    buildInterface(umlInterface) {
        this.builders.forEach(builder => builder.buildInterface(umlInterface));
    }
    buildOneToOne(umlAssociation, myAssociationEnd, otherAssociationEnd) {
        this.builders.forEach(builder => builder.buildOneToOne(umlAssociation, myAssociationEnd, otherAssociationEnd));
    }
    buildOneToMany(umlAssociation, myAssociationEnd, otherAssociationEnd) {
        this.builders.forEach(builder => builder.buildOneToMany(umlAssociation, myAssociationEnd, otherAssociationEnd));
    }
    buildManyToOne(umlAssociation, myAssociationEnd, otherAssociationEnd) {
        this.builders.forEach(builder => builder.buildManyToOne(umlAssociation, myAssociationEnd, otherAssociationEnd));
    }
    buildManyToMany(umlAssociation, myAssociationEnd, otherAssociationEnd) {
        this.builders.forEach(builder => builder.buildManyToMany(umlAssociation, myAssociationEnd, otherAssociationEnd));
    }
    buildOneToOneDirected(umlAssociation, myAssociationEnd, otherAssociationEnd) {
        this.builders.forEach(builder => builder.buildOneToOneDirected(umlAssociation, myAssociationEnd, otherAssociationEnd));
    }
    buildManyToOneDirected(umlAssociation, myAssociationEnd, otherAssociationEnd) {
        this.builders.forEach(builder => builder.buildManyToOneDirected(umlAssociation, myAssociationEnd, otherAssociationEnd));
    }
    buildOneToManyDirected(umlAssociation, myAssociationEnd, otherAssociationEnd) {
        this.builders.forEach(builder => builder.buildOneToManyDirected(umlAssociation, myAssociationEnd, otherAssociationEnd));
    }
    buildManyToManyDirected(umlAssociation, myAssociationEnd, otherAssociationEnd) {
        this.builders.forEach(builder => builder.buildManyToManyDirected(umlAssociation, myAssociationEnd, otherAssociationEnd));
    }
    leave(umlClassifier) {
        this.builders.forEach(builder => builder.leave(umlClassifier));
    }
}

exports.CompositeCodeBuilder = CompositeCodeBuilder;

/**
* Defines interface for formatting documentation comments.
*/
class DocFormat {
    formatAttributeDocumentation(/*umlAttribute*/) {
    }
    formatMethodDocumentation(/*umlOperation*/) {
    }
    formatClassDocumentation(/*umlClassifier*/) {
    }
    formatPackageDocumentation(/*umlPackage*/) {
    }
}

exports.DocFormat = DocFormat;
