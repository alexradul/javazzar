/* global define */

let CodeBuilder = require("../core/generator").CodeBuilder;
const JavaProfiles = require("./JavaProfiles");
const persistenceProfile = new JavaProfiles.PersistenceProfile();

/**
 * State pattern introduced for easier processing of persistent model elements. 
 */
class JPAAnnotationProcessor {
    processClass(/* builder, umlClass */) { }
    processAttribute(/* builder, umlAttribute */) { }
    processOneToOne(/* builder, umlAssociation, myAssociationEnd, otherAssociationEnd */) { }
    processOneToMany(/* builder, umlAssociation, myAssociationEnd, otherAssociationEnd */) { }
    processManyToOne(/* builder, umlAssociation, myAssociationEnd, otherAssociationEnd */) { }
    processManyToMany(/* builder, umlAssociation, myAssociationEnd, otherAssociationEnd */) { }
    processOneToOneDirected(/* builder, umlAssociation, myAssociationEnd, otherAssociationEnd */) { }
    processManyToOneDirected(/* builder, umlAssociation, myAssociationEnd, otherAssociationEnd */) { }
    processOneToManyDirected(/* builder, umlAssociation, myAssociationEnd, otherAssociationEnd */) { }
    processManyToManyDirected(/* builder, umlAssociation, myAssociationEnd, otherAssociationEnd */) { }
}

class PersistentClassProcessor extends JPAAnnotationProcessor {
    processClass(builder, umlClass) {
        builder.processPersistentClass(umlClass);
    }
    processAttribute(builder, umlAttribute) {
        builder.processPersistentAttribute(umlAttribute);
    }
    processOneToOne(builder, umlAssociation, myAssociationEnd, otherAssociationEnd) {
        if (persistenceProfile.is("persistent", myAssociationEnd.reference)) {
            builder.processOneToOne(umlAssociation, myAssociationEnd, otherAssociationEnd);
        }
    }
    processOneToMany(builder, umlAssociation, myAssociationEnd, otherAssociationEnd) {
        if (persistenceProfile.is("persistent", myAssociationEnd.reference)) {
            builder.processOneToMany(umlAssociation, myAssociationEnd, otherAssociationEnd);
        }
    }
    processManyToOne(builder, umlAssociation, myAssociationEnd, otherAssociationEnd) {
        if (persistenceProfile.is("persistent", myAssociationEnd.reference)) {
            builder.processManyToOne(umlAssociation, myAssociationEnd, otherAssociationEnd);
        }
    }
    processManyToMany(builder, umlAssociation, myAssociationEnd, otherAssociationEnd) {
        if (persistenceProfile.is("persistent", myAssociationEnd.reference)) {
            builder.processManyToMany(umlAssociation, myAssociationEnd, otherAssociationEnd);
        }
    }
    processOneToOneDirected(builder, umlAssociation, myAssociationEnd, otherAssociationEnd) {
        if (persistenceProfile.is("persistent", myAssociationEnd.reference)) {
            builder.processOneToOneDirected(umlAssociation, myAssociationEnd, otherAssociationEnd);
        }
    }
    processManyToOneDirected(builder, umlAssociation, myAssociationEnd, otherAssociationEnd) {
        if (persistenceProfile.is("persistent", myAssociationEnd.reference)) {
            builder.processManyToOneDirected(umlAssociation, myAssociationEnd, otherAssociationEnd);
        }
    }
    processOneToManyDirected(builder, umlAssociation, myAssociationEnd, otherAssociationEnd) {
        if (persistenceProfile.is("persistent", myAssociationEnd.reference)) {
            builder.processOneToManyDirected(umlAssociation, myAssociationEnd, otherAssociationEnd);
        }
    }
    processManyToManyDirected(builder, umlAssociation, myAssociationEnd, otherAssociationEnd) {
        if (persistenceProfile.is("persistent", myAssociationEnd.reference)) {
            builder.processManyToManyDirected(umlAssociation, myAssociationEnd, otherAssociationEnd);
        }
    }
}

