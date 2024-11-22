/**
 * This module contains core concepts related to transformation of UML into the executable artifacts.
 **/

/* global $ */
const FragmentKind = {
    module: "module",
    classifier: "classifier",
    section: "section",
    method: "method",
    simple: "simple",
    template: "template"
};

exports.FragmentKind = FragmentKind;

const CodeFragmentType = {
    module: "module",
    classifier: "classifier",
    enumLiteral: "literal",
    field: "field",
    fieldGetter: "getter",
    fieldSetter: "setter",
    associationLink: "associationLink",
    associationUnlink: "associationUnlink",
    method: "method",
    constructorMethod: "constructor",
    supportingMethod: "supportingMethod",
    other: "other"
};

exports.CodeFragmentType = CodeFragmentType;

/**
* PreserveSection represents code that should be preserved throughout generation of the code.
* PreserveSection is always created by the mddToolkit, but its contents is defined  by the user.
* The software developer - user, enters lines of code to be preserved after code has been generated
*  from the UML model.
*/
class PreserveSection {
    constructor(id) {
        /**
  * @member {string} id unique identifier of the PreserveSection
  */
        this.id = id;

        /**
   * @member {Array.<string>} lines of code coded by a software developer working on the project
   */
        this.contents = [];
    }
    /**
 * @return Returns a string that begins a preserve section.
 */
    begin() {
        // return PRESERVE_SECTION_BEGIN + this.id + PRESERVE_SECTION_BEGIN_END;
        return `// ----------- << ${this.id} >>`;
    }
    /**
 * @return Returns a string that ends a preserve section.
 */
    end() {
        return "// ----------- >>";
    }
    /**
 * Function write() will write the contents of the PreserveSection to the writer object.
 * @param {MDDIO.StringWriter} buffer
 */
    write(buffer, preserveSectionWriter) {
        preserveSectionWriter.write(buffer, this);
    }
    /**
 * Adds a line of code to the preserve section.
 * @param line line to be added to the preserve section
 */
    preserve(line) {
        this.contents.push(line);
    }
}

exports.PreserveSection = PreserveSection;

class AbstractCodeFragment {
    constructor(name, type) {
        this.name = name;
        this.type = type;
        this.documentation = undefined;
        this.annotations = [];
        this.preserveBefore = [];
        this.preserveAfter = [];
    }
    /**
* Enumerates all preserve sections contained within this and nested code fragments.
* @return {Map<string,PreserveSection>} containing all preserve sections and their ids
*/
    enumeratePreserveSections() {
        let map = {};
        this.registerPreservedSections(map);
        return map;
    }
    /**
* Registers preserved sections of this fragment into a map.
* Redefined by subclasses.
*/
    registerPreservedSections(map) {
        this.preserveBefore.forEach(section => AbstractCodeFragment.registerPreservedSection(map, section));
        this.preserveAfter.forEach(section => AbstractCodeFragment.registerPreservedSection(map, section));

    }
    static registerPreservedSection(map, section) {
        if (section) {
            map[section.id] = section;
        }
    }
    document(documentation) {
        this.documentation = documentation;
        return this;
    }
    annotate(annotation) {
        this.annotations.push(annotation);
        return this;
    }
    writeDoc(buffer, preserveWriter) {
        if (this.documentation) {
            let lines = this.documentation.split("\n");
            lines.forEach(line => buffer.writeLine(line));
            preserveWriter.writeSpacer(buffer);
        }
        return this;
    }
    writeAnnotations(writer) {
        const annotations = this.element ? this.element.annotations : this.annotations;
        annotations.forEach(annotation => writer.writeLine(annotation));
        return this;
    }
    createPreserveBefore(id) {
        this.preserveBefore.push(new PreserveSection(id));
        return this;
    }
    createPreserveAfter(id) {
        this.preserveAfter.push(new PreserveSection(id));
        return this;
    }
    writePreserveBefore(buffer, preserveWriter) {
        this.preserveBefore.forEach(section => section.write(buffer, preserveWriter));
        return this;
    }
    writePreserveAfter(buffer, preserveWriter) {
        this.preserveAfter.forEach(section => section.write(buffer, preserveWriter));
        return this;
    }
    getType() {
        return this.type;
    }
    /**
 * Links umlElement to this fragment.
 */
    link(umlElement) {
        if (umlElement) {
            umlElement.unlinkCodeFragment();
            umlElement.codeFragment = this;
            this.element = umlElement;
        }
        return this;
    }
    add() {
        throw "unsupported add operation exception";
    }
    unshift() {
        throw "unsupported unshift operation exception";
    }
    write() {
        throw "unsupported write operation exception";
    }
    /**
 * Serializes code fragment, using the serializer.
 * @param serializer Serializer to be used.
 * @return {$.Promise}
 */
    serialize() {
        throw "unsupported serialize operation exception";
    }
    setQualifiedName(qualifiedName) {
        this.qualifiedName = qualifiedName;
        return this;
    }
    getQualifiedName() {
        return this.qualifiedName;
    }
}

