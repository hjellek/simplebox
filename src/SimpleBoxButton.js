var SimpleBoxButton = (function () {
    function SimpleBoxButton(label, callbackOrCssClass, callback) {
        this.label = "";
        this.cssClass = "";
        this.label = label;
        if(callbackOrCssClass) {
            if(callbackOrCssClass instanceof String) {
                this.cssClass = callbackOrCssClass;
            } else if(typeof callbackOrCssClass == 'function') {
                this.callback = callbackOrCssClass;
            }
        }
        if(callback) {
            this.callback = callback;
        }
    }
    return SimpleBoxButton;
})();
//@ sourceMappingURL=SimpleBoxButton.js.map
