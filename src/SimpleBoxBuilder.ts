/**
 * Created with IntelliJ IDEA.
 * User: hjellek
 * Date: 6/15/13
 * Time: 11:10 AM
 */
///<reference path='SimpleBox.ts' />
///<reference path='SimpleBoxButton.ts' />
///<reference path='SimpleBoxSettings.ts' />
declare module SimpleBox
{
    export class SimpleBoxBuilder
    {
        private header:String = null;
        private content:String = "";
        private buttons:SimpleBoxButton[];
        private settings:SimpleBoxSettings = new SimpleBoxSettings;

        constructor()
        {

        }

        public setContent(content:String)
        {
            this.content = content;
        }

        public setHeader(header:String)
        {
            this.header = header;
        }

        public setSettings(settings:SimpleBoxSettings)
        {
            this.settings = settings;
        }

        public addButton(label:String)
        public addButton(label:String, cssClass:String)
        public addButton(label:String, callback:());
        public addButton(label:String, cssClass:String, callback:());
        public addButton(buttonOrLabel:any, callbackOrCssClass?:any, callback?:())
        {
            var button:SimpleBoxButton;
            if(buttonOrLabel instanceof SimpleBoxButton)
            {
                button = buttonOrLabel;
            }
            else
            {
                button = new SimpleBoxButton(buttonOrLabel, callbackOrCssClass, callback);
            }
            this.buttons.push(button);
        }

        public setButtons(buttons:SimpleBoxButton[])
        {
            this.buttons = buttons;
        }

        public build()
        {
            return new SimpleBox(this.header, this.content, this.buttons, this.settings).render();
        }
    }
}