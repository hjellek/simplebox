/**
 * User: hjellek
 * Date: 6/14/13
 * Time: 4:02 PM
 */
///<reference path='definitions/jquery.d.ts' />
module Simple
{
    export class Box {
        public static ESCAPE_KEY = 27;
        public static HIDESOURCE_ESCAPE = 'escape';
        public static HIDESOURCE_BUTTON = 'button';
        public static EVENT_RESIZE = 'simplebox.resize';

        private callbackHolder:CallbackHolder = new CallbackHolder();
        private hideSource:string;
        private scrollPosition:number;
        private header:string;
        private content:string;
        private buttons:Button[];
        private settings:Simple.Settings;

        constructor(header?:string, content?:string, buttons?:Button[], settings?:Simple.Settings)
        {
            this.header = header || "";
            this.content = content || "";
            this.buttons = buttons || [];
            this.settings = settings || new Simple.Settings();
        }

        public setContent(content:string)
        {
            this.content = content;
            return this;
        }

        public setHeader(header:string)
        {
            this.header = header;
            return this;
        }

        public setSetting(attribute:string, value:any)
        {
            this.settings[attribute] = value;
            return this;
        }

        public setSettings(settings:Simple.Settings)
        {
            this.settings = settings;
            return this;
        }

        public addButton(label:any, callbackOrCssClass?:any, callback?:()=>{})
        {
            var cssClass = "",
                onClick = $.noop;
            if (typeof callbackOrCssClass == 'function')
            {
                onClick = callbackOrCssClass;
            }
            else
            {
                cssClass = callbackOrCssClass;
                if (callback)
                {
                    onClick = callback;
                }
            }
            var button:SimpleBoxButton = new SimpleBoxButton(label, cssClass, onClick);
            this.buttons.push(button);
            return this;
        }

        public setButtons(buttons:Button[])
        {
            this.buttons = buttons;
            return this;
        }

        private createButtonMarkup()
        {
            var markup = "",
                numberOfButtons = this.buttons.length;

            for (var i = 0; i < numberOfButtons; i++)
            {
                var button:SimpleBoxButton = <SimpleBoxButton>this.buttons[i],
                    iconMarkup = "",
                    dataHandlerMarkup = "",
                    cssClass = "",
                    label = button.label;

                if (button.icon)
                {
                    iconMarkup = "<i class='" + button.icon + "'></i> ";
                }
                if (button.callback)
                {
                    var callbackIndex = this.callbackHolder.add(button.callback);
                    dataHandlerMarkup = "data-handler='" + callbackIndex + "'";
                }
                if (button.cssClass)
                {
                    cssClass = button.cssClass;
                }

                markup += "<a " + dataHandlerMarkup + " class='btn " + cssClass + "' href='#'>" + iconMarkup + "" + label + "</a>";
            }
            return markup
        }

        private createModalHeaderMarkup()
        {
            var closeButtonMarkup = "";
            if (this.settings.closeButton)
            {
                if (this.settings.closeButtonMarkup)
                {
                    closeButtonMarkup = this.settings.closeButtonMarkup;
                }
                else
                {
                    closeButtonMarkup = "<a href='#' class='close'>&times;</a>";
                }
            }
            return "<div class='modal-header'>" + closeButtonMarkup + "<h3>" + this.header + "</h3></div>";
        }

        private createModalCloseButton()
        {
            if (this.settings.closeButtonMarkup)
            {
                return this.settings.closeButtonMarkup;
            }
            return "<a href='#' class='close'></a>";
        }

        private backDropExists()
        {
            return $('.modal-backdrop').length !== 0;
        }

        private moveBackdropToModal(modal)
        {
            var z = modal.css('z-index') - 5;
            $('.modal-backdrop').css('z-index', z);
            $('body').addClass('modal-open');
        }

        private moveBackdropToPreviousModalOrRemove()
        {
            var modals = $('.modal');
            if (modals.length <= 0)
            {
                if (this.settings.animate)
                {
                    $('.modal-backdrop').fadeOut(300, function ()
                    {
                        $('.modal-backdrop').remove();
                        $('body').removeClass('modal-open');
                    });
                }
                else
                {
                    $('.modal-backdrop').remove();
                    $('body').removeClass('modal-open');
                }
            }
            else
            {
                this.moveBackdropToModal(modals.last());
            }
        }

        public setIcons(icons)
        {
            this.settings.icons = icons;
        }

        public static closeAll()
        {
            $(".simplebox") .modal("hide");
        }

        private createModalMarkup()
        {
            var parts = [];
            parts.push("<div class='simplebox modal " + this.settings.cssClass + "'>");
            if (this.header)
            {
                parts.push(this.createModalHeaderMarkup());
            }
            else if (this.settings.closeButton)
            {
                parts.push(this.createModalCloseButton());
            }
            parts.push("<div class='modal-body'><div>" + this.content + "</div></div>");
            if (this.buttons.length > 0)
            {
                parts.push("<div class='modal-footer'>" + this.createButtonMarkup() + "</div>")
            }
            parts.push("</div>");
            return parts.join("\n");
        }

