/*global $, app, kendo*/

const profileManager = require("./core/profile").ProfileManager;

const extensionsPanelTemplate = require("./resources").extensionsPanelTemplate;
const rebelOptions = require("./preferences").getGenOptions();

const 
    PanelManager       = app.panelManager,
    SelectionManager   = app.selections,
    Factory            = app.factory;



let extensionsPanel, $itemGrid, $rebelAlerts, $noElementSelectedAlert, $emptyContextAlert;

let selectedModelElement, selectedProfile;

SelectionManager.on("selectionChanged", (models, views) => {
    if (models && models.length ) {
        selectedModelElement = models[0];
        suppressProperties(views[0]);
        renderProfile(selectedProfile, selectedModelElement);
    }
});

Factory.on("elementCreated", (model, view) => {
    suppressProperties(view);
});

function suppressProperties(element) {
    if (element && ("showProperty" in element) && rebelOptions.isSuppressProperties && element.showProperty) {
        element.showProperty = false;
    }
}

function hide() {
    extensionsPanel.hide();
}

function toggle() {
    extensionsPanel.isVisible()? hide(): show();
}

function renderProfile(profile, modelElement) {
    $itemGrid.empty();
    $rebelAlerts.hide();
    if (profile && modelElement) {
        profile
            .getTagSet(modelElement)
            .forEach(tag => tag.render($itemGrid, modelElement));
    }

    if (!modelElement) {
        $noElementSelectedAlert.show();
    } else if ($itemGrid.children().length === 0) {
        $emptyContextAlert.show();
    }


}

function show(){
    if (!extensionsPanel) {
        extensionsPanel = createExtensionsPanel();
    }
    extensionsPanel.show();
}

function createExtensionsPanel() {
    const $extensionsPanel = $(extensionsPanelTemplate);
    const $close = $extensionsPanel.find(".close");
    const $profileList = $extensionsPanel.find(".profile-section .listview");
    
    $itemGrid = $extensionsPanel.find(".tag-section .grid");
    $rebelAlerts = $extensionsPanel.find(".data-rebel-empty");
    $noElementSelectedAlert = $extensionsPanel.find("#no-selected-element");
    $emptyContextAlert = $extensionsPanel.find("#empty-rebel-context");
    
    $close.click(() => hide());

    const profiles = profileManager
        .registeredProfiles
        .map( profile => {
            return {
                name: profile.name, 
                text: profile.displayName
            };
        });
    const dataSource = new kendo.data.DataSource({ data: profiles });

    $profileList.kendoListView({
        dataSource: dataSource,
        selectable: true,
        template: "<div>#= text #</div>",
        change: function() {
            var data = dataSource.view();
            var item = data[this.select().index()];
            selectedProfile = profileManager.getProfile(item.name);
            renderProfile(selectedProfile, selectedModelElement);
        }
    });

    var profileListView = $profileList.data("kendoListView");
    profileListView.select(profileListView.element.children().first());
    return PanelManager.createBottomPanel("?", $extensionsPanel, 220);
}

exports.toggle = toggle;
exports.show = show;