/**
* JPACodeAppender is responsible for creating parts of the code needed to make elements of the model persistent. 
* In particular, it will add equals() method to all persistent classes. 
* Additionally, it will add jakarta.persistence.* import to all persistent classes.
* Also, where appropriate, it will add attributes @Id and @Version. 
* Uses Persistence profile. 
*/
/* global */

const createAnnotation = require("./JPAAnnotationBuilder").createAnnotation;
let CodeBuilder = require("../core/generator").CodeBuilder;
let Fragments = require("../core/fragments");
let CodeTemplates = require("../CodeTemplates").Java;

const PersistenceProfile = require("./JavaProfiles").PersistenceProfile;

const persistenceProfile = new PersistenceProfile();

let fragmentFactory = new Fragments.CodeFragmentFactory(),
    CodeFragmentType = Fragments.CodeFragmentType,
    FragmentKind = Fragments.FragmentKind;

const literalString = (str) => str ? `"${str}"` : "";

const startsWithLowerCase = (str) => {
    const firstCharacter = str.charAt(0);
    return firstCharacter === firstCharacter.toLowerCase();
};

const isPrimitiveValue = (str) => {
    return startsWithLowerCase(str);
};

const equalsOperator = (umlClass) => {
    return `(getId().equals(((${umlClass.name}) obj).getId()))`;
};

const equalityOperator = (umlClass) => {
    return `(getId() == ((${umlClass.name}) obj).getId())`;
};

const idGenerationStrategy = {
    Auto: {
        value: () => "GenerationType.AUTO",
        generator: () => ""
    },
    Sequence: {
        value: () => "GenerationType.SEQUENCE",
        generator: literalString
    },
    Table: {
        value: () => "GenerationType.TABLE",
        generator: literalString
    },
    Identity: {
        value: () => "GenerationType.IDENTITY",
        generator: literalString
    }
};

class PersistentClassProcessor {
    process(/* builder, umlClass */) { }
}

class EntityProcessor extends PersistentClassProcessor {
    process(builder, umlClass) {
        builder.processEntity(umlClass);
    }
}

class ValuetypeProcessor extends PersistentClassProcessor {
    process(builder, umlClass) {
        builder.processValuetype(umlClass);
    }
}

const entityProcessor = new EntityProcessor(), valuetypeProcessor = new ValuetypeProcessor();

class JPACodeAppender extends CodeBuilder {
    constructor(options) {
        super();
        this.indent = options.getIndentString();
        this.idAttributeType = options.idAttributeType;
        this.useNotNullAnnotation = options.useNotNullAnnotation;
        this.generateEquals = options.generateEquals;
        this.isGenerateSerializable = options.isGenerateSerializable;
    }
    buildClass(umlClass) {
        if (persistenceProfile.is("persistent", umlClass)) {
            const processor = umlClass.isValueType() ? valuetypeProcessor : entityProcessor;
            processor.process(this, umlClass);
        }
    }
    processEntity(umlClass) {
        const classCodeFragment = umlClass.codeFragment;
        this.addPersistenceDependencies(classCodeFragment);
        if (this.generateEquals) {
            this.addHashCode(classCodeFragment, umlClass);
            this.addEquals(classCodeFragment, umlClass);
        }
        if (umlClass.isRoot()) {
            this.addPersistentAttributes(classCodeFragment, umlClass);
        }
    }
    processValuetype(umlClass) {
        const classCodeFragment = umlClass.codeFragment;
        this.addPersistenceDependencies(classCodeFragment);
    }
    addPersistenceDependencies(classCodeFragment) {
        classCodeFragment.addStandardImport("import jakarta.persistence.*;");
        if (this.useNotNullAnnotation) {
            classCodeFragment.addStandardImport("import jakarta.validation.constraints.*;");
        }
        if (this.isGenerateSerializable) {
            classCodeFragment.addStandardImport("import java.io.Serializable;");
        }
    }
    addPersistentAttributes(classCodeFragment, umlClass) {
        const strategyProcessor = idGenerationStrategy[persistenceProfile.get("idGeneratorType", umlClass)];
        const strategy = strategyProcessor.value();
        const generator = strategyProcessor.generator(persistenceProfile.get("generatorName", umlClass));
        const useOptimisticLocking = persistenceProfile.get("useOptimisticLocking", umlClass);
        const persistentAttributes = [];

        const idGenerationAttributes = {};

        idGenerationAttributes["strategy"] = strategy;
        if (generator) {
            idGenerationAttributes["generator"] = generator;
        }

        if (useOptimisticLocking) {
            persistentAttributes.push(
                this.createAttributeFragment(umlClass, "version", this.idAttributeType, CodeTemplates.versionAttribute)
                    .annotate("@Version"));
        }

        persistentAttributes.push(
            this.createAttributeFragment(umlClass, "id", this.idAttributeType, CodeTemplates.idAttribute)
                .annotate("@Id")
                .annotate(createAnnotation("@GeneratedValue", idGenerationAttributes)));
        persistentAttributes.push(this.createGetterId(umlClass));

        persistentAttributes.forEach(attribute => classCodeFragment.unshift(attribute));
    }
    addEquals(classCodeFragment, umlClass) {
        const comparisonOperator = isPrimitiveValue(this.idAttributeType) ? equalityOperator : equalsOperator;
        const emptyId = isPrimitiveValue(this.idAttributeType) ? "0" : "null";
        const equalsFragment = fragmentFactory
            .createFragment(FragmentKind.simple, "equals", CodeFragmentType.supportingMethod)
            .createPreserveBefore(`equals.annotations@${umlClass._id}`)
            .assign(CodeTemplates.idBasedEqualsMethod(umlClass, this.indent, comparisonOperator, emptyId));
        classCodeFragment.unshift(equalsFragment);
    }

    addHashCode(classCodeFragment, umlClass) {
        const hashCodeFragment = fragmentFactory
            .createFragment(FragmentKind.simple, "hashCode", CodeFragmentType.supportingMethod)
            .createPreserveBefore(`hashCode.annotations@${umlClass._id}`)
            .assign(CodeTemplates.idBasedHashCodeMethod(umlClass, this.indent));
        classCodeFragment.unshift(hashCodeFragment);
    }
    createAttributeFragment(umlClass, attributeName, attributeType, codeCreationFn) {
        return fragmentFactory
            .createFragment(FragmentKind.simple, attributeName, CodeFragmentType.field)
            .createPreserveBefore(`${attributeName}.annotations@${umlClass._id}`)
            .assign(codeCreationFn(umlClass, attributeType));
    }
    createGetterId(umlClass) {
        return fragmentFactory
            .createFragment(FragmentKind.simple, "getId", CodeFragmentType.fieldGetter)
            .createPreserveBefore(`getId.annotations@${umlClass._id}`)
            .assign(CodeTemplates.idAttributeGetter(this.idAttributeType, this.indent));
    }

}

exports.JPACodeAppender = JPACodeAppender;