        private setupEvents(modal)
        {
            var self:Simple.Box = this,
                DOMBody = $('body'),
                resizeModalOnWindowResize,
                $window = $(window);

            modal.bind('hidden', function ()
            {
                modal.remove();
                if (self.settings.preventScrolling)
                {
                    DOMBody.css('margin-top', '');
                    DOMBody.removeClass('simplebox-open');
                    $window.scrollTop(self.scrollPosition);
                }
            });

            $('.modal-footer a, a.close', modal).click(function (e)
            {
                e.preventDefault();
                self.hideSource = Simple.Box.HIDESOURCE_BUTTON;
                var callback = self.callbackHolder.get($(this).data("handler"));
                if (callback)
                {
                    if (callback(e, modal) !== false)
                    {
                        modal.close();
                    }
                }
                else
                {
                    modal.close();
                }
            });

            if (this.settings.autoResize)
            {
                var resizeTimer;
                resizeModalOnWindowResize = function ()
                {
                    if (resizeTimer)
                    {
                        clearTimeout(resizeTimer);
                    }
                    resizeTimer = setTimeout(function ()
                    {
                        self.resizeAndPosition(modal);
                    }, 100);
                };
                $window.bind('resize', resizeModalOnWindowResize);
            }

            modal.bind('hide', function ()
            {
                if (self.hideSource == Simple.Box.HIDESOURCE_ESCAPE &&
                    typeof self.settings.onEscape == 'function')
                {
                    self.settings.onEscape();
                }
                if (self.settings.preventScrolling)
                {

                }
                if (self.settings.autoResize)
                {
                    $window.unbind('resize', resizeModalOnWindowResize);
                }
            });

            $(document).bind('keyup.modal', function (e)
            {
                if (e.which === Simple.Box.ESCAPE_KEY)
                {
                    self.hideSource = Simple.Box.HIDESOURCE_ESCAPE;
                }
            });

            modal.bind('shown', function ()
            {
                $("a.btn:first", modal).focus();
            });

            if (this.settings.preventScrolling)
            {
                modal.bind('show', function ()
                {
                    self.scrollPosition = $(window).scrollTop();
                    DOMBody.css('margin-top', '-' + self.scrollPosition + 'px');
                    DOMBody.addClass('simplebox-open');
                });
            }
        }

        public render()
        {
            var modal = $(this.createModalMarkup()),
                DOMBody = $('body');

            if (this.settings.animate)
            {
                modal.addClass("fade");
            }
            if (this.settings.startHidden)
            {
                modal.addClass('hidden');
            }

            this.setupEvents(modal);

            if (!this.settings.closeOnEscape && this.settings.onEscape)
            {
                this.settings.closeOnEscape = true;
            }

            DOMBody.append(modal);

            var backdropAlreadyExists = this.backDropExists(),
                backdrop = (this.settings.backdrop === 'static' || this.settings.backdrop) && !backdropAlreadyExists ? this.settings.backdrop : false;

            modal.modal({
                "backdrop": backdrop,
                "keyboard": this.settings.closeOnEscape
            });

            if (backdropAlreadyExists)
            {
                this.moveBackdropToModal(modal);
            }

            this.createHelperFunctions(modal);

            this.resizeAndPosition(modal);

            return modal;
        }

        private createHelperFunctions(modal)
        {
            var self:Simple.Box = this;

            modal.close = function ()
            {
                this.bind('hidden', function ()
                {
                    self.moveBackdropToPreviousModalOrRemove();
                });
                this.modal('hide');
            };

            modal.modalResize = function (options)
            {
                options = options || {};
                var settings = self.settings.size;
                $.extend(settings, options);

                var sizes = self.calculateSizesForModal(modal, settings);
                self.resizeModalTo(modal, sizes);
                self.positionModalTo(modal, sizes);
            };

            modal.modalShow = function (fade)
            {
                this.hide();
                this.removeClass('hidden');
                if (fade)
                {
                    var speed = parseInt(fade, 10) || 300;
                    this.fadeIn(speed);
                }
                else
                {
                    this.show();
                }
            };

            modal.modalPopulate = function (data, resize)
            {
                this.find('.modal-body').html(data);
                if (resize)
                {
                    this.modalResize();
                }
            };
        }