class ValueTypeProcessor extends PersistentClassProcessor {
    processClass(builder, umlClass) {
        builder.processValueType(umlClass);
    }
}

class TransientProcessor extends JPAAnnotationProcessor {

}

const inheritanceMapping = {
    Joined(builder, umlClass) {
        builder.applyPersistenceAnnotations(umlClass, "@Inheritance(strategy = InheritanceType.JOINED)");
    },
    SingleTable(builder, umlClass) {
        builder.applyPersistenceAnnotations(umlClass, "@Inheritance(strategy = InheritanceType.SINGLE_TABLE)");
    },
    TablePerClass(builder, umlClass) {
        builder.applyPersistenceAnnotations(umlClass, "@Inheritance(strategy = InheritanceType.TABLE_PER_CLASS)");
    }
};

const temporalAnnotations = {
    date(builder, umlAttribute) {
        builder.applyPersistenceAnnotations(umlAttribute, "@Temporal(TemporalType.DATE)");
    },
    time(builder, umlAttribute) {
        builder.applyPersistenceAnnotations(umlAttribute, "@Temporal(TemporalType.TIME)");
    },
    dateTime(builder, umlAttribute) {
        builder.applyPersistenceAnnotations(umlAttribute, "@Temporal(TemporalType.TIMESTAMP)");
    }
};

class AttributeProcessor {
    process(/* builder, attribute */) { }
}

class BasicSingleAttributeProcessor extends AttributeProcessor {
    process(builder, attribute) {
        if (persistenceProfile.is("transient", attribute)) {
            builder.applyPersistenceAnnotations(attribute, "@Transient");
        } else {
            if (attribute.isEnumType()) {
                const enumType = builder.useStringEnumTypes ? "EnumType.STRING" : "EnumType.ORDINAL";
                builder.applyPersistenceAnnotations(attribute, `@Enumerated(${enumType})`);
            } else if (attribute.isTemporalType() && builder.useTemporalAnnotation) {
                temporalAnnotations[attribute.type](builder, attribute);
            }

            if (persistenceProfile.is("lob", attribute)) {
                builder.applyPersistenceAnnotations(attribute, "@Lob");
            }
            if (builder.useNotNullAnnotation && !attribute.isNullable() && attribute.isNullableType()) {
                builder.applyPersistenceAnnotations(attribute, "@NotNull");
            }
            builder.applyColumnAnnotation(attribute);
        }
    }
}

class BasicMultiAttributeProcessor extends AttributeProcessor {
    process(builder, attribute) {
        if (persistenceProfile.is("transient", attribute)) {
            builder.applyPersistenceAnnotations(attribute, "@Transient");
        } else {
            builder.applyPersistenceAnnotations(attribute, "@ElementCollection");
        }
    }
}

class EmbeddedSingleAttributeProcessor extends AttributeProcessor {
    process(builder, attribute) {
        const indent = builder.indent;
        const doubleIndent = indent + indent;
        if (persistenceProfile.is("transient", attribute)) {
            builder.applyPersistenceAnnotations(attribute, "@Transient");
        } else {
            let attributeOverrides = [];
            builder.applyPersistenceAnnotations(attribute, "@Embedded");
            attributeOverrides = buildAttributeOverrides(attribute.type, attribute.name);
            attributeOverrides = attributeOverrides.map((attribute) => {
                return `@AttributeOverride(name="${attribute.name}", column = @Column(name = "${attribute.column.name}"))`;
            });
            if (attributeOverrides.length) {
                builder.applyPersistenceAnnotations(attribute, `@AttributeOverrides({\n${doubleIndent}${attributeOverrides.join(`,\n${doubleIndent}`)}\n${indent}})`);
            }
        }
    }
}

class EmbeddedMultiAttributeProcessor extends AttributeProcessor {
    process(builder, attribute) {
        if (persistenceProfile.is("transient", attribute)) {
            builder.applyPersistenceAnnotations(attribute, "@Transient");
        } else {
            builder.applyPersistenceAnnotations(attribute, "@ElementCollection");
        }
    }
}

