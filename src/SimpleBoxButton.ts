/**
 * Created with IntelliJ IDEA.
 * User: hjellek
 * Date: 6/15/13
 * Time: 11:10 AM
 */
class SimpleBoxButton {
    public label:String = "";
    public cssClass:String = "";
    public callback:()=>{};
    public icon:String;

    constructor(label:String, callbackOrCssClass?:any, callback?:()=>{}) {
        this.label = label;
        if (callbackOrCssClass) {
            if (callbackOrCssClass instanceof String) {
                this.cssClass = callbackOrCssClass;
            }
            else if (typeof callbackOrCssClass == 'function') {
                this.callback = callbackOrCssClass;
            }
        }
        if (callback) {
            this.callback = callback;
        }
    }
}