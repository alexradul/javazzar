/* global type*/
/**
 * Contains elements of business logic related to assembling of Java source code.
 * This part has been separated from the other parts of the process in order to improve distribution of responsibilities. Assembling should be the last stage of model processing.
 */

let CodeBuilder = require("../core/generator").CodeBuilder;

let Fragments = require("../core/fragments");
let CodeTemplates = require("../CodeTemplates").Java;

const JavaProfiles = require("./JavaProfiles");

const JavaCodeBuilder = require("./JavaCodeBuilder");
const Preferences = require("../preferences");

const typeMapping = Preferences.getGenOptions().typeMapping;

const lombokImports = [
    "import lombok.Getter;",
    "import lombok.NoArgsConstructor;",
    "import lombok.Setter;"
];

const DependencyResolver = require("../core/generator").DependencyResolver;
const dependencyResolver = new DependencyResolver();

const getAccessLevel = JavaCodeBuilder.getAccessLevel;
const getModifiers = JavaCodeBuilder.getModifiers;

const javaProfile = new JavaProfiles.JavaProfile();

const newLine = "\n",
    endOfLine = ";";

let attributeCount = 0;

let fragmentFactory = new Fragments.CodeFragmentFactory(),
    CodeFragmentType = Fragments.CodeFragmentType,
    FragmentKind = Fragments.FragmentKind;

const getOrderedCollection = (elementType) => {
    const orderedCollection = Preferences.getGenOptions().orderedCollection;
    return `${orderedCollection}<${elementType}>`;
};

const getUnorderedCollection = (elementType) => {
    const unorderedCollection = Preferences.getGenOptions().unorderedCollection;
    return `${unorderedCollection}<${elementType}>`;
};

const getParameterType = (umlParam) => {
    let parameterType = "void";
    if (umlParam && umlParam.type) {
        if (umlParam.type instanceof type.UMLClassifier) {
            dependencyResolver.resolve(umlParam.type);
            parameterType = umlParam.type.name;
        } else {
            parameterType = typeMapping.map(umlParam.type);
        }
        if (!umlParam.isZeroOrOneMultiplicity()) {
            parameterType = umlParam.isOrdered ? getOrderedCollection(parameterType) : getUnorderedCollection(parameterType);
        }
    }
    return parameterType;
};

class MethodAutoGeneration {
    static getInstance(umlClassifier) {
        return umlClassifier.isAbstract ?
            new NoAutogeneration() :
            new AbstractMethodAutoGeneration();
    }

    // eslint-disable-next-line no-unused-vars
    process(assembler, umlClassifier) { }
}

class NoAutogeneration extends MethodAutoGeneration {
    // eslint-disable-next-line no-unused-vars
    process(assembler, umlClassifier) { }
}

class AbstractMethodAutoGeneration extends MethodAutoGeneration {
    process(assembler, umlClassifier) {
        umlClassifier
            .getRealizedInterfaces()
            .forEach(_interface => {
                _interface.getMethods().forEach(operation => {
                    const overridenMethod = umlClassifier.getOverridenMethod(operation);
                    if (overridenMethod) {
                        overridenMethod.isOverriden = true;
                    } else {
                        assembler.implementMethod(operation, assembler.classifier);
                    }
                });
            });
        umlClassifier
            .getAbstractSuperClasses()
            .forEach(abstractSuperClass => {
                abstractSuperClass.getAbstractMethods().forEach(operation => {
                    const overridenMethod = umlClassifier.getOverridenMethod(operation);
                    if (overridenMethod) {
                        overridenMethod.isOverriden = true;
                    } else {
                        assembler.implementMethod(operation, assembler.classifier);
                    }
                });
            });
    }
}


class AssemblerState {
    buildClassifier() { }
    buildAttribute() { }
    buildMethod() { }
    leaveClassifier() { }
}

class ClassAssemblerState extends AssemblerState {
    buildClassifier(assembler, umlClassifier) {
        assembler.assembleClass(umlClassifier);
        MethodAutoGeneration
            .getInstance(umlClassifier)
            .process(assembler, umlClassifier);
    }
    buildAttribute(assembler, umlAttribute) {
        assembler.assembleAttribute(umlAttribute);
    }
    buildMethod(assembler, umlOperation) {
        assembler.assembleMethod(umlOperation, true);
    }
    leaveClassifier(assembler, umlClassifier) {
        assembler.resolveImports(umlClassifier);
    }
}

