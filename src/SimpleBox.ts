/**
 * User: hjellek
 * Date: 6/14/13
 * Time: 4:02 PM
 */
///<reference path='definitions/jquery.d.ts' />
///<reference path='SimpleBoxButton.ts' />
///<reference path='SimpleBoxBuilder.ts' />
///<reference path='SimpleBoxSettings.ts' />

class SimpleBox {
    public static ESCAPE_KEY = 27;
    public static HIDESOURCE_ESCAPE = 'escape';
    public static HIDESOURCE_BUTTON = 'button';
    public static EVENT_RESIZE = 'simplebox.resize';

    private callbackHolder = new CallbackHolder();
    private hideSource:String;
    private scrollPosition:Number;


    private header:String;
    private content:String;
    private buttons:SimpleBoxButton[];
    private settings:SimpleBoxSettings;

    constructor(header:String, content:String, buttons:SimpleBoxButton[], settings:SimpleBoxSettings) {
        this.header = header;
        this.content = content;
        this.buttons = buttons;
        this.settings = settings;
    }

    public static create(headerOrContent:String, contentOrButtons:String, buttonsOrSettings?:SimpleBoxButton[], settings?:SimpleBoxSettings):SimpleBox {
        var header,
            content,
            buttons,
            settingsMayhaps;

        if (contentOrButtons instanceof Array) {
            content = headerOrContent
        }
        else {
            header = headerOrContent;
            content = contentOrButtons;
        }
        if (buttonsOrSettings instanceof SimpleBoxSettings) {
            settingsMayhaps = buttonsOrSettings;
        }
        else {
            buttons = buttonsOrSettings;
            settingsMayhaps = settings;
        }
        return new SimpleBox(header, content, buttons, settingsMayhaps);
    }

    public static Builder():SimpleBoxBuilder
    {
        return new SimpleBoxBuilder();
    }

    private createButtonMarkup() {
        var markup = "",
            numberOfButtons = this.buttons.length;

        for (var i = 0; i < numberOfButtons; i++) {
            var button:SimpleBoxButton = this.buttons[i],
                iconMarkup = "",
                dataHandlerMarkup = "",
                cssClass = "",
                label = button.label;

            if (button.icon) {
                iconMarkup = "<i class='" + button.icon + "'></i> ";
            }
            if (button.callback) {
                var callbackIndex = this.callbackHolder.add(button.callback);
                dataHandlerMarkup = "data-handler='" + callbackIndex + "'";
            }
            if (button.cssClass) {
                cssClass = button.cssClass;
            }

            markup += "<a " + dataHandlerMarkup + " class='btn " + cssClass + "' href='#'>" + iconMarkup + "" + label + "</a>";
        }
        return markup
    }

    private createModalHeaderMarkup() {
        var closeButtonMarkup = "";
        if (this.settings.closeButton) {
            if (this.settings.closeButtonMarkup) {
                closeButtonMarkup = this.settings.closeButtonMarkup;
            }
            else {
                closeButtonMarkup = "<a href='#' class='close'>&times;</a>";
            }
        }
        return "<div class='modal-header'>" + closeButtonMarkup + "<h3>" + this.header + "</h3></div>";
    }

    private createModalCloseButton() {
        if (this.settings.closeButtonMarkup) {
            return this.settings.closeButtonMarkup;
        }
        return "<a href='#' class='close'></a>";
    }

    private backDropExists() {
        return $('.modal-backdrop').length !== 0;
    }

    private moveBackdropToModal(modal) {
        var z = modal.css('z-index') - 5;
        $('.modal-backdrop').css('z-index', z);
        $('body').addClass('modal-open');
    }

    private moveBackdropToPreviousModalOrRemove() {
        var modals = $('.modal');
        if (modals.length <= 0) {
            if (this.settings.animate) {
                $('.modal-backdrop').fadeOut(300, function () {
                    $('.modal-backdrop').remove();
                    $('body').removeClass('modal-open');
                });
            }
            else {
                $('.modal-backdrop').remove();
                $('body').removeClass('modal-open');
            }
        }
        else {
            this.moveBackdropToModal(modals.last());
        }
    }

    public setIcons(icons) {
        this.settings.icons = icons;
    }

    public static closeAll() {
        $(".simplebox").modal("hide");
    }

    private createModalMarkup() {
        var parts = [];
        parts.push("<div class='simplebox modal " + this.settings.cssClass + "'>");
        if (this.header) {
            parts.push(this.createModalHeaderMarkup());
        }
        else if (this.settings.closeButton) {
            parts.push(this.createModalCloseButton());
        }
        parts.push("<div class='modal-body'>" + this.content + "</div>");
        if (this.buttons.length > 0) {
            parts.push("<div class='modal-footer'>" + this.createButtonMarkup() + "</div>")
        }
        parts.push("</div>");
        return parts.join("\n");
    }

    private setupEvents(modal) {
        var self:SimpleBox = this;
        modal.bind('hidden', function () {
            modal.remove();
        });

        modal.bind('hide', function () {
            if (self.hideSource == SimpleBox.HIDESOURCE_ESCAPE &&
                typeof self.settings.onEscape == 'function') {
                self.settings.onEscape();
            }
            if (self.settings.preventScrolling) {

            }
        });

        $(document).bind('keyup.modal', function (e) {
            if (e.which === SimpleBox.ESCAPE_KEY) {
                self.hideSource = SimpleBox.HIDESOURCE_ESCAPE;
            }
        });

        modal.bind('shown', function () {
            $("a.btn-primary:last", modal).focus();
        });

        if (this.settings.preventScrolling) {
            modal.bind('show', function () {

            });
        }
    }

;

