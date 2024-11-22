/* global define */

const associationProcessingChain = require("./links").associationProcessingChain;

/**
* UMLModelVisitor
*/
class UMLModelVisitor {
    constructor() { }
    /**
* Visits a UMLPackage.
* @param {type.UMLPackage} pkg
*/
    visitPackage() { }
    /**
* Visits a UMLClass.
* @param {type.UMLClass} cls
*/
    visitClass() { }
    /**
* Visits a UMLInterface
* @param {type.UMLInterface} int
*/
    visitInterface() { }

    /**
* Visits a UMLEnumeration
* @param {type.UMLEnumeration} enumeration
*/
    visitEnumeration() { }

    /**
* Visits attribute.
* @param {type.UMLClassifier} cls
* @param {type.UMLAttribute} attribute
*/
    visitAttribute() { }
    /**
* Visits operation.
* @param {type.UMLClassifier} cls
* @param {type.UMLOperation} operation
*/
    visitOperation() { }

    /**
* Visits association.
* @param {type.UMLClassifier} cls
* @param {type.UMLAssociation} association
*/
    visitAssociation() { }
    /**
* Called when visitor is about to leave the class.
* @param {type.UMLClass} umlClass
*/
    leaveClass() { }
    /**
* Called when visitor is about to leave the interface.
* @param {type.UMLInterface} umlInterface
*/
    leaveInterface() { }
    /**
* Called when visitor is about to leave the enumeration.
* @param {type.UMLEnumeration} umlEnum
*/
    leaveEnumeration() { }
}

exports.UMLModelVisitor = UMLModelVisitor;

class CodeGenerationVisitor extends UMLModelVisitor {
    constructor(codeBuilder) {
        super();
        this.codeBuilder = codeBuilder;
    }
    visitPackage(umlPackage) {
        this.codeBuilder.buildModule(umlPackage);
    }
    visitClass(umlClass) {
        this.codeBuilder.buildClass(umlClass);
    }
    visitInterface(umlInterface) {
        this.codeBuilder.buildInterface(umlInterface);
    }
    visitEnumeration(umlEnumeration) {
        this.codeBuilder.buildEnum(umlEnumeration);
    }
    visitAttribute(umlClassifier, umlAttribute) {
        this.codeBuilder.buildAttribute(umlAttribute);
    }
    visitOperation(umlClassifier, umlOperation) {
        let inputParams = umlOperation.getNonReturnParameters();
        let outputParam = umlOperation.getReturnParameter();

        inputParams.forEach(param => {
            this.codeBuilder.buildMethodParam(param);
        });

        if (outputParam) {
            this.codeBuilder.buildMethodParam(outputParam);
        }

        this.codeBuilder.buildMethod(umlOperation);

    }
    visitAssociation(umlClassifier, umlAssociation) {
        let end1 = umlAssociation.end1,
            end2 = umlAssociation.end2,
            myAssociationEnd,
            otherAssociationEnd;
        if (end1.reference === umlClassifier && end2.isNavigable()) {
            myAssociationEnd = end2;
            otherAssociationEnd = end1;
            associationProcessingChain.process(this.codeBuilder, umlAssociation, myAssociationEnd, otherAssociationEnd);
        }
        if (end2.reference === umlClassifier && end1.isNavigable()) {
            myAssociationEnd = end1;
            otherAssociationEnd = end2;
            associationProcessingChain.process(this.codeBuilder, umlAssociation, myAssociationEnd, otherAssociationEnd);
        }
    }
    leaveClass(umlClass) {
        this.codeBuilder.leave(umlClass);
    }
    leaveInterface(umlInterface) {
        this.codeBuilder.leave(umlInterface);
    }
    leaveEnumeration(umlEnum) {
        this.codeBuilder.leave(umlEnum);
    }
}


exports.CodeGenerationVisitor = CodeGenerationVisitor;

