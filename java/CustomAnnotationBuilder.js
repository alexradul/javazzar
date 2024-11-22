/* global define */

let CodeBuilder = require("../core/generator").CodeBuilder;
const CustomAnnotationProfile = require("./JavaProfiles").CustomAnnotationProfile;
const customAnnotationProfile = new CustomAnnotationProfile();

class CustomAnnotationBuilder extends CodeBuilder {
    buildModule(umlPackage) {
        this.applyCustomAnnotations(umlPackage);
    }
    buildClass(umlClass) {
        this.applyCustomAnnotations(umlClass);
    }
    buildEnum(umlEnumeration) {
        this.applyCustomAnnotations(umlEnumeration);
    }
    buildInterface(umlInterface) {
        this.applyCustomAnnotations(umlInterface);
    }
    buildAttribute(umlAttribute) {
        this.applyCustomAnnotations(umlAttribute);
    }
    buildMethod(umlOperation) {
        this.applyCustomAnnotations(umlOperation);
    }
    buildMethodParam(umlParam) {
        this.applyCustomAnnotations(umlParam);
    }

    buildOneToOne(umlAssociation, myAssociationEnd) {
        this.applyCustomAnnotations(myAssociationEnd);
    }
    buildOneToMany(umlAssociation, myAssociationEnd) {
        this.applyCustomAnnotations(myAssociationEnd);
    }
    buildManyToOne(umlAssociation, myAssociationEnd) {
        this.applyCustomAnnotations(myAssociationEnd);
    }
    buildManyToMany(umlAssociation, myAssociationEnd) {
        this.applyCustomAnnotations(myAssociationEnd);
    }
    buildOneToOneDirected(umlAssociation, myAssociationEnd) {
        this.applyCustomAnnotations(myAssociationEnd);
    }
    buildManyToOneDirected(umlAssociation, myAssociationEnd) {
        this.applyCustomAnnotations(myAssociationEnd);
    }
    buildOneToManyDirected(umlAssociation, myAssociationEnd) {
        this.applyCustomAnnotations(myAssociationEnd);
    }
    buildManyToManyDirected(umlAssociation, myAssociationEnd) {
        this.applyCustomAnnotations(myAssociationEnd);
    }

    applyCustomAnnotations(modelElement) {
        let annotations = customAnnotationProfile.get("annotation", modelElement);
        annotations.split("@").forEach(annotation => {
            if (annotation) {
                modelElement.annotate(`@${annotation}`);
            }
        });
    }
}

exports.CustomAnnotationBuilder = CustomAnnotationBuilder;