    public render() {
        var self:SimpleBox = this,
            modal = $(this.createModalMarkup());

        if (this.settings.animate) {
            modal.addClass("fade");
        }
        if (this.settings.startHidden) {
            modal.addClass('hidden');
        }

        this.setupEvents(modal);

        $('.modal-footer a, a.close', modal).click(function (e) {
            e.preventDefault();
            self.hideSource = SimpleBox.HIDESOURCE_BUTTON;
            var callback = self.callbackHolder.get($(this).data("handler"));
            if (callback) {
                if (callback(e, modal) !== false) {
                    modal.close();
                }
            }
            else {
                modal.close();
            }
        });

        if (!this.settings.closeOnEscape && this.settings.onEscape) {
            this.settings.closeOnEscape = true;
        }

        $("body").append(modal);

        var backdropAlreadyExists = this.backDropExists(),
            backdrop = (this.settings.backdrop === 'static' || this.settings.backdrop) && !backdropAlreadyExists ? this.settings.backdrop : false;

        modal.modal({
            "backdrop": backdrop,
            "keyboard": this.settings.closeOnEscape
        });

        if(this.settings.preventScrolling)
        {
            this.scrollPosition = $(window).scrollTop();
            $('body').css('margin-top', '-' + this.scrollPosition + 'px');
            modal.bind('hidden', function ()
            {
                $('body').css('margin-top', '');
                $(window).scrollTop(self.scrollPosition);
            });
        }

        if (backdropAlreadyExists) {
            this.moveBackdropToModal(modal);
        }

        this.createHelperFunctions(modal);

        return modal;
    }

    private createHelperFunctions(modal) {
        var self:SimpleBox = this;

        modal.close = function () {
            this.bind('hidden', function () {
                self.moveBackdropToPreviousModalOrRemove();
            });
            this.modal('hide');
        };

        modal.modalResize = function (options) {
            var settings = this.settings;
            $.extend(settings, options);

            self.resize(modal, settings);
        };

        modal.modalShow = function (fade) {
            this.hide();
            this.removeClass('hidden');
            if (fade) {
                var speed = parseInt(fade, 10) || 300;
                this.fadeIn(speed);
            }
            else {
                this.show();
            }
        };

        modal.modalPopulate = function (data, resize) {
            this.find('.modal-body').html(data);
            if (resize) {
                this.modalResize();
            }
        };
    }

    private resize(modal, options) {
        if (!options || typeof options !== 'object' || Object.keys(options).length === 0) {
            return;
        }

        var $body:JQuery = modal.find('.modal-body'),
            height:Number = 0,
            viewHeight:Number = $(window).innerHeight(),
            max:Number,
            min:Number,
            contentHeight:Number,
            modalAreaSizes = modal.getModalAreaSizes(),
            headerAndFooterOffset = modalAreaSizes.header + modalAreaSizes.footer;

        var padding = parseInt($body.css('padding-top'), 10) + parseInt($body.css('padding-bottom'), 10);
        if (options.content && options.content !== false) {
            contentHeight = options.content === true ? modalAreaSizes.body + 10 : options.content;
            height = contentHeight;
        }

        if (options.max && options.max !== false) {
            max = options.max === true ? parseInt(modal.css('max-height'), 10) : options.max;
            if (max && (!contentHeight || contentHeight > max)) {
                height = max;
            }
        }
        else if (!contentHeight) {
            height = viewHeight - 30;
        }

        if (height > viewHeight) {
            height = viewHeight - 30; // a bit offset
        }

        if (options.min && options.min !== false) {
            min = options.min === true ? parseInt(modal.css('min-height'), 10) : options.min;
            if (height < min && min > viewHeight) {
                height = min - 30;
            }
            else if (height < min) {
                height = min;
            }
        }

        if (contentHeight && (height + (headerAndFooterOffset + padding) < viewHeight && (!max || contentHeight <= max))) {
            this.resizeModalTo(this, undefined, height + (headerAndFooterOffset + padding), height);
        }
        else {
            this.resizeModalTo(this, undefined, height, height - (headerAndFooterOffset + padding));
        }

    }

    private resizeModalTo($modal, width, height, bodyHeight) {
        var $body = $modal.find('.modal-body'),
            bodyCss = {
                'height': bodyHeight
            },
            modalCss = {
                'margin-top': -(height / 2),
                'height': height
            };
        if (width) {
            bodyCss.width = width;
            modalCss.width = width;
        }

        if (this.sizeSettings.animate) {
            $body.animate(bodyCss, 250);
            $modal.animate(modalCss, 250, function () {
                $modal.trigger(SimpleBox.EVENT_RESIZE);
            });
        }
        else {
            $body.css(bodyCss);
            $modal.css(modalCss);
            $modal.trigger(SimpleBox.EVENT_RESIZE);

        }
    }


    private getModalAreaSizes() {
        var tmpModal = $('<div></div>');
        var content = this.html();
        var header = 0,
            footer = 0,
            body = 0;
        content = content.replace(/(<script[\s\S]*?<\/script>)+/gi, '');

        tmpModal.addClass(this.attr('class'));
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
        if ($header) {
            header = $header.outerHeight();
        }
        if ($footer) {
            footer = $footer.outerHeight();
        }
        tmpModal.remove();
        return {header: header, body: body, footer: footer};
    }
}

class CallbackHolder {
    private callbacks:any = [];

    public add(callback:()=>{}) {
        this.callbacks.push(callback);
        return this.callbacks.length;
    }

    public get(index:Number):()=>{} {
        return this.callbacks[index];
    }
}