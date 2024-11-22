/* global type*/

let CodeBuilder = require("../core/generator").CodeBuilder;
let DependencyResolver = require("../core/generator").DependencyResolver;

let dependencyResolver = new DependencyResolver();

let getVisibility = (function () {
    var visibilityMapping = {};
    visibilityMapping[type.UMLModelElement.VK_PUBLIC] = "public";
    visibilityMapping[type.UMLModelElement.VK_PRIVATE] = "private";
    visibilityMapping[type.UMLModelElement.VK_PROTECTED] = "protected";
    visibilityMapping[type.UMLModelElement.VK_PACKAGE] = "";

    return function (elem) {
        return visibilityMapping[elem.visibility];
    };
})();

function resolveRaisedExceptions(umlOperation) {
    let raisedExceptions = umlOperation.raisedExceptions || [];

    return raisedExceptions.map(ex => {
        dependencyResolver.resolve(ex);
        return ex.name;
    });
}

function getModifiers(elem, skipAbstract) {
    var modifiers = [];

    if (elem.isFinalSpecialization || elem.isLeaf === true) {
        modifiers.push("final");
    }
    if (elem.concurrency && elem.concurrency === "concurrent") {
        modifiers.push("synchronized");
    }
    if (elem.isStatic) {
        modifiers.push("static");
    }
    if (elem.isAbstract && !skipAbstract) {
        modifiers.push("abstract");
    }
    return modifiers;
}

class JavaCodeBuilder extends CodeBuilder {
    constructor(options) {
        super();
        this.typeMapping = options.typeMapping;
        this.orderedCollection = options.orderedCollection;
        this.orderedCollectionImpl = options.orderedCollectionImpl;
        this.unorderedCollection = options.unorderedCollection;
        this.unorderedCollectionImpl = options.unorderedCollectionImpl;
        this.useDiamondOperator = options.useDiamondOperator;

        this.module = null;
        this.classifier = null;
        this.package = null;
    }
    buildModule(umlPackage) {
        //
        umlPackage.reset();
        this.package = umlPackage;
        dependencyResolver.reset(umlPackage);
    }
    buildClass(umlClass) {
        this.buildClassifier(umlClass, "class");
    }
    buildEnum(umlEnumeration) {
        this.buildClassifier(umlEnumeration, "enum");
    }
    buildInterface(umlInterface) {
        this.buildClassifier(umlInterface, "interface");
    }
    buildAttribute(umlAttribute) {
        this.processClassAttribute(umlAttribute);
    }
    buildMethod(umlOperation) {
        umlOperation.reset();
        umlOperation.accessLevel = getVisibility(umlOperation);
        if (umlOperation._parent instanceof type.UMLInterface && umlOperation.accessLevel === "public") {
            umlOperation.accessLevel = "";
        }        
        umlOperation.modifiers = getModifiers(umlOperation).join(" ");
        umlOperation.throws = resolveRaisedExceptions(umlOperation);
    }
    buildMethodParam(umlParam) {
        umlParam.reset();
        umlParam.paramType = this.getTargetElementType(umlParam);
    }