class Module extends AbstractCodeFragment {
    constructor(name) {
        super(name, CodeFragmentType.module);
        this.fragments = [];
        this.packageInfo = undefined;
    }
    setPackageInfo(packageInfo) {
        this.packageInfo = packageInfo;
        return this;
    }
    write(buffer, preserveWriter) {
        if (this.packageInfo) {
            this.packageInfo.write(buffer, preserveWriter);
        }
    }
    registerPreservedSections(map) {
        if (this.packageInfo) {
            this.packageInfo.registerPreservedSections(map);
        }
        this.fragments.forEach(fragment => fragment.registerPreservedSections(map));
    }
    /**
* Does serialization of the module using the given serializer.
* @param {FragmentSerializer} serializer serializer to be used
* @return returns $.Promise
*/
    serialize(serializer) {
        let result = new $.Deferred();

        serializer
            .serializeModule(this)
            .then(() =>{
                const promises = this.fragments.map(fragment => fragment.serialize(serializer));
                $.when.apply($, promises)
                    .done(() => result.resolve())
                    .fail((err) => result.reject(err)); 
            }).fail(err => result.reject(err));
        return result.promise();
    }
    add(fragment) {
        if (fragment.getType() === CodeFragmentType.module || fragment.getType() === CodeFragmentType.classifier) {
            this.fragments.push(fragment);
        } else {
            throw "module code fragment cannot store anything except classifiers and modules";
        }
        return this;
    }
}

class SimpleCodeFragment extends AbstractCodeFragment {
    constructor(name, type) {
        super(name, type);
        this.line = "";
    }
    assign(line) {
        this.line = line;
        return this;
    }
    append(line) {
        this.line += `\n${line}`;
    }
    write(buffer, preserveWriter) {
        this
            .writeDoc(buffer, preserveWriter)
            .writeAnnotations(buffer)
            .writePreserveBefore(buffer, preserveWriter);
        const lines = this.line.split("\n");
        lines.forEach(line => buffer.writeLine(line));
        this.writePreserveAfter(buffer, preserveWriter);
        preserveWriter.writeSpacer(buffer);
    }
}

class MethodFragment extends AbstractCodeFragment {
    constructor(name) {
        super(name, CodeFragmentType.method);
        this.signature = "";
        // abstract methods do not have method body
        this.isAbstract = false;
        this.preserveMethodBody = undefined;
    }
    setAbstract(isAbstract) {
        this.isAbstract = isAbstract;
        return this;
    }
    setSignature(signature) {
        this.signature = signature;
        return this;
    }
    createPreserveMethodBody(id) {
        this.preserveMethodBody = new PreserveSection(id);
        return this;
    }
    registerPreservedSections(map) {
        super.registerPreservedSections(map);
        AbstractCodeFragment.registerPreservedSection(map, this.preserveMethodBody);
    }
    hasMethodBody() {
        return this.preserveMethodBody !== undefined;
    }
    write(buffer, preserveWriter) {
        this.writeDoc(buffer, preserveWriter)
            .writeAnnotations(buffer)
            .writePreserveBefore(buffer, preserveWriter);

        if (this.hasMethodBody()) {
            buffer.writeLine(this.signature + " {");
            this.writeMethodBody(buffer, preserveWriter);
            buffer.writeLine("}");
        } else {
            buffer.writeLine(this.signature + ";");
        }
    }
    writeMethodBody(buffer, preserveWriter) {
        if (this.preserveMethodBody) {
            this.preserveMethodBody.write(buffer, preserveWriter);
        }
    }
}

class SectionFragment extends AbstractCodeFragment {
    constructor(name) {
        super(name);
        this.fragments = [];
    }
    /**
     * can take any kind of fragment as a parameter
     */
    add(fragment) {
        this.fragments.push(fragment);
        return this;
    }
    /**
     * Unlike add() that puts fragment to the end of the this.fragments array, unshift puts it in the front of the array.
     * @param {*} fragment 
     */
    unshift(fragment) {
        this.fragments.unshift(fragment);
        return this;
    }
    write(buffer, preserveWriter) {
        this.fragments.forEach(fragment => fragment.write(buffer, preserveWriter));
    }
    registerPreservedSections(map) {
        this.fragments.forEach(fragment => fragment.registerPreservedSections(map));
    }
}

