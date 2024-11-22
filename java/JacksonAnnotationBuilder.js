let CodeBuilder = require("../core/generator").CodeBuilder;
const JacksonProfile = require("./JavaProfiles").JacksonProfile;
const jacksonProfile = new JacksonProfile();

class JacksonAnnotationBuilder extends CodeBuilder {
    constructor(options) {
        super();
        this.indent = options.getIndentString();
    }
    buildClass(umlClass) {
        const serializable = jacksonProfile.get("serializable", umlClass);
        const ignoreUnknownProperties = jacksonProfile.get("ignoreUnknownProperties", umlClass);
        const typeInfoPropertyHolder = jacksonProfile.isTypeInfoPropertyHolder(umlClass);
        this.classImports = "";
        
        if (!serializable) {
            umlClass.annotate("@JsonIgnoreType");
            this.classImports = "import com.fasterxml.jackson.annotation.*;";
        }
        
        if (typeInfoPropertyHolder) {
            buildJsonTypeInfo(umlClass, this.indent);
            this.classImports = "import com.fasterxml.jackson.annotation.*;";
        }

        if (ignoreUnknownProperties) {
            umlClass.annotate("@JsonIgnoreProperties(ignoreUnknown = true)");
            this.classImports = "import com.fasterxml.jackson.annotation.*;";
        }


    }
    buildAttribute(umlAttribute) { 
        this.processSerializableProperty(umlAttribute);
    }
    buildOneToOne(umlAssociation, myAssociationEnd/* , otherAssociationEnd */) { 
        this.processSerializableProperty(myAssociationEnd);
    }
    buildOneToMany(umlAssociation, myAssociationEnd/* , otherAssociationEnd */) { 
        this.processSerializableProperty(myAssociationEnd);
    }
    buildManyToOne(umlAssociation, myAssociationEnd/* , otherAssociationEnd */) { 
        this.processSerializableProperty(myAssociationEnd);
    }
    buildManyToMany(umlAssociation, myAssociationEnd/* , otherAssociationEnd */) { 
        this.processSerializableProperty(myAssociationEnd);
    }
    buildOneToOneDirected(umlAssociation, myAssociationEnd/* , otherAssociationEnd */) { 
        this.processSerializableProperty(myAssociationEnd);
    }
    buildManyToOneDirected(umlAssociation, myAssociationEnd/* , otherAssociationEnd */) { 
        this.processSerializableProperty(myAssociationEnd);
    }
    buildOneToManyDirected(umlAssociation, myAssociationEnd/* , otherAssociationEnd */) { 
        this.processSerializableProperty(myAssociationEnd);
    }
    buildManyToManyDirected(umlAssociation, myAssociationEnd/* , otherAssociationEnd */) { 
        this.processSerializableProperty(myAssociationEnd);
    }

    leave(umlClassifier) {
        if (this.classImports) {
            umlClassifier.codeFragment.addStandardImport(this.classImports);
        }

        this.classImports = "";
    }

    processSerializableProperty(umlElement) {
        const serializable = jacksonProfile.get("serializable", umlElement);
        const property = jacksonProfile.get("property", umlElement);

        const attributeAnnotation = getAttributeAnnotation(serializable, property);

        if (attributeAnnotation) {
            umlElement.annotate(attributeAnnotation);
            this.classImports = "import com.fasterxml.jackson.annotation.*;";
        }
    }
}

function enumerateClassHierarchy(rootClass) {
    let hierarchy = [];
    hierarchy.push(rootClass);
    rootClass
        .getSubclasses()
        .forEach((subclass) => {
            hierarchy = hierarchy.concat(enumerateClassHierarchy(subclass));
        });
    return hierarchy;
}

function buildJsonTypeInfo(umlClass, indent) {
    applyTypeInfoAnnotation(umlClass, indent);
    defineSerializableSubtypes(umlClass, indent);
}

function applyTypeInfoAnnotation(umlClass, indent) {
    const doubleIndent = indent + indent;
    const propertyName = jacksonProfile.get("typeInfoPropertyName", umlClass);
    const typeInfoAnnotation = `@JsonTypeInfo(
${doubleIndent}use = JsonTypeInfo.Id.NAME,
${doubleIndent}property = "${propertyName}"
)`;
    umlClass.annotate(typeInfoAnnotation);
}

function defineSerializableSubtypes(umlClass, indent) {
    const doubleIndent = indent + indent;
    const serializableSubtypes = enumerateClassHierarchy(umlClass)
        .filter(cls => jacksonProfile.isTypeInfoPropertyValueHolder(cls))
        .map(cls => `@JsonSubTypes.Type(value = ${cls.name}.class, name = "${getTypeInfoPropertyValue(cls)}")`)
        .join(`,\n${doubleIndent}`);
    const jsonSubTypes = `@JsonSubTypes({
${doubleIndent}${serializableSubtypes}
})`;

    umlClass.annotate(jsonSubTypes);
}

function getTypeInfoPropertyValue(umlClass) {
    const typeInfoPropertyValue = jacksonProfile.get("typeInfoPropertyValue", umlClass);
    return typeInfoPropertyValue? 
        typeInfoPropertyValue : 
        umlClass.name.toLowerCamelCase();
}


const getAttributeAnnotation = (isSerializable, propertyName) => {
    return isSerializable? 
        (propertyName? `@JsonProperty("${propertyName}")` : "") :
        "@JsonIgnore";
};

exports.JacksonAnnotationBuilder = JacksonAnnotationBuilder;
