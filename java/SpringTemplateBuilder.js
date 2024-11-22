/* global app */

let CodeBuilder = require("../core/generator").CodeBuilder;

let Fragments = require("../core/fragments");
const templates = require("../templates");
const Mustache = require("mustache");

const JavaProfiles = require("./JavaProfiles");
const persistenceProfile = new JavaProfiles.PersistenceProfile(),
    springProfile = new JavaProfiles.SpringProfile();

let fragmentFactory = new Fragments.CodeFragmentFactory(),
    FragmentKind = Fragments.FragmentKind;

const repository = app.repository;

const isEntity = (umlClass) => {
    return persistenceProfile.is("persistent", umlClass) && !umlClass.isValueType();
};

const isGenerateRepository = (umlClass) => {
    return isEntity(umlClass) && !springProfile.is("excludeRepository", umlClass);
};

const isGenerateService = (umlClass) => {
    return isGenerateRepository(umlClass) && !springProfile.is("excludeService", umlClass);
};

const isGenerateController = (umlClass) => {
    return isGenerateService(umlClass) && !springProfile.is("excludeController", umlClass);
}

const createPackageModule = (umlPackage) => {
    return fragmentFactory
        .createFragment(FragmentKind.module, umlPackage.name)
        .link(umlPackage)
        .setQualifiedName(umlPackage.getQualifiedName());
};

const createTemplateFragment = (className, classTemplate, umlPackage) => {
    return fragmentFactory
        .createFragment(FragmentKind.template, className)
        .setSource(classTemplate)
        .setQualifiedName(`${umlPackage.getQualifiedName()}.${className}`);
};

class SpringTemplateBuilder extends CodeBuilder {
    constructor(options) {
        super();
        this.fileComment = options.fileHeaderComment.replaceAll("\\n","\n");
        this.commonRepositoryInterface = options.commonRepositoryInterface;
        this.idAttributeType = options.idAttributeType;
        this.fileComment = options.fileHeaderComment.replaceAll("\\n", "\n");
        this.standardImports = options.standardImports.replaceAll(";", ";\n");
        this.repositoryPackage = repository.select("@UMLPackage[stereotype=repository]")[0];
        this.servicePackage = repository.select("@UMLPackage[stereotype=service]")[0];
        this.controllerPackage = repository.select("@UMLPackage[stereotype=controller]")[0];

        if (this.repositoryPackage) {
            this.repositoryModule = createPackageModule(this.repositoryPackage);
            // repository is a precondition for service module
            if (this.servicePackage) {
                this.serviceModule = createPackageModule(this.servicePackage);
            }
        }
        if (this.serviceModule) {
            // service module is a precondition for controller module
            if (this.controllerPackage) {
                this.controllerModule = createPackageModule(this.controllerPackage);
            }
        }
    }
    buildClass(umlClass) {
        if (this.repositoryModule && isGenerateRepository(umlClass)) {
            this.assembleRepositoryClass(umlClass);
        }
        if (this.serviceModule && isGenerateService(umlClass)) {
            this.assembleServiceClass(umlClass);
        }
        if (this.controllerModule && isGenerateController(umlClass)) {
            this.assembleControllerClass(umlClass);
        }
    }
    assembleRepositoryClass(entityClass) {
        const repositoryName = `${entityClass.name}Repository`;
        const templateParams = {
            fileComment: this.fileComment,
            packageQualifiedName: this.repositoryPackage.getQualifiedName(),
            entityClassQualifiedName: entityClass.getQualifiedName(),
            entityClassName: entityClass.name,
            baseRepository: this.commonRepositoryInterface,
            primaryKeyType: this.idAttributeType
        };

        const repositoryTemplate = Mustache.render(templates.repositoryTemplate, templateParams);

        this.repositoryModule
            .add(createTemplateFragment(repositoryName, repositoryTemplate, this.repositoryPackage));
    }

    assembleServiceClass(entityClass) {
        const templateParams = {
            fileComment: this.fileComment,
            servicePackage: this.servicePackage.getQualifiedName(),
            entityClassQualifiedName: entityClass.getQualifiedName(),
            entityClassName: entityClass.name,
            repositoryPackage: this.repositoryPackage.getQualifiedName(),
            primaryKeyType: this.idAttributeType
        };
        const serviceTemplate = Mustache.render(templates.serviceTemplate, templateParams);

        this.serviceModule
            .add(createTemplateFragment(`${entityClass.name}Service`, serviceTemplate, this.servicePackage));
    }

    assembleControllerClass(entityClass) {
        const templateParams = {
            fileComment: this.fileComment,
            packageQualifiedName: this.controllerPackage.getQualifiedName(),
            entityClassQualifiedName: entityClass.getQualifiedName(),
            entityClassName: entityClass.name,
            servicePackage: this.servicePackage.getQualifiedName(),
            entityClassRequestMapping: entityClass.name.toLowerCamelCase() + "s",
            primaryKeyType: this.idAttributeType
        };
        const controllerTemplate = Mustache.render(templates.controllerTemplate, templateParams);

        this.controllerModule
            .add(createTemplateFragment(`${entityClass.name}Controller`, controllerTemplate, this.controllerPackage));
    }
}

exports.SpringTemplateBuilder = SpringTemplateBuilder;