class ClassifierFragment extends AbstractCodeFragment {
    constructor(name) {
        super(name, CodeFragmentType.classifier);
        const sectionTypes = [
            CodeFragmentType.enumLiteral,
            CodeFragmentType.field,
            CodeFragmentType.fieldGetter,
            CodeFragmentType.fieldSetter,
            CodeFragmentType.associationLink,
            CodeFragmentType.associationUnlink,
            CodeFragmentType.supportingMethod,
            CodeFragmentType.method,
            CodeFragmentType.constructorMethod
        ];
        // class header contains file comment, package declaration, standard imports
        this.classHeader = undefined;
        // resolved imports contains resolved imports as well as preserved section imports
        this.resolvedImports = undefined;
        // class declaration
        this.declaration = "";
        // sections comprising class body
        this.sections = {};

        this.extrasPreservedSection = undefined;

        sectionTypes.forEach(sectionType => {
            this.sections[sectionType] = new SectionFragment(sectionType);
        });
    }
    add(fragment) {
        this.sections[fragment.type].add(fragment);
        return this;
    }
    unshift(fragment) {
        this.sections[fragment.type].unshift(fragment);
        return this;
    }
    setDeclaration(declaration) {
        this.declaration = declaration;
        return this;
    }
    setClassHeader(classHeader) {
        this.classHeader = classHeader;
        return this;
    }
    addStandardImport(additionalImport) {
        this.classHeader.append(additionalImport);
    }
    setResolvedImports(resolvedImports) {
        this.resolvedImports = resolvedImports;
        return this;
    }
    createPreserveExtras(id) {
        this.extrasPreservedSection = new PreserveSection(id);
        return this;
    }
    registerPreservedSections(map) {
        super.registerPreservedSections(map);
        AbstractCodeFragment.registerPreservedSection(map, this.extrasPreservedSection);

        if (this.classHeader) {
            this.classHeader.registerPreservedSections(map);
        }
        if (this.resolvedImports) {
            this.resolvedImports.registerPreservedSections(map);
        }

        for (let sectionName in this.sections) {
            this.sections[sectionName].registerPreservedSections(map);
        }
    }
    write(buffer, preserveWriter) {
        if (this.classHeader) {
            this.classHeader.write(buffer, preserveWriter);
        }
        if (this.resolvedImports) {
            this.resolvedImports.write(buffer, preserveWriter);
        }
        this.writeDoc(buffer, preserveWriter)
            .writeAnnotations(buffer)
            .writePreserveBefore(buffer, preserveWriter);
        buffer.writeLine(this.declaration + " {");
        buffer.indent();
        this.writePreserveAfter(buffer, preserveWriter);

        for (let sectionName in this.sections) {
            this.sections[sectionName].write(buffer, preserveWriter);
        }

        buffer.outdent();

        if (this.extrasPreservedSection) {
            this.extrasPreservedSection.write(buffer, preserveWriter);
        }

        buffer.writeLine("}");
    }
    /**
* Does serialization of the classifier using the given serializer.
* @param {FragmentSerializer} serializer serializer to be used
* @return returns $.Promise
*/
    serialize(serializer) {
        return serializer.serializeClassifier(this);
    }
}

class ClassTemplateFragment extends AbstractCodeFragment {
    constructor(name) {
        super(name, CodeFragmentType.classifier);
    }

    write(buffer) {
        if (this.template) {
            buffer.writeLine(this.template);
        }
    }

    setSource(source){
        this.source = source;
        return this;
    }
    getSource() {
        return this.source;
    }

    serialize(serializer) {
        return serializer.serializeTemplate(this);
    }
}

class CodeFragmentFactory {
    constructor() {
        this.fragment = {};
        this.fragment[FragmentKind.module] = Module.prototype.constructor;
        this.fragment[FragmentKind.classifier] = ClassifierFragment.prototype.constructor;
        this.fragment[FragmentKind.section] = SectionFragment.prototype.constructor;
        this.fragment[FragmentKind.method] = MethodFragment.prototype.constructor;
        this.fragment[FragmentKind.simple] = SimpleCodeFragment.prototype.constructor;
        this.fragment[FragmentKind.template] = ClassTemplateFragment.prototype.constructor;
    }
    createFragment(kind, name, type) {
        return new this.fragment[kind](name, type);
    }
}

exports.CodeFragmentFactory = CodeFragmentFactory;