const basicSingleProcessor = new BasicSingleAttributeProcessor(),
    basicMultiProcessor = new BasicMultiAttributeProcessor(),
    embeddedSingleProcessor = new EmbeddedSingleAttributeProcessor(),
    embeddedMultiProcessor = new EmbeddedMultiAttributeProcessor();

class AssociationProcessor {
    processOneToOne() { }
    processOneToOneDirected() { }
    processOneToManyDirected() {}
}

class TransientAssociationProcessor extends AssociationProcessor {
    processOneToOne(builder, umlAssociation, myAssociationEnd) {
        builder.applyPersistenceAnnotations(myAssociationEnd, "@Transient");
    }

    processOneToOneDirected(builder, umlAssociation, myAssociationEnd) {
        builder.applyPersistenceAnnotations(myAssociationEnd, "@Transient");
    }

    processOneToManyDirected(builder, umlAssociation, myAssociationEnd, otherAssociationEnd) {
        builder.applyPersistenceAnnotations(myAssociationEnd, "@Transient");
    }
}

class ValueTypeAssociationProcessor extends AssociationProcessor {
    processOneToOne(builder, umlAssociation, myAssociationEnd) {
        throw ("Bidirectional association with valuetypes not supported: " + myAssociationEnd.name);
    }

    processOneToOneDirected(builder, umlAssociation, myAssociationEnd) {
        const indent = builder.indent;
        const doubleIndent = indent + indent;
        let attributeOverrides = [];
        builder.applyPersistenceAnnotations(myAssociationEnd, "@Embedded");
        attributeOverrides = buildAttributeOverrides(myAssociationEnd.reference, myAssociationEnd.name);
        attributeOverrides = attributeOverrides.map((attribute) => {
            return `@AttributeOverride(name="${attribute.name}", column = @Column(name = "${attribute.column.name}"))`;
        });
        if (attributeOverrides.length) {
            builder.applyPersistenceAnnotations(myAssociationEnd, `@AttributeOverrides({\n${doubleIndent}${attributeOverrides.join(`,\n${doubleIndent}`)}\n${indent}})`);
        }
    }

    processOneToManyDirected(builder, umlAssociation, myAssociationEnd, otherAssociationEnd) {
        builder.applyPersistenceAnnotations(myAssociationEnd, 
            getAssociationQualifier("@ElementCollection", myAssociationEnd), 
            `@CollectionTable(name = "${myAssociationEnd.name}", joinColumns = @JoinColumn(name = "${otherAssociationEnd.name}_id"))`);
    }
}

class EntityAssociationProcessor extends AssociationProcessor {
    processOneToOne(builder, umlAssociation, myAssociationEnd, otherAssociationEnd) {
        if (builder.useNotNullAnnotation && !myAssociationEnd.isNullable()) {
            builder.applyPersistenceAnnotations(myAssociationEnd, "@NotNull");
        }
        if (builder.isOwningSide(myAssociationEnd, otherAssociationEnd)) {
            builder.applyPersistenceAnnotations(myAssociationEnd, getAssociationQualifier("@OneToOne", myAssociationEnd), `@JoinColumn(name = "${myAssociationEnd.name}_id")`);
        } else {
            builder.applyPersistenceAnnotations(myAssociationEnd, getAssociationQualifier("@OneToOne", myAssociationEnd, { mappedBy: `"${otherAssociationEnd.name}"` }));
        }
    }

    processOneToOneDirected(builder, umlAssociation, myAssociationEnd) {
        if (builder.useNotNullAnnotation && !myAssociationEnd.isNullable()) {
            builder.applyPersistenceAnnotations(myAssociationEnd, "@NotNull");
        }
        builder.applyPersistenceAnnotations(myAssociationEnd, getAssociationQualifier("@OneToOne", myAssociationEnd), `@JoinColumn(name = "${myAssociationEnd.name}_id")`);
    }

