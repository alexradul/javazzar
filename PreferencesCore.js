
/**
* Concepts of this module are defined in order to enable dynamic definition of different preferences
* for the MDD toolkit plugin.
*/

var ItemType = {
    section: "Section",
    string: "String",
    boolean: "Check",
    number: "Number",
    multiSelect: "Dropdown",
    color: "Color"
};

exports.ItemType = ItemType;

/**
* PreferenceItem represents a piece of information to be stored in the preferences.
* @constructor
* @param {PreferenceSection} section Section this item belongs to.
* @param {string} key Key of the item. Must be unique.
* @param {string} text Text to be displayed
* @param {string} description Description of the item.
* @param {ItemType} type of the item.
* @param {object} defaultValue Default value of the item.
* @param {Array<object>} options An array of value/text pairs to be used in case of multiSelect item type.
*/
function PreferenceItem(section, key, text, description, type, defaultValue, options) {
    this.section = section;
    this.key = key;
    this.text = text;
    this.description = description;
    this.type = type;
    this.defaultValue = defaultValue;
    this.options = options;
}

exports.PreferenceItem = PreferenceItem;

PreferenceItem.prototype.getQualifiedId = function () {
    return this.section.getQualifiedId() + "." + this.key;
};

PreferenceItem.prototype.append = function (preferences) {
    var preferenceItem = {};

    preferenceItem.text = this.text;
    preferenceItem.description = this.description;
    preferenceItem.type = this.type;
    preferenceItem.default = this.defaultValue;
    if (this.options) {
        preferenceItem.options = this.options;
    }

    preferences[this.getQualifiedId()] = preferenceItem;
};

/**
* PreferenceSection represents set of preference items grouped according to certain criteria.
* @constructor
* @param {PreferenceSchema} schema schema of the section
* @param {string} id unique identifier of the PreferenceSection
* @param {string} text text to be displayed for this section
*/
function PreferenceSection(schema, id, text) {

    /**
    * @member
    */
    this.schema = schema;

    /**
* @member
*/
    this.id = id;

    /**
* @member
*/
    this.text = text;

    /**
* @member items to be included in the section
*/
    this.items = [];
}

exports.PreferenceSection = PreferenceSection;

PreferenceSection.prototype.getQualifiedId = function () {
    return this.schema.id + "." + this.id;
};

/**
*
*/
PreferenceSection.prototype.addPreference = function (key, text, description, type, defaultValue, options) {
    // TODO: check whether there is already item having the given key
    this.items.push(new PreferenceItem(this, key, text, description, type, defaultValue, options));
    return this;
};

PreferenceSection.prototype.appendPreferenceItems = function (preferences) {
    preferences[this.getQualifiedId()] = {
        text: this.text,
        type: "Section"
    };

    this.items.forEach(preference => preference.append(preferences));
};



/**
* PreferenceSchema represents preferences to be available for a software component.
* @constructor
* @param {string} id unique identifier of the PreferenceSchema
*/
function PreferenceSchema(id) {
    /**
     * @member {string} id of the PreferenceSchema
     */
    this.id = id;

    /**
 * @member {Array.<string>} sections Different sections to be available throughout the PreferenceSchema
 */
    this.sections = [];
}

exports.PreferenceSchema = PreferenceSchema;

/**
* Creates a new PreferenceSection.
* @param {string} id
* @return {PreferenceSection} returns newly created PreferenceSection.
*/
PreferenceSchema.prototype.createSection = function (id, text) {
    var section = new PreferenceSection(this, id, text);
    this.sections.push(section);
    return section;
};

/**
* @return {object} to be used by StarUML to display users preferences.
*/
PreferenceSchema.prototype.buildPreferences = function () {
    var preferences = {};

    this.sections.forEach(section => section.appendPreferenceItems(preferences));

    return preferences;
};
