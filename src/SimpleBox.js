var SimpleBox = (function () {
    function SimpleBox(header, content, buttons, settings) {
        this.callbackHolder = new CallbackHolder();
        this.header = header;
        this.content = content;
        this.buttons = buttons;
        this.settings = settings;
    }
    SimpleBox.ESCAPE_KEY = 27;
    SimpleBox.HIDESOURCE_ESCAPE = 'escape';
    SimpleBox.HIDESOURCE_BUTTON = 'button';
    SimpleBox.EVENT_RESIZE = 'simplebox.resize';
    SimpleBox.create = function create(headerOrContent, contentOrButtons, buttonsOrSettings, settings) {
        var header, content, buttons, settingsMayhaps;
        if(contentOrButtons instanceof Array) {
            content = headerOrContent;
        } else {
            header = headerOrContent;
            content = contentOrButtons;
        }
        if(buttonsOrSettings instanceof SimpleBoxSettings) {
            settingsMayhaps = buttonsOrSettings;
        } else {
            buttons = buttonsOrSettings;
            settingsMayhaps = settings;
        }
        return new SimpleBox(header, content, buttons, settingsMayhaps);
    };
    SimpleBox.Builder = function Builder() {
        return new SimpleBoxBuilder();
    };
    SimpleBox.prototype.createButtonMarkup = function () {
        var markup = "", numberOfButtons = this.buttons.length;
        for(var i = 0; i < numberOfButtons; i++) {
            var button = this.buttons[i], iconMarkup = "", dataHandlerMarkup = "", cssClass = "", label = button.label;
            if(button.icon) {
                iconMarkup = "<i class='" + button.icon + "'></i> ";
            }
            if(button.callback) {
                var callbackIndex = this.callbackHolder.add(button.callback);
                dataHandlerMarkup = "data-handler='" + callbackIndex + "'";
            }
            if(button.cssClass) {
                cssClass = button.cssClass;
            }
            markup += "<a " + dataHandlerMarkup + " class='btn " + cssClass + "' href='#'>" + iconMarkup + "" + label + "</a>";
        }
        return markup;
    };
    SimpleBox.prototype.createModalHeaderMarkup = function () {
        var closeButtonMarkup = "";
        if(this.settings.closeButton) {
            if(this.settings.closeButtonMarkup) {
                closeButtonMarkup = this.settings.closeButtonMarkup;
            } else {
                closeButtonMarkup = "<a href='#' class='close'>&times;</a>";
            }
        }
        return "<div class='modal-header'>" + closeButtonMarkup + "<h3>" + this.header + "</h3></div>";
    };
    SimpleBox.prototype.createModalCloseButton = function () {
        if(this.settings.closeButtonMarkup) {
            return this.settings.closeButtonMarkup;
        }
        return "<a href='#' class='close'></a>";
    };
    SimpleBox.prototype.backDropExists = function () {
        return $('.modal-backdrop').length !== 0;
    };
    SimpleBox.prototype.moveBackdropToModal = function (modal) {
        var z = modal.css('z-index') - 5;
        $('.modal-backdrop').css('z-index', z);
        $('body').addClass('modal-open');
    };
    SimpleBox.prototype.moveBackdropToPreviousModalOrRemove = function () {
        var modals = $('.modal');
        if(modals.length <= 0) {
            if(this.settings.animate) {
                $('.modal-backdrop').fadeOut(300, function () {
                    $('.modal-backdrop').remove();
                    $('body').removeClass('modal-open');
                });
            } else {
                $('.modal-backdrop').remove();
                $('body').removeClass('modal-open');
            }
        } else {
            this.moveBackdropToModal(modals.last());
        }
    };
    SimpleBox.prototype.setIcons = function (icons) {
        this.settings.icons = icons;
    };
    SimpleBox.closeAll = function closeAll() {
        $(".simplebox").modal("hide");
    };
    SimpleBox.prototype.createModalMarkup = function () {
        var parts = [];
        parts.push("<div class='simplebox modal " + this.settings.cssClass + "'>");
        if(this.header) {
            parts.push(this.createModalHeaderMarkup());
        } else if(this.settings.closeButton) {
            parts.push(this.createModalCloseButton());
        }
        parts.push("<div class='modal-body'>" + this.content + "</div>");
        if(this.buttons.length > 0) {
            parts.push("<div class='modal-footer'>" + this.createButtonMarkup() + "</div>");
        }
        parts.push("</div>");
        return parts.join("\n");
    };
    SimpleBox.prototype.setupEvents = function (modal) {
        var self = this;
        modal.bind('hidden', function () {
            modal.remove();
        });
        modal.bind('hide', function () {
            if(self.hideSource == SimpleBox.HIDESOURCE_ESCAPE && typeof self.settings.onEscape == 'function') {
                self.settings.onEscape();
            }
            if(self.settings.preventScrolling) {
            }
        });
        $(document).bind('keyup.modal', function (e) {
            if(e.which === SimpleBox.ESCAPE_KEY) {
                self.hideSource = SimpleBox.HIDESOURCE_ESCAPE;
            }
        });
        modal.bind('shown', function () {
            $("a.btn-primary:last", modal).focus();
        });
        if(this.settings.preventScrolling) {
            modal.bind('show', function () {
            });
        }
    };
    SimpleBox.prototype.render = function () {
        var self = this, modal = $(this.createModalMarkup());
        if(this.settings.animate) {
            modal.addClass("fade");
        }
        if(this.settings.startHidden) {
            modal.addClass('hidden');
        }
        this.setupEvents(modal);
        $('.modal-footer a, a.close', modal).click(function (e) {
            e.preventDefault();
            self.hideSource = SimpleBox.HIDESOURCE_BUTTON;
            var callback = self.callbackHolder.get($(this).data("handler"));
            if(callback) {
                if(callback(e, modal) !== false) {
                    modal.close();
                }
            } else {
                modal.close();
            }
        });
        if(!this.settings.closeOnEscape && this.settings.onEscape) {
            this.settings.closeOnEscape = true;
        }
        $("body").append(modal);
        var backdropAlreadyExists = this.backDropExists(), backdrop = (this.settings.backdrop === 'static' || this.settings.backdrop) && !backdropAlreadyExists ? this.settings.backdrop : false;
        modal.modal({
            "backdrop": backdrop,
            "keyboard": this.settings.closeOnEscape
        });
        if(backdropAlreadyExists) {
            this.moveBackdropToModal(modal);
        }
        this.createHelperFunctions(modal);
        return modal;
    };
    SimpleBox.prototype.createHelperFunctions = function (modal) {
        var self = this;
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
            if(fade) {
                var speed = parseInt(fade, 10) || 300;
                this.fadeIn(speed);
            } else {
                this.show();
            }
        };
        modal.modalPopulate = function (data, resize) {
            this.find('.modal-body').html(data);
            if(resize) {
                this.modalResize();
            }
        };
    };
    SimpleBox.prototype.resize = function (modal, options) {
        if(!options || typeof options !== 'object' || Object.keys(options).length === 0) {
            return;
        }
        var $body = modal.find('.modal-body'), height = 0, viewHeight = $(window).innerHeight(), max, min, contentHeight, modalAreaSizes = modal.getModalAreaSizes(), headerAndFooterOffset = modalAreaSizes.header + modalAreaSizes.footer;
        var padding = parseInt($body.css('padding-top'), 10) + parseInt($body.css('padding-bottom'), 10);
        if(options.content && options.content !== false) {
            contentHeight = options.content === true ? modalAreaSizes.body + 10 : options.content;
            height = contentHeight;
        }
        if(options.max && options.max !== false) {
            max = options.max === true ? parseInt(modal.css('max-height'), 10) : options.max;
            if(max && (!contentHeight || contentHeight > max)) {
                height = max;
            }
        } else if(!contentHeight) {
            height = viewHeight - 30;
        }
        if(height > viewHeight) {
            height = viewHeight - 30;
        }
        if(options.min && options.min !== false) {
            min = options.min === true ? parseInt(modal.css('min-height'), 10) : options.min;
            if(height < min && min > viewHeight) {
                height = min - 30;
            } else if(height < min) {
                height = min;
            }
        }
        if(contentHeight && (height + (headerAndFooterOffset + padding) < viewHeight && (!max || contentHeight <= max))) {
            this.resizeModalTo(this, undefined, height + (headerAndFooterOffset + padding), height);
        } else {
            this.resizeModalTo(this, undefined, height, height - (headerAndFooterOffset + padding));
        }
    };
    SimpleBox.prototype.resizeModalTo = function ($modal, width, height, bodyHeight) {
        var $body = $modal.find('.modal-body'), bodyCss = {
            'height': bodyHeight
        }, modalCss = {
            'margin-top': -(height / 2),
            'height': height
        };
        if(width) {
            bodyCss.width = width;
            modalCss.width = width;
        }
        if(this.sizeSettings.animate) {
            $body.animate(bodyCss, 250);
            $modal.animate(modalCss, 250, function () {
                $modal.trigger(SimpleBox.EVENT_RESIZE);
            });
        } else {
            $body.css(bodyCss);
            $modal.css(modalCss);
            $modal.trigger(SimpleBox.EVENT_RESIZE);
        }
    };
    SimpleBox.prototype.getModalAreaSizes = function () {
        var tmpModal = $('<div></div>');
        var content = this.html();
        var header = 0, footer = 0, body = 0;
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
        var $header = tmpModal.find('.modal-header'), $footer = tmpModal.find('.modal-footer');
        if($header) {
            header = $header.outerHeight();
        }
        if($footer) {
            footer = $footer.outerHeight();
        }
        tmpModal.remove();
        return {
            header: header,
            body: body,
            footer: footer
        };
    };
    return SimpleBox;
})();
var CallbackHolder = (function () {
    function CallbackHolder() {
        this.callbacks = [];
    }
    CallbackHolder.prototype.add = function (callback) {
        this.callbacks.push(callback);
        return this.callbacks.length;
    };
    CallbackHolder.prototype.get = function (index) {
        return this.callbacks[index];
    };
    return CallbackHolder;
})();
//@ sourceMappingURL=SimpleBox.js.map
