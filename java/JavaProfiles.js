/**
* Contains definition of profiles used by code builders relying on
* the Java programming stack.
*/

const profile = require("../core/profile");

const Profile = profile.Profile,
    BooleanTag = profile.BooleanTag,
    StringTag = profile.StringTag,
    EnumTag = profile.EnumTag,
    UMLElementType = profile.UMLElementType;

const profileManager = profile.ProfileManager;

const containsIdAttribute = (umlClass) => umlClass.isRoot() && isPersistent(umlClass);
const isCapableForOptimisticLocking = containsIdAttribute;

class JavaProfile extends Profile {
    constructor() {
        super("javazzar.java", "Java");
        const generateCode = this.register(new BooleanTag("generateCode", "Generate Java code", true));
        const immutable = this.register(new BooleanTag("immutable", "Is immutable", false));
        const packagePrefix = this.register(new StringTag("packagePrefix", "Base package", "", (umlPackage) => umlPackage.stereotype === "root"));

        this.bind(UMLElementType.classifier, generateCode);
        this.bind(UMLElementType.class, immutable);
        this.bind(UMLElementType.package, packagePrefix);
    }
}

class DocumentationProfile extends Profile {
    constructor() {
        super("javazzar.doc", "Documentation");
        const documentationFormat = this.register(new EnumTag("docFormat", "Documentation Format", null, 
            "inheritFromParent",
            "inheritFromParent", "javadoc", "swagger", "none"));
        this.bind(UMLElementType.package, documentationFormat);
        this.bind(UMLElementType.classifier, documentationFormat);
    }
}

class PersistenceProfile extends Profile {
    constructor() {
        super("javazzar.persistence", "Persistence");

        const persistent = this.register(new BooleanTag("persistent", "Is persistent", false));
        const tableName = this.register(new StringTag("tableName", "Table name", "", isPersistent));
        const idGeneratorType = this.register(new EnumTag("idGeneratorType", "ID Generator Type",
            containsIdAttribute,
            "Auto", "Auto", "Sequence", "Identity", "Table"));
        const useOptimisticLocking = this.register(new BooleanTag("useOptimisticLocking", "Use optimistic locking", true, isCapableForOptimisticLocking));

        const generatorName = this.register(new StringTag("generatorName", "ID Generator Name", "", usesNonAutoGeneratorType));
        const inheritanceMapping = this.register(new EnumTag("inheritanceStrategy", "Inheritance strategy",
            (umlClass) => umlClass.isRoot() && umlClass.hasSubclasses() && isPersistent(umlClass),
            "Joined", "Joined", "SingleTable", "TablePerClass"));

        const transient = this.register(new BooleanTag("transient", "Is transient", false));
        const columnName = this.register(new StringTag("columnName", "Column name", "", isPersistentAndNotTransient));
        const columnLength = this.register(new StringTag("columnLength", "Column length", "", isPersistentAndNotTransient));
        const unique = this.register(new BooleanTag("unique", "Is unique", false, isPersistentAndNotTransient));
        const largeObject = this.register(new BooleanTag("lob", "Is LOB", false, isPersistentAndNotTransient));
        const updatable = this.register(new BooleanTag("updatable", "Is updatable", true, isPersistentAndNotTransient));
        const insertable = this.register(new BooleanTag("insertable", "Is insertable", true, isPersistentAndNotTransient));
        const fetchType = this.register(new EnumTag("fetchType", "Fetch type", notTransient, "default", "default", "lazy", "eager"));

        this.bind(UMLElementType.class, persistent, inheritanceMapping, tableName, useOptimisticLocking, idGeneratorType, generatorName);
        this.bind(UMLElementType.attribute, transient, columnName, columnLength, largeObject, unique, updatable, insertable);
        this.bind(UMLElementType.associationEnd, transient, fetchType);
    }
}

const persistenceProfile = new PersistenceProfile();

function notTransient(element) {
    return !persistenceProfile.is("transient", element);
}

function isPersistentAndNotTransient(element) {
    return (isPersistentAttribute(element) && !persistenceProfile.is("transient", element));
}

function isEntity(element) {
    return !element.isValueType();
}

function isPersistent(element) {
    return (persistenceProfile.is("persistent", element) && isEntity(element)) ;
}

function isPersistentAttribute(attribute) {
    return isPersistent(attribute._parent);
}

function usesNonAutoGeneratorType(umlClass) {
    const generatorType = persistenceProfile.get("idGeneratorType", umlClass);
    return  ( generatorType && generatorType !== "Auto");
}