class EnumAssemblerState extends AssemblerState {
    buildClassifier(assembler, umlClassifier) {
        assembler.assembleClass(umlClassifier);
    }
    buildAttribute(assembler, umlAttribute) {
        umlAttribute.modifiers = umlAttribute.modifiers ? `final ${umlAttribute.modifiers}` : "final";
        assembler.assembleAttribute(umlAttribute, true);
    }
    buildMethod(assembler, umlOperation) {
        assembler.assembleMethod(umlOperation, true);
    }
    leaveClassifier(assembler, umlClassifier) {
        assembler.resolveImports(umlClassifier);
        if (attributeCount) {
            // add literals preserve section
            assembler.addEnumLiteralsPreserveSection(umlClassifier);
        } else {
            // add literals
            assembler.addEnumLiterals(umlClassifier);
        }
    }
}

class InterfaceAssemblerState extends AssemblerState {
    buildClassifier(assembler, umlClassifier) {
        assembler.assembleClass(umlClassifier);
    }
    buildAttribute(assembler, umlAttribute) {
        if (!umlAttribute.isStatic && !umlAttribute.isFinalSpecialization) {
            throw `Error while processing ${assembler.classifier.name}: non-static, non-final attributes cannot be part of an interface.`;
        }
        assembler.assembleAttribute(umlAttribute);
    }
    buildMethod(assembler, umlOperation) {
        assembler.assembleMethod(umlOperation, false);
    }
    leaveClassifier(assembler, umlClassifier) {
        assembler.resolveImports(umlClassifier);
    }
}

const interfaceAssembler = new InterfaceAssemblerState(),
    enumAssembler = new EnumAssemblerState(),
    classAssembler = new ClassAssemblerState();

function getReturnType(umlOperation) {
    let returnParam = umlOperation.getReturnParameter(),
        returnType = "";
    if (returnParam) {
        const annotations = returnParam.annotations ? returnParam.annotations.join("") : "";
        returnType = `${annotations}${getParameterType(returnParam)}`;
        // if name of operation equals class name, it is a constructor - no return param
    } else if (umlOperation.name === umlOperation._parent.name) {
        returnType = "";
    } else {
        returnType = "void";
    }
    return returnType;
}

const setupModule = (umlPackage) => {
    let packageModule = umlPackage.codeFragment;

    if (!packageModule) {
        packageModule = fragmentFactory
            .createFragment(FragmentKind.module, umlPackage.name)
            .link(umlPackage);
    }
    return packageModule;
};

class AssociationHandler {
    // eslint-disable-next-line no-unused-vars
    match(myAssociationEnd, otherAssociationEnd, assembler) { }
    // eslint-disable-next-line no-unused-vars
    consume(linkUnlinkGeneratorFn) { }
}

class ReadOnlyAssociationHandler extends AssociationHandler {
    match(myAssociationEnd, otherAssociationEnd, assembler) {
        return this.areAssociationEndsReadOnly(myAssociationEnd, otherAssociationEnd, assembler) ? this : null;
    }
    areAssociationEndsReadOnly(myAssociationEnd, otherAssociationEnd, assembler) {
        return assembler.linkMethodsDisabled() ||
            assembler.isSetterExcluded(myAssociationEnd) ||
            assembler.isSetterExcluded(otherAssociationEnd);
    }
    consume() {
        // do nothing
    }
}

class DefaultAssociationHandler extends AssociationHandler {
    // eslint-disable-next-line no-unused-vars
    match(myAssociationEnd, otherAssociationEnd, assembler) {
        return this;
    }
    consume(linkUnlinkGeneratorFn) {
        linkUnlinkGeneratorFn();
    }
}

class ChainedAssociationHandler extends AssociationHandler {
    constructor(head, tail) {
        super();
        this.head = head;
        this.tail = tail;
    }

    match(myAssociationEnd, otherAssociationEnd, assembler) {
        const match = this.head.match(myAssociationEnd, otherAssociationEnd, assembler);
        return match ? match : this.tail.match(myAssociationEnd, otherAssociationEnd, assembler);
    }
}