    processOneToManyDirected(builder, umlAssociation, myAssociationEnd, otherAssociationEnd) {
        builder.applyPersistenceAnnotations(myAssociationEnd, 
            getAssociationQualifier("@OneToMany", myAssociationEnd), 
            `@JoinColumn(name = "${otherAssociationEnd.name}_id")`);
    }
}

const entityAssociationProcessor = new EntityAssociationProcessor(),
    valueTypeAssociationProcessor = new ValueTypeAssociationProcessor(),
    transientAssociationProcessor = new TransientAssociationProcessor();

const getAssociationProcessor = (associationEnd) => {
    if (persistenceProfile.is("transient", associationEnd)) {
        return transientAssociationProcessor;
    } else if (associationEnd.reference.isValueType()) {
        return valueTypeAssociationProcessor;
    } else {
        return entityAssociationProcessor;
    }
};


function getAttributeProcessor(umlAttribute) {
    if (umlAttribute.isValueType()) {
        if (umlAttribute.isMultiValued()) {
            return embeddedMultiProcessor;
        } else {
            return embeddedSingleProcessor;
        }
    } else {
        if (umlAttribute.isMultiValued()) {
            return basicMultiProcessor;
        } else {
            return basicSingleProcessor;
        }
    }
}

function createAnnotation(name, attributes) {
    let annotation = name;
    let attrs = [];
    for (const property in attributes) {
        attrs.push(`${property} = ${attributes[property]}`);
    }
    if (attrs.length) {
        annotation = `${name}(${attrs.join(", ")})`;
    }
    return annotation;
}

const fetchTypeProcessors = {
    "default": () => {
        return {};
    },
    "lazy": () => {
        return { fetch: "FetchType.LAZY" };
    },
    "eager": () => {
        return { fetch: "FetchType.EAGER" };
    }
};


const getAssociationQualifier = (associationKind, associationEnd, additionalAttributes) => {
    const fetchType = persistenceProfile.get("fetchType", associationEnd);
    const fetchTypeAttributes = fetchTypeProcessors[fetchType]();
    const attributes = (additionalAttributes) ? Object.assign(additionalAttributes, fetchTypeAttributes) : fetchTypeAttributes;
    return createAnnotation(associationKind, attributes);
};


const entityProcessor = new PersistentClassProcessor(),
    valueTypeProcessor = new ValueTypeProcessor(),
    transientProcessor = new TransientProcessor();

class JPAAnnotationBuilder extends CodeBuilder {
    constructor(options) {
        super();
        this.options = options;
        this.processor = transientProcessor;
        this.useStringEnumTypes = options.useStringEnumTypes;
        this.useTemporalAnnotation = options.useTemporalAnnotation;
        this.useNotNullAnnotation = options.useNotNullAnnotation;
        this.isGenerateSerializable = options.isGenerateSerializable;
        this.indent = options.getIndentString();
    }
    buildModule() {
        // package processing is of no importance for JPA annotation builder
    }
    buildClass(umlClass) {
        if (persistenceProfile.is("persistent", umlClass)) {
            this.processor = umlClass.isValueType() ? valueTypeProcessor : entityProcessor;
        } else {
            this.processor = transientProcessor;
        }

        this.processor.processClass(this, umlClass);
    }
    buildEnum(/* umlEnumeration */) {
        this.processor = transientProcessor;
    }
    buildInterface(/* umlInterface */) {
        this.processor = transientProcessor;
    }
    buildAttribute(umlAttribute) {
        this.processor.processAttribute(this, umlAttribute);
    }

