/**
*  Implements DocFormat interface according to javadoc documentation format.
*/

/* global type*/

let DocFormat = require("../core/generator").DocFormat;

function formatDoc(umlElement) {
    let documentation = umlElement.documentation;
    return formatJavaDoc(documentation);
}

function formatJavaDoc(comment) {
    if (!comment) {
        return "";
    }

    comment = comment.trim().replaceAll("\n", "\n* ");

    return `/**
* ${comment}
*/`;
}

class JavaDocFormat extends DocFormat {
    apply(codeFragment, umlElement, value) {
        codeFragment.document(value);
    }
    formatAttributeDocumentation(umlAttribute) {
        return formatDoc(umlAttribute);
    }
    formatMethodDocumentation(umlOperation) {
        var lines = umlOperation.documentation.trim().split("\n"),
            params = umlOperation.getNonReturnParameters(),
            returnParam = umlOperation.getReturnParameter();

        params.forEach(param => {
            lines.push(`@param ${param.name} ${param.documentation.trim()}`);
        });

        if (returnParam && returnParam.documentation.trim()) {
            lines.push("@returns " + returnParam.documentation.trim());
        }

        return formatJavaDoc(lines.join("\n"));
    }
    formatClassDocumentation(umlClassifier) {
        return formatDoc(umlClassifier);
    }
    formatPackageDocumentation(umlPackage) {
        return formatDoc(umlPackage);
    }
}

class SwaggerDocFormat extends DocFormat {
    apply(codeFragment, umlElement, value){
        if (value){
            umlElement.annotate(value);
        }
    }
    formatAttributeDocumentation(umlAttribute) {
        const doc = umlAttribute.documentation.trim();
        if (doc) {
            return umlAttribute.isNullable()?
            `@ApiModelProperty("${doc}")`:
            `@ApiModelProperty(value = "${doc}", required = true)`;
        }
    }
    formatMethodDocumentation() {
    }
    formatClassDocumentation(umlClassifier) {
        if (umlClassifier instanceof type.UMLClass) {
            const doc = umlClassifier.documentation.trim();
            umlClassifier.codeFragment.addStandardImport("import io.swagger.annotations.ApiModel;");
            umlClassifier.codeFragment.addStandardImport("import io.swagger.annotations.ApiModelProperty;");
            return `@ApiModel(description = "${doc}")`;
        }
    }
    formatPackageDocumentation() {
    }
}

class NoDocFormat extends DocFormat {
    apply(){
    }

}

const document = (codeFragment, umlElement, formatFn, applyFn) => {
    const doc = formatFn(umlElement);
    if (doc) {
        applyFn(codeFragment, umlElement, doc);
    }
    return codeFragment;
};

class DocumentBuilder {
    constructor(docFormat){
        this.docFormat = docFormat;
    }
    documentAttribute(codeFragment, umlAttribute) {
        return document(
            codeFragment, 
            umlAttribute, 
            this.docFormat.formatAttributeDocumentation, 
            this.docFormat.apply);
    }
    documentMethod(codeFragment, umlMethod) {
        return document(
            codeFragment, 
            umlMethod, 
            this.docFormat.formatMethodDocumentation, 
            this.docFormat.apply);
    }
    documentClass(codeFragment, umlClassifier) {
        return document(
            codeFragment, 
            umlClassifier, 
            this.docFormat.formatClassDocumentation, 
            this.docFormat.apply);
    }
    documentPackage(codeFragment, umlPackage) {
        return document(
            codeFragment, 
            umlPackage,
            this.docFormat.formatPackageDocumentation,
            this.docFormat.apply
        );
    }
}

const javaDocBilder = new DocumentBuilder(new JavaDocFormat()),
    swaggerDocBuilder = new DocumentBuilder(new SwaggerDocFormat()),
    none = new DocumentBuilder(new NoDocFormat());

const supportedBuilders = {
    "javadoc": javaDocBilder,
    "swagger": swaggerDocBuilder,
    "none": none
};

exports.javaDocOnly = () => javaDocBilder;
exports.parameterisedDocFormat = (docFormat) => supportedBuilders[docFormat];
exports.noDoc = () => none;