const associationProcessors =
    new ChainedAssociationHandler(new ReadOnlyAssociationHandler(), new DefaultAssociationHandler());

const processAssociation = (myAssociationEnd, otherAssociationEnd, assembler, consumerFn) => {
    associationProcessors
        .match(myAssociationEnd, otherAssociationEnd, assembler)
        .consume(consumerFn);
};


class JavaCodeAssembler extends CodeBuilder {
    constructor(options, documentationBuilder) {
        super();
        this.fileComment = options.fileHeaderComment.replaceAll("\\n", "\n");
        this.standardImports = options.standardImports.replaceAll(";", ";\n");
        this.fluentSetters = options.fluentSetters;
        this.fluentLinkMethods = options.fluentLinkMethods;
        this.linkMethodsEnabled = options.linkMethodsEnabled;
        this.useLombok = options.generateAccessors;
        this.generatePackageInfo = options.generatePackageInfo;
        this.indent = options.getIndentString();
        this.documentationProcessorBuilder = documentationBuilder;

        this.module = undefined;
        this.classifier = undefined;
        this.assembler = classAssembler;
    }
    buildModule(umlPackage) {
        // link umlPackage with the module, to make it available to the following builders
        // extract attributes and assign them to the module
        // take suitable code template and use it.
        let parentModule;

        if (umlPackage._parent) {
            parentModule = umlPackage._parent.codeFragment;
        }

        this.documentationProcessor =
            this.documentationProcessorBuilder(umlPackage.getDocumentationFormat());

        this.module = setupModule(umlPackage)
            .setQualifiedName(umlPackage.getQualifiedName());

        if (this.generatePackageInfo) {
            this.module.setPackageInfo(this.createPackageInfo(umlPackage));
        }
        if (parentModule) {
            parentModule.add(this.module);
        }
        dependencyResolver.reset(umlPackage);
    }
    buildClass(umlClass) {
        this.assembler = classAssembler;
        this.documentationProcessor =
            this.documentationProcessorBuilder(umlClass.getDocumentationFormat());
        this.assembler.buildClassifier(this, umlClass);
    }
    buildEnum(umlEnum) {
        this.assembler = enumAssembler;
        this.documentationProcessor =
            this.documentationProcessorBuilder(umlEnum.getDocumentationFormat());
        this.assembler.buildClassifier(this, umlEnum);
    }
    buildInterface(umlInterface) {
        this.assembler = interfaceAssembler;
        this.documentationProcessor =
            this.documentationProcessorBuilder(umlInterface.getDocumentationFormat());
        this.assembler.buildClassifier(this, umlInterface);
    }
    buildAttribute(umlAttribute) {
        this.assembler.buildAttribute(this, umlAttribute);
    }
    buildMethod(umlOperation) {
        this.assembler.buildMethod(this, umlOperation);
    }
    buildOneToOne(umlAssociation, myAssociationEnd, otherAssociationEnd) {
        const classifier = this.assembleAttribute(myAssociationEnd);
        processAssociation(myAssociationEnd, otherAssociationEnd, this, () => {
            classifier
                .add(this.createLinkFragment(myAssociationEnd, otherAssociationEnd, "linkBiAssociation_1_1"))
                .add(this.createUnlinkFragment(myAssociationEnd, otherAssociationEnd, "unlinkBiAssociation_1_1"));
        });
    }
    buildOneToMany(umlAssociation, myAssociationEnd, otherAssociationEnd) {
        const classifier = this.assembleAttribute(myAssociationEnd);
        processAssociation(myAssociationEnd, otherAssociationEnd, this, () => {
            classifier
                .add(this.createLinkFragment(myAssociationEnd, otherAssociationEnd, "linkBiAssociation_1_N"))
                .add(this.createUnlinkFragment(myAssociationEnd, otherAssociationEnd, "unlinkBiAssociation_1_N"))
                .add(this.createUnlinkFragment(myAssociationEnd, otherAssociationEnd, "unlinkBiAssociation_1_N_collection"));
        });
    }
    buildManyToOne(umlAssociation, myAssociationEnd, otherAssociationEnd) {
        const classifier = this.assembleAttribute(myAssociationEnd);
        processAssociation(myAssociationEnd, otherAssociationEnd, this, () => {
            classifier
                .add(this.createLinkFragment(myAssociationEnd, otherAssociationEnd, "linkBiAssociation_N_1"))
                .add(this.createUnlinkFragment(myAssociationEnd, otherAssociationEnd, "unlinkBiAssociation_N_1"));
        });
    }
    buildManyToMany(umlAssociation, myAssociationEnd, otherAssociationEnd) {
        const classifier = this.assembleAttribute(myAssociationEnd);
        processAssociation(myAssociationEnd, otherAssociationEnd, this, () => {
            classifier
                .add(this.createLinkFragment(myAssociationEnd, otherAssociationEnd, "linkBiAssociation_N_N"))
                .add(this.createUnlinkFragment(myAssociationEnd, otherAssociationEnd, "unlinkBiAssociation_N_N"))
                .add(this.createUnlinkFragment(myAssociationEnd, otherAssociationEnd, "unlinkBiAssociation_N_N_collection"));
        });
    }
    buildOneToOneDirected(umlAssociation, myAssociationEnd, otherAssociationEnd) {
        const classifier = this.assembleAttribute(myAssociationEnd);
        processAssociation(myAssociationEnd, otherAssociationEnd, this, () => {
            classifier
                .add(this.createLinkFragment(myAssociationEnd, otherAssociationEnd, "linkUniAssociation_1"))
                .add(this.createUnlinkFragment(myAssociationEnd, otherAssociationEnd, "unlinkUniAssociation_1"));
        });
    }
    buildManyToOneDirected(umlAssociation, myAssociationEnd, otherAssociationEnd) {
        this.buildOneToOneDirected(umlAssociation, myAssociationEnd, otherAssociationEnd);
    }
    buildOneToManyDirected(umlAssociation, myAssociationEnd, otherAssociationEnd) {
        const classifier = this.assembleAttribute(myAssociationEnd);
        processAssociation(myAssociationEnd, otherAssociationEnd, this, () => {
            classifier
                .add(this.createLinkFragment(myAssociationEnd, otherAssociationEnd, "linkUniAssociation_N"))
                .add(this.createUnlinkFragment(myAssociationEnd, otherAssociationEnd, "unlinkUniAssociation_N"))
                .add(this.createUnlinkFragment(myAssociationEnd, otherAssociationEnd, "unlinkUniAssociation_N_collection"));
        });
    }
    buildManyToManyDirected(umlAssociation, myAssociationEnd, otherAssociationEnd) {
        this.buildOneToManyDirected(umlAssociation, myAssociationEnd, otherAssociationEnd);
    }
    leave(umlClassifier) {
        this.assembler.leaveClassifier(this, umlClassifier);
    }
    createClassHeader(umlClass) {
        let classHeader = [];
        let packageDeclaration = CodeTemplates.packageDeclaration(umlClass._parent);
        let headerFragment = fragmentFactory.createFragment(FragmentKind.simple, umlClass.name, CodeFragmentType.other);

        classHeader.push(this.fileComment);
        classHeader.push(packageDeclaration);
        classHeader.push("");
        if (this.useLombok && umlClass instanceof type.UMLClass) {
            classHeader.push(lombokImports.join("\n"));
            classHeader.push("");
        }
        classHeader.push(this.standardImports);


        headerFragment.assign(classHeader.join(newLine));

        return headerFragment;
    }
    createResolvedImports(umlClass) {
        let classImports = umlClass.resolvedImports;
        const additionalImports = dependencyResolver.getResolvedImports();
        dependencyResolver.reset(umlClass._parent);
        if (additionalImports && additionalImports.length) {
            classImports = classImports.concat(additionalImports);
        }

        classImports = Array.from(new Set(classImports)).sort();

        let resolvedImports = classImports.map(resolvedImport => `import ${resolvedImport};`);

        return fragmentFactory.createFragment(FragmentKind.simple, "resolved imports", CodeFragmentType.other)
            .createPreserveAfter(`imports@${umlClass._id}`)
            .assign(resolvedImports.join("\n"));

    }
    createAttributeFragment(umlElement, fragmentType, preserveSectionId) {
        const isCollection = !umlElement.isZeroOrOneMultiplicity();

        const fragmentCode = isCollection ? CodeTemplates.privateAttributeCollection : CodeTemplates.privateAttribute;

        return this.documentationProcessor
            .documentAttribute(
                fragmentFactory
                    .createFragment(FragmentKind.simple, umlElement.name, fragmentType)
                    .createPreserveBefore(preserveSectionId)
                    .assign(fragmentCode(umlElement))
                    .link(umlElement), umlElement);
    }
    isSuppressAccessors() {
        return this.useLombok;
    }
    linkMethodsDisabled() {
        return !this.linkMethodsEnabled;
    }
    isClassifierImmutable() {
        const umlClassifier = this.classifier.element;
        return javaProfile.is("immutable", umlClassifier);
    }
    isReadOnlyAttribute(umlElement) {
        return this.isClassifierImmutable() || umlElement.isReadOnly;
    }
    isSetterExcluded(umlElement, excludeSetters) {
        return this.isReadOnlyAttribute(umlElement) ||
            umlElement.isStatic ||
            excludeSetters;
    }
    assembleAttribute(umlElement, excludeSetter) {
        const isSingleValued = umlElement.isZeroOrOneMultiplicity();
        const umlClassifier = this.classifier.element;
        // getters and setters should be omitted for static attributes
        const excludeAccessors = umlElement.isStatic || this.isSuppressAccessors();

        excludeSetter = this.isSetterExcluded(umlElement, excludeSetter) || this.isSuppressAccessors();

        attributeCount++;

        let attribute = this.createAttributeFragment(umlElement, CodeFragmentType.field, `attribute.annotations@${umlElement._id}`);

        let attributeGetter = fragmentFactory
            .createFragment(FragmentKind.simple, umlElement.name, CodeFragmentType.fieldGetter)
            .assign(CodeTemplates.attributeGetter(umlElement, this.indent));

        let attributeSetter = fragmentFactory
            .createFragment(FragmentKind.simple, umlElement.name, CodeFragmentType.fieldSetter)
            .assign(
                this.fluentSetters ?
                    CodeTemplates.fluentAttributeSetter(umlClassifier, umlElement, this.indent) :
                    CodeTemplates.attributeSetter(umlElement, this.indent));

        this.classifier.add(attribute);

        if (!excludeAccessors) {
            this.classifier.add(attributeGetter);
        }

        if (isSingleValued && !excludeSetter) {
            this.classifier.add(attributeSetter);
        }

        return this.classifier;
    }
    assembleMethod(umlOperation, hasBody) {
        let inputParams = umlOperation.getNonReturnParameters(),
            methodParams = [],
            returnType = "";

        methodParams = inputParams.map(param => {
            const annotations = param.annotations.join("");
            let paramValue = `${param.paramType} ${param.name}`;
            if (annotations) {
                paramValue = `${annotations} ${paramValue}`;
            }
            return paramValue;
        });

        if (umlOperation.isOverriden) {
            umlOperation.annotate("@Override");
        }

        returnType = getReturnType(umlOperation);

        let methodFragment = fragmentFactory
            .createFragment(FragmentKind.method, umlOperation.name)
            .createPreserveBefore(`method.annotations@${umlOperation._id}`)
            .setAbstract(umlOperation.isAbstract || !hasBody)
            .setSignature(CodeTemplates.methodSignature(umlOperation, methodParams, returnType))
            .annotate(umlOperation.annotations.join(""))
            .link(umlOperation);

        methodFragment = this.documentationProcessor
            .documentMethod(methodFragment, umlOperation);

        if (!methodFragment.isAbstract) {
            methodFragment.createPreserveMethodBody(`method.body@${umlOperation._id}`);
        }

        this.classifier.add(methodFragment);

        return this.classifier;
    }
    implementMethod(umlOperation, classifier) {
        let inputParams = umlOperation.getNonReturnParameters(),
            methodParams = [],
            returnType = "";
        const methodProperties = {};

        methodProperties.accessLevel = getAccessLevel(umlOperation);
        methodProperties.modifiers = getModifiers(umlOperation, true).join(" ");

        methodParams = inputParams.map(param => {
            const annotations = param.annotations ? param.annotations.join("") : "";
            let paramValue = `${getParameterType(param)} ${param.name}`;
            if (annotations) {
                paramValue = `${annotations} ${paramValue}`;
            }
            return paramValue;
        });

        returnType = getReturnType(umlOperation);

        let methodFragment = fragmentFactory
            .createFragment(FragmentKind.method, umlOperation.name)
            .createPreserveBefore(`method.annotations@${umlOperation._id}`)
            .setSignature(CodeTemplates.method(umlOperation, methodParams, returnType, methodProperties))
            .createPreserveMethodBody(`method.body@${umlOperation._id}`)
            .annotate("@Override");

        methodFragment = this.documentationProcessor
            .documentMethod(methodFragment, umlOperation);

        classifier.add(methodFragment);

        return this.classifier;
    }
    assembleClass(umlClass) {
        attributeCount = 0;
        this.classifier = this.documentationProcessor
            .documentClass(this.createClassFragment(umlClass),umlClass);
        this.module.add(this.classifier);
    }
    createClassFragment(umlClass) {
        const classFragment = fragmentFactory
            .createFragment(FragmentKind.classifier, umlClass.name)
            .setClassHeader(this.createClassHeader(umlClass))
            .createPreserveBefore(`class.annotations@${umlClass._id}`)
            .createPreserveExtras(`${umlClass.classifierType}.extras@${umlClass._id}`)
            .setDeclaration(CodeTemplates.classifierDeclaration(umlClass))
            .link(umlClass)
            .setQualifiedName(umlClass.getQualifiedName());

        if (this.useLombok && umlClass instanceof type.UMLClass) {
            umlClass
                .annotate("@Getter")
                .annotate("@Setter")
                .annotate("@NoArgsConstructor");
        }
        return classFragment;
    }
    createAttributeCollectionFragment(umlElement, fragmentType, preserveSectionId) {
        return this.documentationProcessor
            .documentAttribute(fragmentFactory
                .createFragment(FragmentKind.simple, umlElement.name, fragmentType)
                .createPreserveBefore(preserveSectionId)
                .assign(CodeTemplates.privateAttribute(umlElement, this.indent))
                .link(umlElement), umlElement);
    }
    createLinkFragment(myAssociationEnd, otherAssociationEnd, codeTemplate) {
        return fragmentFactory
            .createFragment(FragmentKind.simple, myAssociationEnd.name, CodeFragmentType.associationLink)
            .assign(CodeTemplates[codeTemplate](
                myAssociationEnd,
                otherAssociationEnd,
                this.indent,
                this.fluentLinkMethods));
    }
    createUnlinkFragment(myAssociationEnd, otherAssociationEnd, codeTemplate) {
        return fragmentFactory
            .createFragment(FragmentKind.simple, myAssociationEnd.name, CodeFragmentType.associationUnlink)
            .assign(CodeTemplates[codeTemplate](
                myAssociationEnd,
                otherAssociationEnd,
                this.indent,
                this.fluentLinkMethods));
    }
    createPackageInfo(umlPackage) {
        let packageFragment = fragmentFactory
            .createFragment(FragmentKind.simple, umlPackage.name, CodeFragmentType.other)
            .assign(CodeTemplates.packageDeclaration(umlPackage))
            .createPreserveBefore("package.info");

        packageFragment =
            this.documentationProcessor
                .documentPackage(packageFragment, umlPackage);

        // workaround, caused by the changed documentationProcessing API
        const packageDoc = packageFragment.documentation;
        const packageInfoHeader = [];

        packageInfoHeader.push(this.fileComment);
        packageInfoHeader.push(packageDoc);

        packageFragment.document(packageInfoHeader.join(newLine));

        return packageFragment;
    }
    resolveImports(umlClassifier) {
        this.classifier
            .setResolvedImports(this.createResolvedImports(umlClassifier));
    }
    addEnumLiteralsPreserveSection() {
        this.classifier.createPreserveAfter("enum.literals");
    }
    addEnumLiterals(umlEnum) {
        let literals = [];

        umlEnum.literals.forEach(literal => literals.push(literal.name));

        let enumLiterals = fragmentFactory
            .createFragment(FragmentKind.simple, umlEnum.name, CodeFragmentType.enumLiteral)
            .assign(literals.join(",\n") + endOfLine);

        this.classifier.add(enumLiterals);
    }
}

exports.JavaCodeAssembler = JavaCodeAssembler;