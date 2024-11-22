/**
* Contains core concepts related to definition and usage of UML profiles.
*/
/* global type, app, $ */

const Mustache = require("mustache");

const resources = require("../resources");

const stringTagTemplate = resources.stringTagTemplate,
    booleanTagTemplate = resources.booleanTagTemplate,
    enumTagTemplate = resources.enumTagTemplate;

const Factory = app.factory,
    Engine = app.engine;
const ModelExplorerView = app.modelExplorer,
    SelectionManager = app.selections;



const TagKind = {
    bool: "boolean",
    integer: "integer",
    string: "string",
    enum: "enum"
};

const UMLElementType = {
    package: type.UMLPackage,
    classifier: type.UMLClassifier,
    class: type.UMLClass,
    enum: type.UMLEnumeration,
    interface: type.UMLInterface,
    attribute: type.UMLAttribute,
    associationEnd: type.UMLAssociationEnd,
    any: type.ExtensibleModel
};

function alwaysAwailable() {
    return true;
}

class Tag {
    constructor(name, displayName, defaultValue, type, isAvailableFn) {
        this.name = name;
        this.displayName = displayName;
        this.defaultValue = defaultValue;
        this.type = type;
        this.qualifiedName = "";
        this.isAvailableFor = (isAvailableFn) ? isAvailableFn : alwaysAwailable;
    }
    createTag(modelElement, value) {
        const that = this;
        const backup = ModelExplorerView.select;

        ModelExplorerView.select = function select() { }; // do nothing

        let options = {};
        options.modelInitializer = (value => (tag) => {
            that.setupTag(tag, value);
        })(value);
        options.id = "Tag";
        options.parent = modelElement;
        options.field = "tags";
        const tag = Factory.createModel(options);

        ModelExplorerView.select = backup;

        return tag;
    }

    setupTag(tag, value) {
        tag.name = this.qualifiedName;
        tag.kind = this.getTagKind();
        tag.value = value;
    }

    get(modelElement) {
        let tag = modelElement.getTag(this.qualifiedName);
        let tagValue = tag ? tag.value : this.defaultValue;
        return tagValue;
    }
    is(modelElement) {
        return this.get(modelElement);
    }
    set(modelElement, value) {
        const existingTag = modelElement.getTag(this.qualifiedName);
        if (existingTag) {
            Engine.deleteElements([existingTag], []);
        }
        if (value !== this.defaultValue) {
            this.createTag(modelElement, value);
        }
    }
    setQualifiedName(qualifiedName) {
        this.qualifiedName = qualifiedName;
    }
    render(parent, modelElement) {
        const $item = $(Mustache.render(stringTagTemplate, {
            displayName: this.displayName,
            qualifiedName: this.qualifiedName,
            value: this.get(modelElement)
        }));
        const $edit = $item.find("input");
        parent.append($item);
        $edit.change(() => this.set(modelElement, $edit.val()));
    }
}

class BooleanTag extends Tag {
    constructor(name, displayName, defaultValue, isAvailableFn) {
        super(name, displayName, defaultValue, TagKind.bool, isAvailableFn);
    }
    getTagKind() {
        return TagKind.bool;
    }
    setupTag(tag, value) {
        super.setupTag(tag, value);
        tag.checked = Boolean(value === "true" || value === true);
    }
    get(modelElement) {
        const value = super.get(modelElement);
        return Boolean(value === "true" || value === true);
    }
    set(modelElement, value) {
        value = Boolean(value === "true" || value === true);
        super.set(modelElement, value);
    }
    render(parent, modelElement) {
        const value = this.is(modelElement);
        const $item = $(Mustache.render(booleanTagTemplate, {
            displayName: this.displayName,
            qualifiedName: this.qualifiedName,
            value: value
        }));
        const $check = $item.find("input");
        parent.append($item);
        $check.change(() => {
            this.set(modelElement, $check.is(":checked"));
            SelectionManager.selectModel(modelElement);
        });
    }
}

