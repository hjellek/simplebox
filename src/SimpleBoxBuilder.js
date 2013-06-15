var SimpleBoxBuilder = (function () {
    function SimpleBoxBuilder() {
        this.header = null;
        this.content = "";
        this.buttons = [];
        this.settings = new SimpleBoxSettings();
    }
    SimpleBoxBuilder.prototype.setContent = function (content) {
        this.content = content;
        return this;
    };
    SimpleBoxBuilder.prototype.setHeader = function (header) {
        this.header = header;
        return this;
    };
    SimpleBoxBuilder.prototype.setSettings = function (settings) {
        this.settings = settings;
        return this;
    };
    SimpleBoxBuilder.prototype.addButton = function (buttonOrLabel, callbackOrCssClass, callback) {
        var button;
        if(buttonOrLabel instanceof SimpleBoxButton) {
            button = buttonOrLabel;
        } else {
            button = new SimpleBoxButton(buttonOrLabel, callbackOrCssClass, callback);
        }
        this.buttons.push(button);
        return this;
    };
    SimpleBoxBuilder.prototype.setButtons = function (buttons) {
        this.buttons = buttons;
        return this;
    };
    SimpleBoxBuilder.prototype.build = function () {
        return new SimpleBox(this.header, this.content, this.buttons, this.settings).render();
    };
    return SimpleBoxBuilder;
})();
//@ sourceMappingURL=SimpleBoxBuilder.js.map