    buildOneToOne(umlAssociation, myAssociationEnd) {
        this.processClassAttribute(myAssociationEnd);
    }
    buildOneToMany(umlAssociation, myAssociationEnd) {
        this.processClassAttribute(myAssociationEnd);
    }
    buildManyToOne(umlAssociation, myAssociationEnd) {
        this.processClassAttribute(myAssociationEnd);
    }
    buildManyToMany(umlAssociation, myAssociationEnd) {
        this.processClassAttribute(myAssociationEnd);
    }
    buildOneToOneDirected(umlAssociation, myAssociationEnd) {
        this.processClassAttribute(myAssociationEnd);
    }
    buildManyToOneDirected(umlAssociation, myAssociationEnd) {
        this.processClassAttribute(myAssociationEnd);
    }
    buildOneToManyDirected(umlAssociation, myAssociationEnd) {
        this.processClassAttribute(myAssociationEnd);
    }
    buildManyToManyDirected(umlAssociation, myAssociationEnd) {
        this.processClassAttribute(myAssociationEnd);
    }
    leave(umlClassifier) {
        umlClassifier.resolvedImports = dependencyResolver.getResolvedImports();
        dependencyResolver.reset(this.package);
    }
    processClassAttribute(umlElement) {
        umlElement.reset();
        umlElement.elementType = this.getTargetElementType(umlElement);
        umlElement.accessLevel = getVisibility(umlElement);
        umlElement.modifiers = getModifiers(umlElement).join(" ");
        if (!umlElement.isZeroOrOneMultiplicity()) {
            umlElement.collectionTypeImpl = this.getCollectionImpl(umlElement);
        }
    }
    getCollectionImpl(umlElement) {
        const elementType = this.getMappedElementType(umlElement);
        return umlElement.isOrdered ? this.getOrderedCollectionImpl(elementType) : this.getUnorderedCollectionImpl(elementType);
    }
    getMappedElementType(umlElement) {
        let elementType = "void";
        if (umlElement) {
            if (umlElement instanceof type.UMLAssociationEnd) {
                dependencyResolver.resolve(umlElement.reference);
                elementType = umlElement.reference.name;
            } else if (umlElement.type) {
                if (umlElement.type instanceof type.UMLClassifier) {
                    dependencyResolver.resolve(umlElement.type);
                    elementType = umlElement.type.name;
                } else {
                    elementType = this.typeMapping.map(umlElement.type);
                }
            }
        }
        return elementType;
    }
    getTargetElementType(umlElement) {
        let elementType = this.getMappedElementType(umlElement);
        if (!umlElement.isZeroOrOneMultiplicity()) {
            elementType = umlElement.isOrdered ? this.getOrderedCollection(elementType) : this.getUnorderedCollection(elementType);
        }
        return elementType;
    }

    getOrderedCollection(elementType) {
        return `${this.orderedCollection}<${elementType}>`;
    }
    getUnorderedCollection(elementType) {
        return `${this.unorderedCollection}<${elementType}>`;
    }
    getOrderedCollectionImpl(elementType) {
        return this.useDiamondOperator?
            `${this.orderedCollectionImpl}<>`:
            `${this.orderedCollectionImpl}<${elementType}>`;
    }
    getUnorderedCollectionImpl(elementType) {
        return this.useDiamondOperator?
             `${this.unorderedCollectionImpl}<>`:
             `${this.unorderedCollectionImpl}<${elementType}>`;
    }
    buildClassifier(umlClassifier, classifierType) {
        umlClassifier.reset();
        umlClassifier.accessLevel = getVisibility(umlClassifier);
        umlClassifier.modifiers = getModifiers(umlClassifier).join(" ");
        umlClassifier.extendedClasses = umlClassifier.getSuperClasses().map(_cls => {
            const templateSubstitutes = getTemplateSubstitutes(umlClassifier, _cls);
            dependencyResolver.resolve(_cls);
            if (templateSubstitutes && templateSubstitutes.length) {
                return `${_cls.name}<${templateSubstitutes.map(templateParam => `${templateParam.actual}`).join(",")}>`;
            } else {
                return _cls.name;
            }
        });
        umlClassifier.interfaces = umlClassifier.getRealizedInterfaces().map(function (_int) {
            const templateSubstitutes = getTemplateSubstitutes(umlClassifier, _int);
            dependencyResolver.resolve(_int);
            if (templateSubstitutes && templateSubstitutes.length) {
                return `${_int.name}<${templateSubstitutes.map(templateParam => `${templateParam.actual}`).join(",")}>`;
            } else {
                return _int.name;
            }
        });
        if (umlClassifier.templateParameters && umlClassifier.templateParameters.length) {
            umlClassifier.templateParams = umlClassifier.templateParameters.map(param => 
                param.parameterType?
                    `${param.name} ${param.parameterType}` : 
                    param.name);
        }
        umlClassifier.classifierType = classifierType;
    }

}

function getTemplateSubstitutes(umlClassifier, superType) {
    return umlClassifier.getTemplateSubstitutionParams(superType).map(param => {
        dependencyResolver.resolve(param.actual);
        return {
            "formal": param.formal.name,
            "actual": param.actual.name
        };
    });
}

exports.JavaCodeBuilder = JavaCodeBuilder;
exports.getModifiers = getModifiers;
exports.getAccessLevel = getVisibility;