class IntegerTag extends Tag {
    constructor(name, displayName, defaultValue, isAvailableFn) {
        super(name, displayName, defaultValue, TagKind.integer, isAvailableFn);
    }
    getTagKind() {
        return TagKind.integer;
    }
    setupTag(tag, value) {
        super.setupTag(tag, value);
        tag.number = Number(value === "true" || value === true);
    }
}

class StringTag extends Tag {
    constructor(name, displayName, defaultValue, isAvailableFn) {
        super(name, displayName, defaultValue, TagKind.string, isAvailableFn);
    }
    getTagKind() {
        return TagKind.string;
    }
}

class EnumTag extends Tag {
    constructor(name, displayName, isAvailableFn, defaultValue, ...enumLiterals) {
        super(name, displayName, defaultValue, TagKind.enum, isAvailableFn);
        this.enumLiterals = enumLiterals;
    }
    getTagKind() {
        return TagKind.string;
    }
    render(parent, modelElement) {
        const $item = $(Mustache.render(enumTagTemplate, {
            displayName: this.displayName,
            qualifiedName: this.qualifiedName,
            value: this.get(modelElement),
            options: this.enumLiterals.map(literal => ({
                value: literal,
                display: literal
            }))
        }));
        const $edit = $item.find(".k-combo > input"),
            $select = $item.find(".k-combo > select");
        parent.append($item);
        $edit.change(() => {
            this.set(modelElement, $edit.val());
            SelectionManager.selectModel(modelElement);
        });
        $select.val(this.get(modelElement));
        $select.change(() => {
            $edit.val($select.val());
            $edit.change();
        });
    }
}

class Profile {
    constructor(name, displayName) {
        this.name = name;
        this.displayName = displayName;
        this.tags = {};
        this.bindings = [];
    }

    register(tag) {
        this.tags[tag.name] = tag;
        tag.setQualifiedName(`${this.name}.${tag.name}`);
        tag.profile = this;
        return tag;
    }
    bind(elementType, ...tags) {
        this.bindTags(elementType, tags);
    }
    bindTags(elementType, tags) {
        this.bindings.push({
            "elementType": elementType,
            "tags": tags
        });
    }
    bindMultipleTypes(elementTypes, ...tags) {
        elementTypes.forEach(elementType => this.bindTags(elementType, tags));
    }
    getTagSet(modelElement) {
        let tagSet = [];
        this.bindings.forEach(binding => {
            if (modelElement instanceof binding.elementType) {
                tagSet = tagSet.concat(binding.tags);
            }
        });
        return tagSet.filter(tag => tag.isAvailableFor(modelElement));
    }

    get(tagName, modelElement) {
        const tag = this.tags[tagName];
        if (!tag) {
            throw new Error(`Tag ${tagName} does not exist in the ${this.name} profile`);
        }
        return tag.get(modelElement);
    }
    is(tagName, modelElement) {
        return this.get(tagName, modelElement);
    }
    set(tagName, modelElement, value) {
        const tag = this.tags[tagName];
        if (!tag) {
            throw new Error(`Tag ${tagName} does not exist in the ${this.name} profile`);
        }
        tag.set(modelElement, value);
    }
}

class ProfileManager {
    constructor() {
        this.registeredProfiles = [];
    }
    register(profile) {
        this.registeredProfiles.push(profile);
        return this;
    }
    getTagSet(modelElement) {
        let tagSet = [];
        this.registeredProfiles.forEach(profile => {
            tagSet = tagSet.concat(profile.getTagSet(modelElement));
        });
        return tagSet;
    }
    getProfile(name) {
        return this.registeredProfiles
            .find(profile => profile.name === name);
    }
    reset() {
        this.registeredProfiles = [];
    }
}
exports.TagKind = TagKind;

exports.UMLElementType = UMLElementType;

exports.BooleanTag = BooleanTag;
exports.IntegerTag = IntegerTag;
exports.StringTag = StringTag;
exports.EnumTag = EnumTag;

exports.Profile = Profile;

exports.ProfileManager = new ProfileManager();
