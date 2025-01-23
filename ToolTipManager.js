/* global app*/

const
    path = require("path");
    
const resources = require("./resources");
const Mustache = require("mustache");

// tooltipmanager.js
class ToolTipManager {
    constructor() {
        const storedIndex = app.preferences.get("javazzar.rebel.toolTipIndex");
        this.tipIndex = storedIndex? storedIndex : 0;
        this.toolTips = JSON.parse(resources.rebelTips).tips;
    }

    hasNextTip() {
        return !((this.tipIndex + 1) === this.toolTips.length);
    }

    hasPreviousTip() {
        return this.tipIndex > 0;
    }

    incrementTipIndex() {
        this.tipIndex = ++this.tipIndex % this.toolTips.length;
        this.storeTipIndex();
        return this.tipIndex;
    }

    decrementTipIndex() {
        --this.tipIndex;
        if (this.tipIndex < 0) {
            this.tipIndex = this.toolTips.length - 1;
        }
        this.storeTipIndex();
        return this.tipIndex;
    }

    storeTipIndex() {
        app.preferences.set("javazzar.rebel.toolTipIndex", this.tipIndex);
    }

    currentTip() {
        return this.retrieveTip(this.tipIndex);
    }

    nextTip() {
        return this.retrieveTip(this.incrementTipIndex());
    }
    previousTip() {
        return this.retrieveTip(this.decrementTipIndex());
    }

    setShowTips(value) {
        app.preferences.set("javazzar.rebel.showTipsAtStartup", value);
    }

    isShowTips() {
        return app.preferences.get("javazzar.rebel.showTipsAtStartup");
    }

    retrieveTip(tipIndex) {
        const tip = this.toolTips[tipIndex];
        const filePath = tip.image === "none"? "": ""+path.join(__dirname, "tipoftheday/"+tip.image);
        const imagePath = filePath.replaceAll("\\","/");
        const attributes = tip.attrs? 
            tip.attrs : 
        { "height": "200px",
            "width": "500px" };
        return {
            "name": tip.name,
            "description": tip.description,
            "image": imagePath,
            "attrs": attributes
        };
    }

    showTooltipDialog(){
        const currentTip = this.currentTip();
        const dialog = app.dialogs.showModalDialogUsingTemplate(
            Mustache.render(resources.toolTipDialogTemplate, currentTip), true);
        const $dlg = dialog.getElement();
        const $nextTip = $dlg.find("[data-button-id=\"nextTip\"]");
        const $previousTip = $dlg.find("[data-button-id=\"previousTip\"]");
        const $description = $dlg.find(".tip-description");
        const $image = $dlg.find(".tip-image");
        const $dlgBody = $dlg.find(".dialog-body");
        const $dontShowTips = $dlg.find("[data-input-id=\"dontShowTips\"]");

        $dontShowTips.click((event) => {
            this.setShowTips(!event.target.checked);
        });

        const tipChanged = () => {
            $nextTip.attr("disabled", !this.hasNextTip());
            $previousTip.attr("disabled", !this.hasPreviousTip());

            if (!this.hasNextTip()) {
                $nextTip.removeClass("primary");
            }
            if (!this.hasPreviousTip()) {
                $previousTip.removeClass("primary");
            }
            $dlgBody.scrollTop(0);
        };

        tipChanged();

        const setTip = (tip) => {
            $description.html(tip.description);
            if (tip.image) {
                const url = `url('${tip.image}')`;
                $image.css("background-image", url);
            } else {
                $image.css("background-image", "");
            }
            for (const attr in tip.attrs) {
                $image.css(attr, tip.attrs[attr]);
            }
        };

        setTip(currentTip);

        $previousTip.click(() => {
            if (!$previousTip.hasClass("primary")) {
                $previousTip.addClass("primary");
                $nextTip.removeClass("primary");
            }
            setTip(this.previousTip());
            tipChanged();
        });


        $nextTip.click(() => {
            if (!$nextTip.hasClass("primary")) {
                $nextTip.addClass("primary");
                $previousTip.removeClass("primary");
            }
            setTip(this.nextTip());
            tipChanged();
        });

        $nextTip.focus();
        return dialog;
    }
}

exports.ToolTipManager = new ToolTipManager();