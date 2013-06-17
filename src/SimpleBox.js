var Simple;
(function (Simple) {
    var Box = (function () {
        function Box(header, content, buttons, settings) {
            this.callbackHolder = new CallbackHolder();
            this.header = header;
            this.content = content;
            this.buttons = buttons;
            this.settings = settings;
        }
        Box.ESCAPE_KEY = 27;
        Box.HIDESOURCE_ESCAPE = 'escape';
        Box.HIDESOURCE_BUTTON = 'button';
        Box.EVENT_RESIZE = 'simplebox.resize';
        Box.create = function create(headerOrContent, contentOrButtons, buttonsOrSettings, settings) {
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
            return new Simple.Box(header, content, buttons, settingsMayhaps);
        };
        Box.Builder = function Builder() {
            return new SimpleBoxBuilder();
        };
        Box.prototype.createButtonMarkup = function () {
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
        Box.prototype.createModalHeaderMarkup = function () {
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
        Box.prototype.createModalCloseButton = function () {
            if(this.settings.closeButtonMarkup) {
                return this.settings.closeButtonMarkup;
            }
            return "<a href='#' class='close'></a>";
        };
        Box.prototype.backDropExists = function () {
            return $('.modal-backdrop').length !== 0;
        };
        Box.prototype.moveBackdropToModal = function (modal) {
            var z = modal.css('z-index') - 5;
            $('.modal-backdrop').css('z-index', z);
            $('body').addClass('modal-open');
        };
        Box.prototype.moveBackdropToPreviousModalOrRemove = function () {
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
        Box.prototype.setIcons = function (icons) {
            this.settings.icons = icons;
        };
        Box.closeAll = function closeAll() {
            $(".simplebox").modal("hide");
        };
        Box.prototype.createModalMarkup = function () {
            var parts = [];
            parts.push("<div class='simplebox modal " + this.settings.cssClass + "'>");
            if(this.header) {
                parts.push(this.createModalHeaderMarkup());
            } else if(this.settings.closeButton) {
                parts.push(this.createModalCloseButton());
            }
            parts.push("<div class='modal-body'><div>" + this.content + "</div></div>");
            if(this.buttons.length > 0) {
                parts.push("<div class='modal-footer'>" + this.createButtonMarkup() + "</div>");
            }
            parts.push("</div>");
            return parts.join("\n");
        };
        Box.prototype.setupEvents = function (modal) {
            var self = this, DOMBody = $('body'), resizeModalOnWindowResize, $window = $(window);
            modal.bind('hidden', function () {
                modal.remove();
                if(self.settings.preventScrolling) {
                    DOMBody.css('margin-top', '');
                    DOMBody.removeClass('simplebox-open');
                    $window.scrollTop(self.scrollPosition);
                }
            });
            $('.modal-footer a, a.close', modal).click(function (e) {
                e.preventDefault();
                self.hideSource = Simple.Box.HIDESOURCE_BUTTON;
                var callback = self.callbackHolder.get($(this).data("handler"));
                if(callback) {
                    if(callback(e, modal) !== false) {
                        modal.close();
                    }
                } else {
                    modal.close();
                }
            });
            if(this.settings.autoResize) {
                var resizeTimer;
                resizeModalOnWindowResize = function () {
                    if(resizeTimer) {
                        clearTimeout(resizeTimer);
                    }
                    resizeTimer = setTimeout(function () {
                        self.resizeAndPosition(modal);
                    }, 100);
                };
                $window.bind('resize', resizeModalOnWindowResize);
            }
            modal.bind('hide', function () {
                if(self.hideSource == Simple.Box.HIDESOURCE_ESCAPE && typeof self.settings.onEscape == 'function') {
                    self.settings.onEscape();
                }
                if(self.settings.preventScrolling) {
                }
                if(self.settings.autoResize) {
                    $window.unbind('resize', resizeModalOnWindowResize);
                }
            });
            $(document).bind('keyup.modal', function (e) {
                if(e.which === Simple.Box.ESCAPE_KEY) {
                    self.hideSource = Simple.Box.HIDESOURCE_ESCAPE;
                }
            });
            modal.bind('shown', function () {
                $("a.btn-primary:last", modal).focus();
            });
            if(this.settings.preventScrolling) {
                modal.bind('show', function () {
                    self.scrollPosition = $(window).scrollTop();
                    console.log('scrollpos', self.scrollPosition);
                    DOMBody.css('margin-top', '-' + self.scrollPosition + 'px');
                    DOMBody.addClass('simplebox-open');
                });
            }
        };
        Box.prototype.render = function () {
            var self = this, modal = $(this.createModalMarkup()), DOMBody = $('body');
            if(this.settings.animate) {
                modal.addClass("fade");
            }
            if(this.settings.startHidden) {
                modal.addClass('hidden');
            }
            this.setupEvents(modal);
            if(!this.settings.closeOnEscape && this.settings.onEscape) {
                this.settings.closeOnEscape = true;
            }
            DOMBody.append(modal);
            var backdropAlreadyExists = this.backDropExists(), backdrop = (this.settings.backdrop === 'static' || this.settings.backdrop) && !backdropAlreadyExists ? this.settings.backdrop : false;
            modal.modal({
                "backdrop": backdrop,
                "keyboard": this.settings.closeOnEscape
            });
            if(backdropAlreadyExists) {
                this.moveBackdropToModal(modal);
            }
            this.createHelperFunctions(modal);
            this.resizeAndPosition(modal);
            return modal;
        };
        Box.prototype.createHelperFunctions = function (modal) {
            var self = this;
            modal.close = function () {
                this.bind('hidden', function () {
                    self.moveBackdropToPreviousModalOrRemove();
                });
                this.modal('hide');
            };
            modal.modalResize = function (options) {
                options = options || {
                };
                var settings = self.settings.size;
                $.extend(settings, options);
                console.log('modalResize', settings, options);
                var sizes = self.calculateSizesForModal(modal, settings);
                self.resizeModalTo(modal, sizes);
                self.positionModalTo(modal, sizes);
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
        Box.prototype.calculateSizesForModal = function (modal, options) {
            console.log('resize', options);
            var $body = modal.find('.modal-body'), height = 0, viewHeight = $(window).innerHeight(), max, min, contentHeight, modalAreaSizes = this.calculateModalPartHeights(modal), headerAndFooterOffset = modalAreaSizes.header + modalAreaSizes.footer;
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
            var modalSize = {
                totalHeight: 0,
                contentHeight: 0
            };
            if(contentHeight && (height + (headerAndFooterOffset + padding) < viewHeight && (!max || contentHeight <= max))) {
                modalSize.totalHeight = height + (headerAndFooterOffset + padding);
                modalSize.contentHeight = height;
            } else {
                modalSize.totalHeight = height;
                modalSize.contentHeight = height - (headerAndFooterOffset + padding);
            }
            console.log('Calculated size: ', modalSize);
            return modalSize;
        };
        Box.prototype.resizeModalTo = function ($modal, sizes) {
            console.log('resizeModalTo', sizes.totalHeight, sizes.contentHeight);
            var $body = $modal.find('.modal-body'), bodyCss = {
                'height': sizes.contentHeight
            }, modalCss = {
                'height': sizes.totalHeight
            };
            if(this.settings.animate) {
                $body.animate(bodyCss, 250);
                $modal.animate(modalCss, 250, function () {
                    $modal.trigger(Simple.Box.EVENT_RESIZE);
                });
            } else {
                $body.css(bodyCss);
                $modal.css(modalCss);
                $modal.trigger(Simple.Box.EVENT_RESIZE);
            }
        };
        Box.prototype.positionModalTo = function (modal, sizes) {
            console.log('resizeModalTo', sizes.totalHeight, sizes.contentHeight);
            modal.css({
                'margin-top': -(sizes.totalHeight / 2)
            });
        };
        Box.prototype.resizeAndPosition = function (modal) {
            var sizeSettings = this.settings.size;
            var sizes = this.calculateSizesForModal(modal, sizeSettings);
            this.positionModalTo(modal, sizes);
            if(sizeSettings.min !== false || sizeSettings.max !== false) {
                this.resizeModalTo(modal, sizes);
            }
        };
        Box.prototype.calculateModalPartHeights = function (modal) {
            var tmpModal = $('<div></div>');
            var content = modal.html();
            var header = 0, footer = 0, body = 0;
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
            var $header = tmpModal.find('.modal-header'), $footer = tmpModal.find('.modal-footer');
            if($header) {
                header = $header.outerHeight();
            }
            if($footer) {
                footer = $footer.outerHeight();
            }
            tmpModal.remove();
            console.log('modalAreaSizes', {
                header: header,
                body: body,
                footer: footer
            });
            return {
                header: header,
                body: body,
                footer: footer
            };
        };
        return Box;
    })();
    Simple.Box = Box;    
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
    var SimpleBoxSettings = (function () {
        function SimpleBoxSettings() {
            this.animate = true;
            this.startHidden = false;
            this.closeOnEscape = false;
            this.backdrop = 'static';
            this.cssClass = "";
            this.closeButton = true;
            this.closeButtonMarkup = "";
            this.icons = {
            };
            this.size = {
                min: false,
                max: false,
                content: true
            };
            this.autoResize = false;
            this.preventScrolling = true;
        }
        return SimpleBoxSettings;
    })();    
    var SimpleBoxButton = (function () {
        function SimpleBoxButton(label, callbackOrCssClass, callback) {
            this.label = "";
            this.cssClass = "";
            this.label = label;
            if(callbackOrCssClass) {
                if(typeof callbackOrCssClass == 'string') {
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
        SimpleBoxBuilder.prototype.setSetting = function (attribute, value) {
            this.settings[attribute] = value;
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
            return new Simple.Box(this.header, this.content, this.buttons, this.settings).render();
        };
        return SimpleBoxBuilder;
    })();    
})(Simple || (Simple = {}));
//@ sourceMappingURL=SimpleBox.js.map