        private calculateSizesForModal(modal, options)
        {
            var $body:JQuery = modal.find('.modal-body'),
                height:number = 0,
                viewHeight:number = $(window).innerHeight(),
                max:number,
                min:number,
                contentHeight:number,
                modalAreaSizes = this.calculateModalPartHeights(modal),
                headerAndFooterOffset = modalAreaSizes.header + modalAreaSizes.footer;

            var padding = parseInt($body.css('padding-top'), 10) + parseInt($body.css('padding-bottom'), 10);
            if (options.content && options.content !== false)
            {
                contentHeight = options.content === true ? modalAreaSizes.body + 10 : options.content;
                height = contentHeight;
            }

            if (options.max && options.max !== false)
            {
                max = options.max === true ? parseInt(modal.css('max-height'), 10) : options.max;
                if (max && (!contentHeight || contentHeight > max))
                {
                    height = max;
                }
            }
            else if (!contentHeight)
            {
                height = viewHeight - 30;
            }

            if (height > viewHeight)
            {
                height = viewHeight - 30; // a bit offset
            }

            if (options.min && options.min !== false)
            {
                min = options.min === true ? parseInt(modal.css('min-height'), 10) : options.min;
                if (height < min && min > viewHeight)
                {
                    height = min - 30;
                }
                else if (height < min)
                {
                    height = min;
                }
            }

            var modalSize:any = {
                totalHeight: 0,
                contentHeight: 0
            };

            if (contentHeight && (height + (headerAndFooterOffset + padding) < viewHeight && (!max || contentHeight <= max)))
            {
                modalSize.totalHeight = height + (headerAndFooterOffset + padding);
                modalSize.contentHeight = height;
            }
            else
            {
                modalSize.totalHeight = height;
                modalSize.contentHeight = height - (headerAndFooterOffset + padding);
            }

            return modalSize;
        }

        private resizeModalTo($modal, sizes)
        {
            var $body = $modal.find('.modal-body'),
                bodyCss = {
                    'height': sizes.contentHeight
                },
                modalCss = {
                    'height': sizes.totalHeight
                };

            if (this.settings.animate)
            {
                $body.animate(bodyCss, 250);
                $modal.animate(modalCss, 250, function ()
                {
                    $modal.trigger(Simple.Box.EVENT_RESIZE);
                });
            }
            else
            {
                $body.css(bodyCss);
                $modal.css(modalCss);
                $modal.trigger(Simple.Box.EVENT_RESIZE);

            }
        }

        private positionModalTo(modal, sizes)
        {
            modal.css({'margin-top': -(sizes.totalHeight / 2)});
        }

        private resizeAndPosition(modal)
        {
            // TODO: can be casted to SizeSettings interface if that is created.
            var sizeSettings:any = this.settings.size;
            var sizes = this.calculateSizesForModal(modal, sizeSettings);
            this.positionModalTo(modal, sizes);
            if (sizeSettings.min !== false || sizeSettings.max !== false)
            {
                this.resizeModalTo(modal, sizes);
            }
        }


        private calculateModalPartHeights(modal:JQuery)
        {
            var tmpModal = $('<div></div>');
            var content = modal.html();
            var header = 0,
                footer = 0,
                body = 0;
            content = content.replace(/(<script[\s\S]*?<\/script>)+/gi, '');

            tmpModal.addClass(modal.attr('class'));
            tmpModal.html(content);
            tmpModal.css({
                position: 'absolute',
                left: -3000
            });
            $('body').append(tmpModal);
            tmpModal.removeClass('hidden').show();
            body = tmpModal.find('.modal-body div:first').outerHeight();
            var $header = tmpModal.find('.modal-header'),
                $footer = tmpModal.find('.modal-footer');
            if ($header)
            {
                header = $header.outerHeight();
            }
            if ($footer)
            {
                footer = $footer.outerHeight();
            }
            tmpModal.remove();
            return {header: header, body: body, footer: footer};
        }
    }

    class CallbackHolder {
        private callbacks:any[] = [];

        public add(callback:()=>{})
        {
            this.callbacks.push(callback);
            return this.callbacks.length - 1;
        }

        public get(index:number):(e:Event,modal:any)=>{}
        {
            return this.callbacks[index];
        }
    }

    export interface Button
    {
        label:string;
        cssClass:string;
        callback:()=>{};
        icon:string;
    }

    export class Settings {
        public animate:Boolean = true;
        public startHidden:Boolean = false;

        public closeOnEscape:Boolean = false;
        public onEscape:any;

        public backdrop:any = 'static';

        public cssClass:string = "";

        public closeButton:Boolean = true;
        public closeButtonMarkup:string = "";

        public icons:{} = {};

        public size:{} = {
            min: false,
            max: false,
            content: true
        };

        public autoResize:Boolean = false;

        public preventScrolling:Boolean = true;
    }

    class SimpleBoxButton implements Button {
        public label:string = "";
        public cssClass:string = "";
        public callback:()=>{};
        public icon:string;

        constructor(label:string, callbackOrCssClass?:any, callback?:()=>{})
        {
            this.label = label;
            if (callbackOrCssClass)
            {
                if (typeof callbackOrCssClass == 'string')
                {
                    this.cssClass = callbackOrCssClass;
                }
                else if (typeof callbackOrCssClass == 'function')
                {
                    this.callback = callbackOrCssClass;
                }
            }
            if (callback)
            {
                this.callback = callback;
            }
        }
    }
}