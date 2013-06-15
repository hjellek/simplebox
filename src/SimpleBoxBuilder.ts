/**
 * Created with IntelliJ IDEA.
 * User: hjellek
 * Date: 6/15/13
 * Time: 11:10 AM
 */
///<reference path='SimpleBox.ts' />
///<reference path='SimpleBoxButton.ts' />
///<reference path='SimpleBoxSettings.ts' />

class SimpleBoxBuilder {
    private header:String = null;
    private content:String = "";
    private buttons:SimpleBoxButton[] = [];
    private settings:SimpleBoxSettings = new SimpleBoxSettings;

    public setContent(content:String) {
        this.content = content;
        return this;
    }

    public setHeader(header:String) {
        this.header = header;
        return this;
    }

    public setSettings(settings:SimpleBoxSettings) {
        this.settings = settings;
        return this;
    }

    public addButton(buttonOrLabel:any, callbackOrCssClass?:any, callback?:()=>{}) {
        var button:SimpleBoxButton;
        if (buttonOrLabel instanceof SimpleBoxButton) {
            button = buttonOrLabel;
        }
        else {
            button = new SimpleBoxButton(buttonOrLabel, callbackOrCssClass, callback);
        }
        this.buttons.push(button);
        return this;
    }

    public setButtons(buttons:SimpleBoxButton[]) {
        this.buttons = buttons;
        return this;
    }

    public build() {
        return new SimpleBox(this.header, this.content, this.buttons, this.settings).render();
    }
}
