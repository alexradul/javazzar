/**
* Contains core abstractions related to serialization of code fragments.
*/

/* global $ */

const fs = require("fs"),
    mkdirp = require("mkdirp"),
    Fragments = require("./fragments"),
    fileSeparator = "/";

class FileUtils {
    /**
     * Creates a directory if it does not already exist. 
     * @param {string} path Directory path. 
     * @returns {$.Promise}
     */
    static mkdir(path) {
        const deferred = new $.Deferred();
        if (!fs.existsSync(path)) {
            mkdirp(path, (err) => {
                err? deferred.reject(err) : deferred.resolve();
            });
        } else {
            deferred.resolve();
        }
        return deferred.promise();
    }

    /**
     * Creates a file if it does not already exist.
     * @param {string} filePath File path
     * @param {string} text Contents of the file to be written to the disk.
     */
    static touch(filePath, text) {
        const deferred = new $.Deferred();
        if (!fs.existsSync(filePath)) {
            fs.writeFile(filePath, text, "utf-8", err => err? deferred.reject(err) : deferred.resolve());
        } else {
            deferred.resolve();
        }
        return deferred.promise();
    }

    /**
     * Reads a contents of the file. 
     * @param {string} filePath File path. 
     * @returns {$.Promise}
     */
    static readAsText(filePath) {
        const deferred = new $.Deferred();
        fs.readFile(filePath, "utf-8", (err, data) => {
            if (err) {
                deferred.reject(err);
            } else {
                deferred.resolve(data);
            }
        });
        return deferred.promise();
    }
    /**
     * Writes text to the file denoted by the filePath. 
     * @param {string} filePath 
     * @param {string} text 
     * @returns {$.Promise} 
     */
    static writeText(filePath, text) {
        const deferred = new $.Deferred();
        fs.writeFile(filePath, text, "utf-8", err => err? deferred.reject(err) : deferred.resolve());
        return deferred.promise();
    }
}

/**
* Class StringWriter contains lines of source code in memory.
*/
class StringWriter {
    constructor(indentString) {
        /** @member {string} indentString */
        this.indentString = indentString;
        /** @member {Array.<string>} lines */
        this.lines = [];
        /** @member {Array.<string>} indentations */
        this.indentations = [];
    }
    /**
* indent() method increases amount of text by indentString.
*/
    indent() {
        this.indentations.push(this.indentString);
    }
    /**
 * outdent() method decreases amount of indentations by an indentString
 */
    outdent() {
        this.indentations.splice(this.indentations.length - 1, 1);
    }
    /**
* Appends a line of text to the end of the lines array.
* @param line a line of text to be appended to the end. If falsy, a new (empty) line will be added.
*/
    writeLine(line) {
        line = line ? (this.indentations.join("") + line) : "";
        this.lines.push(line);
    }
    /**
* Appends a line of text to the end of the lines array, without using indentations.
* This method is used when handling PreserveSections
* @param line line of text to be appended. If empty, new line will be added.
*/
    writeLineWithoutIndent(line) {
        line = line ? line : "";
        this.lines.push(line);
    }
    /**
 * Returns all writer's lines concatenated by a new line.
 * @return contents of the StringWriter
 */
    toString() {
        return this.lines.join("\n");
    }
}

exports.StringWriter = StringWriter;

/**
* Defines interface to be implemented by different code fragment serializers.
*/
class FragmentSerializer {
    /**
* Serializes module.
* @return returns $.Promise
*/
    serializeModule() { }
    /**
* Serializes classifier.
* @return returns $.Promise
*/
    serializeClassifier() { }

/**
* Serializes template.
* @return returns $.Promise
*/
    serializeTemplate() {}

}

exports.FragmentSerializer = FragmentSerializer;

/**
 * PreserveSectionWriter writes a preserve section to the StringWriter. 
 */
// eslint-disable-next-line no-unused-vars
class PreserveSectionWriter {
    /**
     * 
     * @param {StringWriter} _buffer : StringWriter used to contain the contents of the @param _preserveSection
     * @param {PreserveSection} _preserveSection preserve section to be handled - written to the String buffer
     */
    // eslint-disable-next-line no-unused-vars
    write(_buffer, _preserveSection){}

    // eslint-disable-next-line no-unused-vars
    writeSpacer(buffer){}
}

class MddSectionWriter extends PreserveSectionWriter {
    write(buffer,preserveSection){
        buffer.writeLine(preserveSection.begin());
        if (preserveSection.contents.length) {
            buffer.writeLineWithoutIndent(preserveSection.contents.join("\n"));
        }
        buffer.writeLine(preserveSection.end());
    }

    writeSpacer(buffer){
        buffer.writeLine();
    }
}

class NonPreserveWriter extends PreserveSectionWriter {
    write(buffer,preserveSection){
        if (preserveSection.contents.length) {
            buffer.writeLineWithoutIndent(preserveSection.contents.join("\n"));
        }
    }
}

const mddSectionWriter = new MddSectionWriter(), 
    nonPreserveWriter = new NonPreserveWriter();

