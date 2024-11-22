/**
* This module contains code templates for different languages.
*/
let Java, JavaScript;
// Cpp, Scala, Ruby;
const linkReturnType = (otherAssociationEnd, isFluent) => isFluent? otherAssociationEnd.reference.name : "void";
const appendFluentReturnThis = (isFluent, indent) => isFluent? `${indent}return this;\n`: "";

Java = {
    privateAttribute: function (umlElement) {
        let attribute = "private ";
        if (umlElement.modifiers) {
            attribute += `${umlElement.modifiers} `;
        }
        attribute += `${umlElement.elementType} ${umlElement.name};`;
        return attribute;
    },
    privateAttributeCollection: function (umlElement) {
        let attribute = "private ";
        if (umlElement.modifiers) {
            attribute += `${umlElement.modifiers} `;
        }
        attribute += `${umlElement.elementType} ${umlElement.name} = new ${umlElement.collectionTypeImpl}();`;
        return attribute;
    },
    attributeGetter: function (attribute, indent) {
        let getter = "";
        const getterPrefix = (attribute.elementType != "boolean") ? "get" : "is";
        if (attribute.accessLevel) {
            getter = `${attribute.accessLevel} `;
        }
        if (attribute.modifiers) {
            getter += `${attribute.modifiers} `;
        }
        getter += `${attribute.elementType} ${getterPrefix}${attribute.name.toUpperCamelCase()}() {
${indent}return ${attribute.name};
}`;
        return getter;
    },
    attributeSetter: function (attribute, indent) {
        let setter = "";
        if (attribute.accessLevel) {
            setter = `${attribute.accessLevel} `;
        }
        if (attribute.modifiers) {
            setter += `${attribute.modifiers} `;
        }
        setter += `void set${attribute.name.toUpperCamelCase()}(${attribute.elementType} ${attribute.name}) {
${indent}this.${attribute.name} = ${attribute.name};
}`;
        return setter;
    },
    fluentAttributeSetter: function (umlClassifier, attribute, indent) {
        let setter = "";
        if (attribute.accessLevel) {
            setter = `${attribute.accessLevel} `;
        }
        if (attribute.modifiers) {
            setter += `${attribute.modifiers} `;
        }
        setter += `${umlClassifier.name} set${attribute.name.toUpperCamelCase()}(${attribute.elementType} ${attribute.name}) {
${indent}this.${attribute.name} = ${attribute.name};
${indent}return this;
}`;
        return setter;
    },
    classifierDeclaration: function (umlClass) {
        let declaration = "";
        if (umlClass.accessLevel) {
            declaration = `${umlClass.accessLevel} `;
        }
        if (umlClass.modifiers) {
            declaration += `${umlClass.modifiers} `;
        }
        declaration += `${umlClass.classifierType} ${umlClass.name}`;
        if (umlClass.templateParams && umlClass.templateParams.length) {
            declaration += `<${umlClass.templateParams.join(", ")}>`;
        }
        if (umlClass.extendedClasses && umlClass.extendedClasses.length > 0) {
            declaration += ` extends ${umlClass.extendedClasses.join(",")}`;
        }
        if (umlClass.templateSubstitutes && umlClass.templateSubstitutes.length) {
            declaration += `<${umlClass.templateSubstitutes.map(templateParam => `${templateParam.actual}`).join(", ")}>`;
        }
        if (umlClass.interfaces && umlClass.interfaces.length > 0) {
            declaration += ` implements ${umlClass.interfaces.join(", ")}`;
        }
        return declaration;
    },
    packageDeclaration: function (umlPackage) {
        return `package ${umlPackage.getQualifiedName()};`;
    },
    method: function(umlOperation, methodParams, returnParam, methodProperties) {
        let signature = "";
        if (methodProperties.accessLevel) {
            signature = `${methodProperties.accessLevel} `;
        }
        if (methodProperties.modifiers) {
            signature += `${methodProperties.modifiers} `;
        }
        if (returnParam) {
            signature += `${returnParam} `;
        }
        signature += `${umlOperation.name}(${methodParams.join(", ")})`;
        if (umlOperation.throws && umlOperation.throws.length > 0) {
            signature += ` throws ${umlOperation.throws.join(", ")}`;
        }
        return signature;
    },
    methodSignature: function (umlOperation, methodParams, returnParam) {
        const methodProperties = {};
        methodProperties.accessLevel = umlOperation.accessLevel;
        methodProperties.modifiers = umlOperation.modifiers;
        return this.method(umlOperation, methodParams, returnParam, methodProperties);
    },
    linkBiAssociation_1_1: function (mySide, otherSide, indent, isFluent) {
        let myReferenceClass = mySide.reference.name,
            myReferenceVar = `_${mySide.name}`,
            otherAssociationEnd = otherSide.name.toUpperCamelCase(),
            myAssociationEnd = mySide.name.toUpperCamelCase();
        
        const accessLevel = mySide.accessLevel? `${mySide.accessLevel} ` : "";
        
        const returnType = linkReturnType(otherSide, isFluent);

        return `${accessLevel}${returnType} link${myAssociationEnd}(${myReferenceClass} ${myReferenceVar}) {\n${indent}` +
            `if (${myReferenceVar} != null) {\n${indent}${indent}` +
            `${myReferenceVar}.unlink${otherAssociationEnd}();\n${indent}${indent}` +
            `${myReferenceVar}.set${otherAssociationEnd}(this);\n${indent}` +
            `}\n\n${indent}` +
            `unlink${myAssociationEnd}();\n${indent}` +
            `set${myAssociationEnd}(${myReferenceVar});\n` +
            appendFluentReturnThis(isFluent, indent) +
            "}";
    },
    unlinkBiAssociation_1_1: function (mySide, otherSide, indent, isFluent) {
        let otherAssociationEnd = otherSide.name.toUpperCamelCase(),
            myAssociationEnd = mySide.name.toUpperCamelCase();
        const accessLevel = mySide.accessLevel? `${mySide.accessLevel} ` : "";
        const returnType = linkReturnType(otherSide, isFluent);

        return `${accessLevel}${returnType} unlink${myAssociationEnd}() {\n${indent}` +
            `if (get${myAssociationEnd}() != null) {\n${indent}${indent}` +
            `get${myAssociationEnd}().set${otherAssociationEnd}(null);\n${indent}${indent}` +
            `set${myAssociationEnd}(null);\n${indent}` +
            "}\n" +
            appendFluentReturnThis(isFluent, indent) +
            "}";
    },
    linkBiAssociation_1_N: function (mySide, otherSide, indent, isFluent) {
        let myReferenceClass = mySide.reference.name,
            myReferenceVar = `_${mySide.name}`,
            otherAssociationEnd = otherSide.name.toUpperCamelCase(),
            myAssociationEnd = mySide.name.toUpperCamelCase();
        const accessLevel = mySide.accessLevel? `${mySide.accessLevel} ` : "";
        const returnType = linkReturnType(otherSide, isFluent);

        return `${accessLevel}${returnType} link${myAssociationEnd}(${myReferenceClass} ${myReferenceVar}) {\n${indent}` +
            `if (${myReferenceVar} != null) {\n${indent}${indent}` +
            `${myReferenceVar}.unlink${otherAssociationEnd}();\n${indent}${indent}` +
            `${myReferenceVar}.set${otherAssociationEnd}(this);\n${indent}${indent}` +
            `get${myAssociationEnd}().add(${myReferenceVar});\n${indent}` +
            "}\n" +
            appendFluentReturnThis(isFluent, indent) +
            "}";
    },
    unlinkBiAssociation_1_N: function (mySide, otherSide, indent, isFluent) {
        let myReferenceClass = mySide.reference.name,
            myReferenceVar = `_${mySide.name}`,
            otherAssociationEnd = otherSide.name.toUpperCamelCase(),
            myAssociationEnd = mySide.name.toUpperCamelCase();
        const returnType = linkReturnType(otherSide, isFluent);
        const accessLevel = mySide.accessLevel? `${mySide.accessLevel} ` : "";
        return `${accessLevel}${returnType} unlink${myAssociationEnd}(${myReferenceClass} ${myReferenceVar}) {\n${indent}` +
            `if (${myReferenceVar} != null) {\n${indent}${indent}` +
            `${myReferenceVar}.set${otherAssociationEnd}(null);\n${indent}${indent}` +
            `get${myAssociationEnd}().remove(${myReferenceVar});\n${indent}` +
            "}\n" +
            appendFluentReturnThis(isFluent, indent) +
            "}";
    },
    unlinkBiAssociation_1_N_collection: function (mySide, otherSide, indent, isFluent) {
        let myReferenceClass = mySide.reference.name,
            myReferenceVar = `_${mySide.name}`,
            otherAssociationEnd = otherSide.name.toUpperCamelCase(),
            myAssociationEnd = mySide.name.toUpperCamelCase();
        const returnType = linkReturnType(otherSide, isFluent);
        const accessLevel = mySide.accessLevel? `${mySide.accessLevel} ` : "";

        return `${accessLevel}${returnType} unlink${myAssociationEnd}(${myReferenceClass} ${myReferenceVar}, Iterator<${myReferenceClass}> it) {\n${indent}` +
            `if (${myReferenceVar} != null) {\n${indent}${indent}` +
            `${myReferenceVar}.set${otherAssociationEnd}(null);\n${indent}${indent}` +
            `it.remove();\n${indent}` +
            "}\n" +
            appendFluentReturnThis(isFluent, indent) +
            "}";
    },
    linkBiAssociation_N_1: function (mySide, otherSide, indent, isFluent) {
        let myReferenceClass = mySide.reference.name,
            myReferenceVar = `_${mySide.name}`,
            otherAssociationEnd = otherSide.name.toUpperCamelCase(),
            myAssociationEnd = mySide.name.toUpperCamelCase();
        const returnType = linkReturnType(otherSide, isFluent);
        const accessLevel = mySide.accessLevel? `${mySide.accessLevel} ` : "";
        return `${accessLevel}${returnType} link${myAssociationEnd}(${myReferenceClass} ${myReferenceVar}) {\n${indent}` +
            `if (${myReferenceVar} != null) {\n${indent}${indent}` +
            `${myReferenceVar}.get${otherAssociationEnd}().add(this);\n${indent}` +
            `}\n\n${indent}` +
            `unlink${myAssociationEnd}();\n${indent}` +
            `set${myAssociationEnd}(${myReferenceVar});\n` +
            appendFluentReturnThis(isFluent, indent) +
            "}";
    },
    unlinkBiAssociation_N_1: function (mySide, otherSide, indent, isFluent) {
        let otherAssociationEnd = otherSide.name.toUpperCamelCase(),
            myAssociationEnd = mySide.name.toUpperCamelCase();
        const returnType = linkReturnType(otherSide, isFluent);
        const accessLevel = mySide.accessLevel? `${mySide.accessLevel} ` : "";
        return `${accessLevel}${returnType} unlink${myAssociationEnd}() {\n${indent}` +
            `if (get${myAssociationEnd}() != null) {\n${indent}${indent}` +
            `get${myAssociationEnd}().get${otherAssociationEnd}().remove(this);\n${indent}${indent}` +
            `set${myAssociationEnd}(null);\n${indent}` +
            "}\n" +
            appendFluentReturnThis(isFluent, indent) +
            "}";
    },
    linkBiAssociation_N_N: function (mySide, otherSide, indent, isFluent) {
        let myReferenceClass = mySide.reference.name,
            myReferenceVar = `_${mySide.name}`,
            otherAssociationEnd = otherSide.name.toUpperCamelCase(),
            myAssociationEnd = mySide.name.toUpperCamelCase();
        const returnType = linkReturnType(otherSide, isFluent);
        const accessLevel = mySide.accessLevel? `${mySide.accessLevel} ` : "";
        return `${accessLevel}${returnType} link${myAssociationEnd}(${myReferenceClass} ${myReferenceVar}) {\n${indent}` +
            `if (${myReferenceVar} != null) {\n\t\t` +
            `${myReferenceVar}.get${otherAssociationEnd}().add(this);\n${indent}${indent}` +
            `get${myAssociationEnd}().add(${myReferenceVar});\n${indent}` +
            "}\n" +
            appendFluentReturnThis(isFluent, indent) +
            "}";
    },
    unlinkBiAssociation_N_N: function (mySide, otherSide, indent, isFluent) {
        let myReferenceClass = mySide.reference.name,
            myReferenceVar = `_${mySide.name}`,
            otherAssociationEnd = otherSide.name.toUpperCamelCase(),
            myAssociationEnd = mySide.name.toUpperCamelCase();
        const returnType = linkReturnType(otherSide, isFluent);
        const accessLevel = mySide.accessLevel? `${mySide.accessLevel} ` : "";
        return `${accessLevel}${returnType} unlink${myAssociationEnd}(${myReferenceClass} ${myReferenceVar}) {\n${indent}` +
            `if (${myReferenceVar} != null) {\n${indent}${indent}` +
            `${myReferenceVar}.get${otherAssociationEnd}().remove(this);\n${indent}${indent}` +
            `get${myAssociationEnd}().remove(${myReferenceVar});\n${indent}` +
            "}\n" +
            appendFluentReturnThis(isFluent, indent) +
            "};";
    },
    unlinkBiAssociation_N_N_collection: function (mySide, otherSide, indent, isFluent) {
        let myReferenceClass = mySide.reference.name,
            myReferenceVar = `_${mySide.name}`,
            otherAssociationEnd = otherSide.name.toUpperCamelCase(),
            myAssociationEnd = mySide.name.toUpperCamelCase();
        const returnType = linkReturnType(otherSide, isFluent);
        const accessLevel = mySide.accessLevel? `${mySide.accessLevel} ` : "";
        return `${accessLevel}${returnType} unlink${myAssociationEnd}(${myReferenceClass} ${myReferenceVar}, Iterator<${myReferenceClass}> it) {\n${indent}` +
            `if (${myReferenceVar} != null) {\n${indent}${indent}` +
            `${myReferenceVar}.get${otherAssociationEnd}().remove(this);\n${indent}${indent}` +
            `it.remove();\n${indent}` +
            "}\n" +
            appendFluentReturnThis(isFluent, indent) +
            "}";
    },
    linkUniAssociation_1: function (mySide, otherSide, indent, isFluent) {
        let myReferenceClass = mySide.reference.name,
            myReferenceVar = `_${mySide.name}`,
            myAssociationEnd = mySide.name.toUpperCamelCase();
        const returnType = linkReturnType(otherSide, isFluent);
        const accessLevel = mySide.accessLevel? `${mySide.accessLevel} ` : "";
        return `${accessLevel}${returnType} link${myAssociationEnd}(${myReferenceClass} ${myReferenceVar}) {\n${indent}` +
            `set${myAssociationEnd}(${myReferenceVar});\n` +
            appendFluentReturnThis(isFluent, indent) +
            "}";
    },
    unlinkUniAssociation_1: function (mySide, otherSide, indent, isFluent) {
        let myAssociationEnd = mySide.name.toUpperCamelCase();
        const returnType = linkReturnType(otherSide, isFluent);
        const accessLevel = mySide.accessLevel? `${mySide.accessLevel} ` : "";

        return `${accessLevel}${returnType} unlink${myAssociationEnd}() {\n${indent}` +
            `set${myAssociationEnd}(null);\n` +
            appendFluentReturnThis(isFluent, indent) +
            "}";
    },
    linkUniAssociation_N: function (mySide, otherSide, indent, isFluent) {
        let myReferenceClass = mySide.reference.name,
            myReferenceVar = `_${mySide.name}`,
            myAssociationEnd = mySide.name.toUpperCamelCase();
        const returnType = linkReturnType(otherSide, isFluent);
        const accessLevel = mySide.accessLevel? `${mySide.accessLevel} ` : "";

        return `${accessLevel}${returnType} link${myAssociationEnd}(${myReferenceClass} ${myReferenceVar}) {\n${indent}` +
            `if (${myReferenceVar} != null) {\n${indent}${indent}` +
            `get${myAssociationEnd}().add(${myReferenceVar});\n${indent}` +
            "}\n" +
            appendFluentReturnThis(isFluent, indent) +
            "}";

    },
    unlinkUniAssociation_N: function (mySide, otherSide, indent, isFluent) {
        let myReferenceClass = mySide.reference.name,
            myReferenceVar = `_${mySide.name}`,
            myAssociationEnd = mySide.name.toUpperCamelCase();
        const returnType = linkReturnType(otherSide, isFluent);
        const accessLevel = mySide.accessLevel? `${mySide.accessLevel} ` : "";

        return `${accessLevel}${returnType} unlink${myAssociationEnd}(${myReferenceClass} ${myReferenceVar}) {\n${indent}` +
            `if (${myReferenceVar} != null) {\n${indent}${indent}` +
            `get${myAssociationEnd}().remove(${myReferenceVar});\n${indent}` +
            "}\n" +
            appendFluentReturnThis(isFluent, indent) +
            "}";
    },
    unlinkUniAssociation_N_collection: function (mySide, otherSide, indent, isFluent) {
        let myReferenceClass = mySide.reference.name,
            myAssociationEnd = mySide.name.toUpperCamelCase();
        const returnType = linkReturnType(otherSide, isFluent);
        const accessLevel = mySide.accessLevel? `${mySide.accessLevel} ` : "";
        
        return `${accessLevel}${returnType} unlink${myAssociationEnd}(Iterator<${myReferenceClass}> it) {\n${indent}` +
            "it.remove();\n" +
            appendFluentReturnThis(isFluent, indent) +
            "}";
    },
    idBasedEqualsMethod: function (umlClass, indent, operator, emptyId) {
        return `@Override\npublic boolean equals(Object obj) {\n${indent}` +
            `if (super.equals(obj)) return true;\n${indent}` +
            `if (getId() == ${emptyId}) return false;\n${indent}` +
            `return obj instanceof ${umlClass.name} && ${operator(umlClass)};\n` +
            "}";
    },
    idBasedHashCodeMethod: function (umlClass, indent) {
        return `@Override\npublic int hashCode() {\n${indent}` +
            `return ${umlClass._id.hashCode() % 654};\n` +
            "}";
    },
    idAttribute: function (umlClass, elementType) {
        return `private ${elementType} id;`;
    },
    versionAttribute: function (umlClass, elementType) {
        return `private ${elementType} version;`;
    },
    idAttributeGetter: function (elementType, indent) {
        return `public ${elementType} getId(){\n${indent}return id;\n}`;
    }

};

JavaScript = {

};

exports.Java = Java;
exports.JavaScript = JavaScript;
