/**
 * Created with IntelliJ IDEA.
 * User: hjellek
 * Date: 6/15/13
 * Time: 11:56 AM
 */

class SimpleBoxSettings {
    public animate:Boolean = true;
    public startHidden:Boolean = false;

    public closeOnEscape:Boolean = false;
    public onEscape:any;

    public backdrop:any = 'static';

    public cssClass:String = "";

    public closeButton:Boolean = true;
    public closeButtonMarkup:String = "";

    public icons:{} = {};

    public size:{} = {
        min: false,
        max: false
    };

    public preventScrolling:Boolean = true;
}