const destinationFilePath = (basePath, qualifiedName) => {
    var filename = qualifiedName.split(".").join(fileSeparator);
    return `${basePath}${fileSeparator}${filename}.java`;
};

const destinationDirPath = (basePath, qualifiedName) => {
    var directoryName = qualifiedName.split(".").join(fileSeparator);
    return `${basePath}${fileSeparator}${directoryName}`;
};

/**
 * A strategy of serializing classes
 */
class SerializationStrategy {
    getSourceFilePath(filePerClassSerializer, qualifiedName){}
    getDestinationFilePath(filePerClassSerializer, qualifiedName){}
    
    getPreserveSectionWriter(){}
}

class UpdateStrategy extends SerializationStrategy{
    getSourceFilePath(serializer, qualifiedName){
        return destinationFilePath(serializer.basePath, qualifiedName);
    }
    getDestinationFilePath(serializer, qualifiedName){
        return destinationFilePath(serializer.basePath, qualifiedName);
    }
    getPreserveSectionWriter(){
        return mddSectionWriter;
    }
}

class ExportStrategy extends SerializationStrategy{
    getSourceFilePath(serializer, qualifiedName){
        return destinationFilePath(serializer.basePath, qualifiedName);
    }
    getDestinationFilePath(serializer, qualifiedName){
        return destinationFilePath(serializer.destinationPath, qualifiedName);
    }
    getPreserveSectionWriter(){
        return nonPreserveWriter;
    }
}

const exportStrategy = new ExportStrategy(),
    updateStrategy = new UpdateStrategy();


/**
* Serializes code fragments in a way that modules maps to directories and each classifier maps to a file.
*/
class FilePerClassSerializer extends FragmentSerializer {

    constructor(basePath, indentString, destinationPath) {
        super();
        /**@member {string} basePath for storing generated code*/
        this.basePath = basePath;
        /**@member {string} indentString to be used when formatting code*/
        this.indentString = indentString;
        /**
         * @member {string} basePath for storing generated code
         */
        this.destinationPath = destinationPath;

        this.serializationStrategy = destinationPath? exportStrategy : updateStrategy;
    }

    /**
* Creates a new directory for the module.
* @param module module to be serialized.
* @return {$.Promise}
*/
    serializeModule(module) {
        let directoryName = this.getDirPath(module.getQualifiedName()),
            promise;
        promise = this.createDirectory(directoryName);
        if (module.packageInfo) {
            promise = promise.then(this.emitSource(module.packageInfo, `${module.getQualifiedName()}/package-info`));
        }
        return promise;
    }
    /**
* Creates a new file for the classifier.
* @param classifier to be serialized
* @return {$.Promise}
*/
    serializeClassifier(classifier) {
        return this.emitSource(classifier, classifier.getQualifiedName());
    }

    serializeTemplate(classifierTemplate) {
        const filename = this.getFilePath(classifierTemplate.getQualifiedName());
        return FileUtils.touch(filename, classifierTemplate.getSource());
    }
    /**
 * Returns full file path for the package.
 * @param {type.UMLPackage} umlPackage
 * @return {string} absolute path of the package (basePath + qualified name)
 */
    getDirPath(qualifiedName) {
        var directoryName = qualifiedName.split(".").join(fileSeparator);
        return `${this.basePath}${fileSeparator}${directoryName}`;
    }
    /**
 * Returns full file path for the package.
 * @param {type.UMLClassifier} umlClassifier
 * @return {string} absolute path of the file (basePath + qualified name + .java)
 */
    getFilePath(qualifiedName) {
        var filename = qualifiedName.split(".").join(fileSeparator);
        return `${this.basePath}${fileSeparator}${filename}.java`;
    }
    /**
* Creates a new directory - if does not exist, otherwise does nothing.
* @param {string} path directory to be created
* @return {$.Promise}
*/
    createDirectory(path) {
        return FileUtils.mkdir(path);
    }
    /**
 * Emits code fragment to a file. If file does not exist, creates it.
 * @param {MDDCore.CodeFragment} codeFragment fragment to save
 * @param {string} path path of the source file
 * @return {$.Promise}
*/
    emitSource(codeFragment, qualifiedName) {
        const result = new $.Deferred();
        const sourcePath = this.serializationStrategy.getSourceFilePath(this, qualifiedName);
        const destinationPath = this.serializationStrategy.getDestinationFilePath(this, qualifiedName);
        FileUtils.readAsText(sourcePath)
            .done(fileData => this.importPreserveSections(codeFragment, fileData)
                .then(this.write(codeFragment, destinationPath))
                .then(result.resolve, result.reject))
            .fail(() =>
                this.write(codeFragment, destinationPath)
                    .then(result.resolve, result.reject));
        return result.promise();
    }
    importPreserveSections(codeFragment, fileData) {
        var sourceLines = fileData.split("\n"),
            preserveSections = [],
            preserveSectionBuilder = new PreserveSectionBuilder(),
            result = new $.Deferred();

        try {
            sourceLines.forEach(line => preserveSectionBuilder.processLine(line));
            preserveSections = preserveSectionBuilder.completeProcessing();
            this.preserve(codeFragment, preserveSections);
            result.resolve();
        } catch (err) {
            result.reject(err);
        }

        return result.promise();
    }
    preserve(codeFragment, preserveSections) {
        let modelSections = codeFragment.enumeratePreserveSections();
        preserveSections.forEach(section => {
            let modelSection = modelSections[section.id];
            if (modelSection) {
                modelSection.contents = section.contents;
            } else {
                // console.log("Section with id=" + section.id + " not found in the model.");
            }
        });
    }
    write(codeFragment, filePath) {
        const preserveSectionWriter = this.serializationStrategy.getPreserveSectionWriter();
        const writer = new StringWriter(this.indentString);
        codeFragment.write(writer, preserveSectionWriter);
        return FileUtils.writeText(filePath, writer.toString());
    }
}