    buildOneToOne(umlAssociation, myAssociationEnd, otherAssociationEnd) {
        this.processor.processOneToOne(this, umlAssociation, myAssociationEnd, otherAssociationEnd);
    }
    buildOneToMany(umlAssociation, myAssociationEnd, otherAssociationEnd) {
        this.processor.processOneToMany(this, umlAssociation, myAssociationEnd, otherAssociationEnd);
    }
    buildManyToOne(umlAssociation, myAssociationEnd, otherAssociationEnd) {
        this.processor.processManyToOne(this, umlAssociation, myAssociationEnd, otherAssociationEnd);
    }
    buildManyToMany(umlAssociation, myAssociationEnd, otherAssociationEnd) {
        this.processor.processManyToMany(this, umlAssociation, myAssociationEnd, otherAssociationEnd);
    }
    buildOneToOneDirected(umlAssociation, myAssociationEnd, otherAssociationEnd) {
        this.processor.processOneToOneDirected(this, umlAssociation, myAssociationEnd, otherAssociationEnd);
    }
    buildManyToOneDirected(umlAssociation, myAssociationEnd, otherAssociationEnd) {
        this.processor.processManyToOneDirected(this, umlAssociation, myAssociationEnd, otherAssociationEnd);
    }
    buildOneToManyDirected(umlAssociation, myAssociationEnd, otherAssociationEnd) {
        this.processor.processOneToManyDirected(this, umlAssociation, myAssociationEnd, otherAssociationEnd);
    }
    buildManyToManyDirected(umlAssociation, myAssociationEnd, otherAssociationEnd) {
        this.processor.processManyToManyDirected(this, umlAssociation, myAssociationEnd, otherAssociationEnd);
    }

    processPersistentClass(umlClass) {
        const tableName = persistenceProfile.get("tableName", umlClass);
        this.applyPersistenceAnnotations(umlClass, "@Entity");
        if (tableName) {
            this.applyPersistenceAnnotations(umlClass, createAnnotation("@Table", { name: `"${tableName}"` }));
        }
        if (this.isGenerateSerializable) {
            umlClass.interfaces.push("Serializable");
        }
        if (umlClass.isRoot() && umlClass.hasSubclasses()) {
            this.applyInheritanceMapping(umlClass);
        }
    }
    processValueType(umlClass) {
        this.applyPersistenceAnnotations(umlClass, "@Embeddable");
        if (this.isGenerateSerializable) {
            umlClass.interfaces.push("Serializable");
        }
    }
    processPersistentAttribute(umlAttribute) {
        const attributeProcessor = getAttributeProcessor(umlAttribute);
        attributeProcessor.process(this, umlAttribute);
    }
    processOneToOne(umlAssociation, myAssociationEnd, otherAssociationEnd) {
        const processor = getAssociationProcessor(myAssociationEnd);
        processor.processOneToOne(this, umlAssociation, myAssociationEnd, otherAssociationEnd);
    }
    processOneToMany(umlAssociation, myAssociationEnd, otherAssociationEnd) {
        this.applyPersistenceAnnotations(myAssociationEnd, getAssociationQualifier("@OneToMany", myAssociationEnd, { mappedBy: `"${otherAssociationEnd.name}"` }));
    }
    processManyToOne(umlAssociation, myAssociationEnd) {
        if (this.useNotNullAnnotation && !myAssociationEnd.isNullable()) {
            this.applyPersistenceAnnotations(myAssociationEnd, "@NotNull");
        }
        this.applyPersistenceAnnotations(myAssociationEnd, getAssociationQualifier("@ManyToOne", myAssociationEnd), `@JoinColumn(name = "${myAssociationEnd.name}_id")`);
    }
    processManyToMany(umlAssociation, myAssociationEnd, otherAssociationEnd) {
        const selfReference = umlAssociation.isSelfAssociated()? 
            otherAssociationEnd.name :
            otherAssociationEnd.reference.name.toLowerCamelCase();
        
        const inverseReference = umlAssociation.isSelfAssociated()? 
            myAssociationEnd.name :
            myAssociationEnd.reference.name.toLowerCamelCase();

        if (this.isOwningSide(myAssociationEnd, otherAssociationEnd)) {
            this.applyPersistenceAnnotations(myAssociationEnd, 
                getAssociationQualifier("@ManyToMany", myAssociationEnd), 
                    `@JoinTable(name = "${umlAssociation.name}", joinColumns = {@JoinColumn(name = "${selfReference}_id")}, inverseJoinColumns = {@JoinColumn(name = "${inverseReference}_id")})`);
        } else {
            this.applyPersistenceAnnotations(myAssociationEnd, getAssociationQualifier("@ManyToMany", myAssociationEnd, { mappedBy: `"${otherAssociationEnd.name}"` }));
        }
    }
    processOneToOneDirected(umlAssociation, myAssociationEnd) {
        const processor = getAssociationProcessor(myAssociationEnd);
        processor.processOneToOneDirected(this, umlAssociation, myAssociationEnd);
    }
    processManyToOneDirected(umlAssociation, myAssociationEnd) {
        return this.processManyToOne(umlAssociation, myAssociationEnd);
    }
    processOneToManyDirected(umlAssociation, myAssociationEnd, otherAssociationEnd) {
        const processor = getAssociationProcessor(myAssociationEnd);
        processor.processOneToManyDirected(this, umlAssociation, myAssociationEnd, otherAssociationEnd);
    }
    processManyToManyDirected(umlAssociation, myAssociationEnd, otherAssociationEnd) {
        const selfReference = umlAssociation.isSelfAssociated()? 
            otherAssociationEnd.name :
            otherAssociationEnd.reference.name.toLowerCamelCase();
        
        const inverseReference = umlAssociation.isSelfAssociated()? 
            myAssociationEnd.name :
            myAssociationEnd.reference.name.toLowerCamelCase();
            
        this.applyPersistenceAnnotations(myAssociationEnd, getAssociationQualifier("@ManyToMany", myAssociationEnd), `@JoinTable(name = "${umlAssociation.name}", joinColumns = {@JoinColumn(name = "${selfReference}_id")}, inverseJoinColumns = {@JoinColumn(name = "${inverseReference}_id")})`);
    }