class SpringProfile extends Profile {
    constructor() {
        super("javazzar.spring", "Spring");
        const excludeRepository = this.register(new BooleanTag("excludeRepository", "Suppress Repository Generation", false, (umlClass) => isPersistent(umlClass)));
        const excludeService = this.register(new BooleanTag("excludeService", "Suppress Service Generation", false, (umlClass) => hasSpringRepository(umlClass)));
        const excludeController = this.register(new BooleanTag("excludeController", "Suppress Controller Generation", false, (umlClass) => hasSpringService(umlClass)));
        const componentKind = this.register(new EnumTag("componentKind", "Component kind", (umlClass)=> !isPersistent(umlClass), 
            "None", 
            "None", "Component", "Service", "Configuration", "Controller", "RestController", "Repository"));
        const componentName = this.register(new StringTag("componentName", "Component name", "", isSpringComponent));
        this.bind(UMLElementType.class, excludeRepository, excludeService, excludeController, componentKind, componentName);
    }
}
const springProfile = new SpringProfile();

function isSpringComponent(umlClass){
    return (!isPersistent(umlClass) && springProfile.get("componentKind", umlClass) !== "None");
}

function hasSpringRepository(umlClass) {
    return isPersistent(umlClass) && !springProfile.is("excludeRepository", umlClass);
}

function hasSpringService(umlClass) {
    return hasSpringRepository(umlClass) && !springProfile.is("excludeService", umlClass);
}

class CustomAnnotationProfile extends Profile {
    constructor() {
        super("javazzar.annotations", "Custom Annotations");
        const annotation = this.register(new StringTag("annotation", "Annotation Value(s)", ""));
        this.bind(UMLElementType.any, annotation);
    }
}

class JacksonProfile extends Profile {
    constructor() {
        super("javazzar.serialization", "Jackson");
        const serializable = this.register(new BooleanTag("serializable", "Serializable", true));
        const ignoreUnknownProperties = this.register(new BooleanTag("ignoreUnknownProperties", "Ignore unknown properties", false, isSerializable));
        const suppressTypeInfo = this.register(new BooleanTag("suppressTypeInfo", "Suppress type info", false, isTypeInfoPropertyHolder));
        const property = this.register(new StringTag("property", "Property name", "", isSerializable));
        const typeInfoPropertyName = this.register(new StringTag("typeInfoPropertyName", "Type-info property", "type", isTypeInfoPropertyHolderAndEnabled));
        const typeInfoPropertyValue = this.register(new StringTag("typeInfoPropertyValue", "Type-info property value", "", isSerializableLeaf));


        this.bind(UMLElementType.class, serializable, ignoreUnknownProperties, suppressTypeInfo, typeInfoPropertyName, typeInfoPropertyValue);
        this.bind(UMLElementType.associationEnd, serializable, property);
        this.bind(UMLElementType.attribute, serializable, property);
    }
    isTypeInfoPropertyHolder(umlClass) {
        return umlClass instanceof UMLElementType.class && 
        isTypeInfoPropertyHolderAndEnabled(umlClass);
    }
    isTypeInfoPropertyValueHolder(umlClass) {
        return umlClass instanceof UMLElementType.class && 
            isSerializableLeaf(umlClass);
    }
}

const jacksonProfile = new JacksonProfile();

function isSerializable(umlElement) {
    return jacksonProfile.get("serializable", umlElement) === true;
}

function isTypeInfoPropertyHolder(umlClass) {
    return umlClass.isRoot() && 
        jacksonProfile.get("serializable", umlClass) && 
        umlClass.hasSubclasses();
}

function isTypeInfoPropertyHolderAndEnabled(umlClass) {
    return isTypeInfoPropertyHolder(umlClass) && !jacksonProfile.get("suppressTypeInfo", umlClass);
}

function isSerializableLeaf(umlClass) {
    return jacksonProfile.get("serializable", umlClass) && 
        !umlClass.isRoot() &&           // must not be the root in the hierarchy
        umlClass.getSuperClasses().length &&  // need to have super classes
        !umlClass.hasSubclasses() && // must not have subclasses
        !umlClass.isAbstract;     // must not be abstract
}

exports.JavaProfile = JavaProfile;
exports.PersistenceProfile = PersistenceProfile;
exports.SpringProfile = SpringProfile;
exports.CustomAnnotationProfile = CustomAnnotationProfile;
exports.JacksonProfile = JacksonProfile;
exports.DocumentationProfile = DocumentationProfile;


profileManager.register(new JavaProfile());
profileManager.register(new PersistenceProfile());
profileManager.register(new SpringProfile());
profileManager.register(new JacksonProfile());
profileManager.register(new CustomAnnotationProfile());
profileManager.register(new DocumentationProfile());