exports.FilePerClassSerializer = FilePerClassSerializer;

/* Regular expression used to recognize preserve sections */
const REGEX_PRESERVE_BEGIN = /\/{2} -{11} <{2} (.*) >{2}/;
const REGEX_PRESERVE_END = /\/{2} -{11} >{2}/;

/**
* Represents current state of the PreserveSectionBuilder. State Design Pattern.
*
*/
class PreserveBuilderState {
    constructor() {
    }
    /**
* Invoked to process one line of code. Existing code is processed one line at a time.
*/
    processCodeLine() { }
    /**
* Invoked at the end of processing to denote end of the process.
*/
    completeProcessing() { }
    /**
* Returns true if line (of code) represents a preserve section (starting) comment.
*/
    isPreserveSectionStart(line) {
        return REGEX_PRESERVE_BEGIN.test(line);
    }
    /**
* Returns true if line (of code) represents a preserve section (ending) comment.
*/
    isPreserveSectionEnd(line) {
        return REGEX_PRESERVE_END.test(line);
    }
    /**
* Extracts sectionId from the preserve section comment and throws an exception if not present.
* @param line preserve section starting comment
*/
    getSectionId(line) {
        const match = line.match(REGEX_PRESERVE_BEGIN);
        if (!match) {
            throw ("Failed to extract preserve section id in " + line);
        }
        return match[1];
    }
}

/**
* Handles the plain code: source code outside of preserve sections.
*/
class PlainCodeHandler extends PreserveBuilderState {
    processCodeLine(builder, line) {
        if (this.isPreserveSectionStart(line)) {
            builder.startPreserveSection(this.getSectionId(line));
        }
    }
    completeProcessing(builder) {
        return builder.preserved;
    }
}

/**
* Handles code stored within preserve sections.
*/
class PreserveSectionHandler extends PreserveBuilderState {
    processCodeLine(builder, line) {
        if (this.isPreserveSectionEnd(line)) {
            builder.finishPreserveSection();
        } else if (this.isPreserveSectionStart(line)) {
            // TODO: add some context information
            throw "PreserveSection nesting is not supported: missing PreserveSection end";
        } else {
            builder.preserve(line);
        }
    }
    completeProcessing() {
        throw "Missing PreserveSection end at the end of the file";
    }
}

const PLAIN_CODE_HANDLER = new PlainCodeHandler(),
    PRESERVE_SECTION_HANDLER = new PreserveSectionHandler();

/**
* Performs processing of existing source files.
* After source processing is complete, PreserveSectionBuilder contains all its preserve sections.
* @constructor
*/
class PreserveSectionBuilder {
    constructor() {
        /**
  * @member {PreserveBuilderState} handler current handler of the code, changes during source processing
  */
        this.handler = PLAIN_CODE_HANDLER;
        /**
  * @member {Array.<PreserveSection>} preserved contains all preserved sections from the processed source code
  */
        this.preserved = [];
        /**
  * @member {PreserveSection} preserveSection represents currently processed preserve section
  */
        this.preserveSection = null;
    }
    /**
* Processes a line of code. If within preserve section: preserve it - ignore otherwise.
*/
    processLine(line) {
        this.handler.processCodeLine(this, line);
    }
    /**
* Denotes end of source code.
* @return {Array.<PreserveSection>} if source is well structured - successfully processed, throws exception if not.
*/
    completeProcessing() {
        return this.handler.completeProcessing(this);
    }
    changeState(newState) {
        this.handler = newState;
    }
    /**
* Invoked by the handler to start processing a new preserve section.
*/
    startPreserveSection(id) {
        var preserveSection = new Fragments.PreserveSection(id);
        this.preserveSection = preserveSection;
        this.preserved.push(preserveSection);
        this.changeState(PRESERVE_SECTION_HANDLER);
    }
    /**
* Invoked by the handler to preserve a line of code, by putting it in the current preserve section
*/
    preserve(line) {
        this.preserveSection.preserve(line);
    }
    finishPreserveSection() {
        this.preserveSection = null;
        this.changeState(PLAIN_CODE_HANDLER);
    }
}