    applyColumnAnnotation(attribute) {
        let name = persistenceProfile.get("columnName", attribute);
        let length = persistenceProfile.get("columnLength", attribute);
        let insertable = persistenceProfile.is("insertable", attribute); // default value is true and should be ignored
        let updatable = persistenceProfile.is("updatable", attribute); // same as insertable
        let unique = persistenceProfile.is("unique", attribute);

        let attributes = {};

        if (name) {
            attributes.name = `"${name}"`;
        }
        if (unique) {
            attributes.unique = true;
        }
        if (!attribute.isNullable()) {
            attributes.nullable = false;
        }
        if (length) {
            attributes.length = length;
        }
        if (!insertable) {
            attributes.insertable = false;
        }
        if (!updatable) {
            attributes.updatable = false;
        }
        this.applyPersistenceAnnotations(attribute, createAnnotation("@Column", attributes));
    }

    applyPersistenceAnnotations(modelElement, ...annotations) {
        annotations.forEach(annotation => {
            modelElement.annotate(annotation);
        });
    }
    applyInheritanceMapping(umlClass) {
        const strategy = persistenceProfile.get("inheritanceStrategy", umlClass);
        inheritanceMapping[strategy](this, umlClass);
    }

    isOwningSide(myAssociationEnd, otherAssociationEnd) {
        return myAssociationEnd.name < otherAssociationEnd.name;
    }
}

function buildAttributeOverrides(valueTypeClass, relationName) {
    let attributeOverrides = [];
    let overrides = valueTypeClass.attributes
        .filter((attribute) => attribute.isBasicType())
        .map((attribute) => {
            let attributeOverride = {};
            attributeOverride.name = attribute.name;
            attributeOverride.column = {};
            attributeOverride.column.name = `${relationName}_${attribute.name}`;
            return attributeOverride;
        });
    attributeOverrides = attributeOverrides.concat(overrides);
    return attributeOverrides;
}

exports.JPAAnnotationBuilder = JPAAnnotationBuilder;
exports.createAnnotation = createAnnotation;