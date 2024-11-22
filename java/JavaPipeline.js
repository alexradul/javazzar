const CompositeCodeBuilder = require("../core/generator").CompositeCodeBuilder;
const CodeGenerationVisitor = require("../core/visitor").CodeGenerationVisitor;
const UMLModelVisitor = require("../core/visitor").UMLModelVisitor;
const JavaCodeBuilder = require("./JavaCodeBuilder").JavaCodeBuilder;
const JPAAnnotationBuilder = require("./JPAAnnotationBuilder").JPAAnnotationBuilder;
const CustomAnnotationBuilder = require("./CustomAnnotationBuilder").CustomAnnotationBuilder;
const JavaCodeAssembler = require("./JavaCodeAssembler").JavaCodeAssembler;
const JPACodeAppender = require("./JPACodeAppender").JPACodeAppender;
const SpringTemplateBuilder = require("./SpringTemplateBuilder").SpringTemplateBuilder;
const SpringAnnotationBuilder = require("./SpringAnnotationBuilder").SpringAnnotationBuilder;
const JacksonAnnotationBuilder = require("./JacksonAnnotationBuilder").JacksonAnnotationBuilder;


const JavaDocFormat = require("./JavaDocFormat");

const JavaProfile = require("./JavaProfiles").JavaProfile;

const javaProfile = new JavaProfile();

class JavaCodeGenerationVisitor extends CodeGenerationVisitor {
    constructor(pipeline) {
        super(pipeline);
    }
    visitClass(umlClass) {
        if (javaProfile.is("generateCode", umlClass)) {
            super.visitClass(umlClass);
        }
    }
    visitInterface(umlInterface) {
        if (javaProfile.is("generateCode", umlInterface)) {
            super.visitInterface(umlInterface);
        }
    }
    visitEnumeration(umlEnumeration) {
        if (javaProfile.is("generateCode", umlEnumeration)) {
            super.visitEnumeration(umlEnumeration);
        }
    }
    visitAttribute(umlClassifier, umlAttribute) {
        if (javaProfile.is("generateCode", umlClassifier)) {
            super.visitAttribute(umlClassifier, umlAttribute);
        }
    }
    visitOperation(umlClassifier, umlOperation) {
        if (javaProfile.is("generateCode", umlClassifier)) {
            super.visitOperation(umlClassifier, umlOperation);
        }

    }
    visitAssociation(umlClassifier, umlAssociation) {
        if (javaProfile.is("generateCode", umlClassifier)) {
            super.visitAssociation(umlClassifier, umlAssociation);
        }
    }
    leaveClass(umlClass) {
        if (javaProfile.is("generateCode", umlClass)) {
            super.leaveClass(umlClass);
        }
    }
    leaveInterface(umlInterface) {
        if (javaProfile.is("generateCode", umlInterface)) {
            super.leaveInterface(umlInterface);
        }
    }
    leaveEnumeration(umlEnum) {
        if (javaProfile.is("generateCode", umlEnum)) {
            super.leaveEnumeration(umlEnum);
        }
    }
}


const pipeline = (options) => {
    const pipeline = new CompositeCodeBuilder();
    const documentationFormat = options.generateJavadoc ? JavaDocFormat.parameterisedDocFormat : JavaDocFormat.noDoc;

    pipeline.add(new JavaCodeBuilder(options));

    if (options.enablePersistence) {
        pipeline.add(new JPAAnnotationBuilder(options));
    }

    if (options.enableCustomAnnotations) {
        pipeline.add(new CustomAnnotationBuilder());
    }

    if (options.enableJackson) {
        pipeline.add(new JacksonAnnotationBuilder(options));
    }

    pipeline.add(new JavaCodeAssembler(options, documentationFormat));

    if (options.enableSpring) {
        pipeline.add(new SpringAnnotationBuilder());
    }

    if (options.enablePersistence) {
        pipeline.add(new JPACodeAppender(options));
    }

    pipeline.add(new SpringTemplateBuilder(options));

    return new JavaCodeGenerationVisitor(pipeline);
};

const cleanup = (modelElement) => modelElement.cleanup();

class CleanupVisitor extends UMLModelVisitor {
    CleanupVisitor() {
    }

    visitPackage(umlPackage) {
        cleanup(umlPackage);
    }
    visitClass(umlClass) {
        cleanup(umlClass);
    }
    visitInterface(umlInterface) {
        cleanup(umlInterface);
    }
    visitEnumeration(umlEnumeration) {
        cleanup(umlEnumeration);
    }
}

exports.CleanupVisitor = CleanupVisitor;
exports.pipeline = pipeline;
