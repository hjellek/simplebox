/**
 * User: hjellek
 * Date: 6/14/13
 * Time: 4:02 PM
 */
///<reference path='definitions/jquery.d.ts' />
export class SimpleBox {
    _animate = true;
    _icons = {};
    dialogOptions = {
        cssClass: "",
        backdrop: 'static'
    };
    callbacks = [];
    handlers = [];
    that = {};

    constructor() {

    }

    public modal(/*str, label, options*/) {
        var str,
            label,
            options = {},
            defaultOptions = {
                onEscape: null,
                keyboard: true,
                backdrop: true
            };

        switch (arguments.length) {
            case 1:
                str = arguments[0];
                break;
            case 2:
                str = arguments[0];
                if (typeof arguments[1] == 'object') {
                    options = arguments[1];
                } else {
                    label = arguments[1];
                }
                break;
            case 3:
                str = arguments[0];
                label = arguments[1];
                options = arguments[2];
                break;
            default:
                throw new Error("Incorrect number of arguments: expected 1-3");
                break;
        }

        options['header'] = label;
        options = $.extend(defaultOptions, options);

        return this.renderModal(str, [], options);
    }

    public renderModal(str, buttons, options) {
        var hideSource = null,
            buttonHtml = this.createButtons(buttons),
            options = options || {},
            cssClass,
            parts,
            modal,
            shouldFade;

        options = $.extend(this.dialogOptions, options);

        cssClass = options['cssClass'] || "";
        shouldFade = (typeof options.animate === 'undefined') ? this._animate : options.animate;

        parts = ["<div class='simplebox modal " + cssClass + "'>"];

        parts.push(this.createHeaderAndCloseButton(options));

        parts.push("<div class='modal-body'></div>");

        if (buttonHtml) {
            parts.push("<div class='modal-footer'>" + buttonHtml + "</div>")
        }

        parts.push("</div>");

        modal = $(parts.join("\n"));

        if (shouldFade) {
            modal.addClass("fade");
        }

        $(".modal-body", modal).html(str);

        modal.bind('hidden', function () {
            modal.remove();
        });

        modal.bind('hide', function () {
            if (hideSource == 'escape' &&
                typeof options.onEscape == 'function') {
                options.onEscape();
            }
        });

        $(document).bind('keyup.modal', function (e) {
            if (e.which === 27) {
                hideSource = 'escape';
            }
        });

        modal.bind('shown', function () {
            $("a.btn-primary:last", modal).focus();
        });

        $('.modal-footer a, a.close', modal).click(function (e) {
            e.preventDefault();
            hideSource = 'button';
            modal.modal("hide");
            var handler = $(this).data("handler");
            var cb = this.callbacks[handler];
            if (typeof cb === 'function') {
                cb();
            }
        });

        if (options.keyboard == null) {
            options.keyboard = (typeof options.onEscape === 'function');
        }

        $("body").append(modal);

        var backdropAlreadyExists = this.backDropExists(),
            backdrop = (options.backdrop === 'static' || options.backdrop) && !backdropAlreadyExists ? options.backdrop : false;

        modal.modal({
            "backdrop": backdrop,
            "keyboard": options.keyboard
        });

        if (backdropAlreadyExists) {
            this.moveBackdropToModal(modal);
        }

        modal.close = function () {
            var self:SimpleBox = this;
            this.bind('hidden', function () {
                self.moveBackdropToPreviousModalOrRemove();
            });
            this.modal('hide');
        };
        modal = this.addFunctions(modal);
        return modal;
    }

    public hideAll() {
        $(".simplebox").modal("hide");
    }

    public animate(bool) {
        this._animate = bool;
    }


    private createButtons(handlers) {
        if (handlers == null) {
            handlers = [];
        } else if (typeof handlers.length == 'undefined') {
            handlers = [handlers];
        }

        var buttons = "",
            i = handlers.length;
        while (i--) {
            var label = null,
                _class = null,
                icon = '',
                callback = null;

            if (typeof handlers[i]['label'] == 'undefined' &&
                typeof handlers[i]['class'] == 'undefined' &&
                typeof handlers[i]['callback'] == 'undefined') {
                var propCount = 0, // condensed will only match if this == 1
                    property = null;   // save the last property we found

                // be nicer to count the properties without this, but don't think it's possible...
                for (var j in handlers[i]) {
                    property = j;
                    if (++propCount > 1) {
                        break;
                    }
                }

                if (propCount == 1 && typeof handlers[i][j] == 'function') {
                    handlers[i]['label'] = property;
                    handlers[i]['callback'] = handlers[i][j];
                }
            }

            if (typeof handlers[i]['callback'] == 'function') {
                callback = handlers[i]['callback'];
            }

            if (handlers[i]['class']) {
                _class = handlers[i]['class'];
            } else if (i == handlers.length - 1 && handlers.length <= 2) {
                _class = 'btn-primary';
            }

            if (handlers[i]['label']) {
                label = handlers[i]['label'];
            } else {
                label = "Option " + (i + 1);
            }

            if (handlers[i]['icon']) {
                icon = "<i class='" + handlers[i]['icon'] + "'></i> ";
            }

            buttons += "<a data-handler='" + i + "' class='btn " + _class + "' href='#'>" + icon + "" + label + "</a>";

            this.callbacks[i] = callback;
        }
        return buttons;
    }

    private createHeaderAndCloseButton(options) {
        var shouldHaveCloseButton = typeof options['closeButton'] === 'undefined' || options['closeButton'] !== false,
            closeButton = "",
            html = "";
        if (options['header']) {
            if (shouldHaveCloseButton) {
                if (typeof options['closeButton'] == 'string') {
                    closeButton = options['closeButton'];
                }
                else {
                    closeButton = "<a href='#' class='close'>&times;</a>";
                }
            }

            var header = "";
            if (options['header']) {
                header = "<h3>" + options['header'] + "</h3>";
            }

            html = "<div class='modal-header'>" + closeButton + header + "</div>";
        }
        else if (shouldHaveCloseButton) {
            if (typeof options['closeButton'] == 'string') {
                closeButton = options['closeButton'];
            }
            else {
                closeButton = "<a href='#' class='close'></a>";
            }
            html = closeButton;
        }
        return html;
    }

    private fitToContent(options) {
        var contentHeight = this.find('.modal-body :first').outerHeight();
        this.calculateHeightAndResize(contentHeight, options);
    }

    private autoFit(options) {
        var timer,
            modal = this,
            options = options || {},
            delay = options.delay || 100;
        $(window).bind('resize', function () {
            clearTimeout(timer);
            timer = setTimeout(function () {
                modal.fitToContent(options);
            }, delay);
        });
    }

    replaceAndFitToContent(content) {
        var contentHeight = calculateContentHeight.apply(this, content);
        calculateHeightAndResize(this, contentHeight);
        this.find('.modal-body').html(content);
    }

    private calculateHeightAndResize($modal, contentHeight, options) {
        var $header = $modal.find('.modal-header'),
            $footer = $modal.find('.modal-footer'),
            height,
            viewHeight = $(window).innerHeight(),
            headerAndFooterOffset = 30, // padding in body
            options = options || {},
            minHeight = options.minHeight || parseInt($modal.css('min-height'), 10),
            maxHeight = options.maxHeight || parseInt($modal.css('max-height'), 10);

        if ($header) {
            headerAndFooterOffset += $header.outerHeight();
        }

        if ($footer) {
            headerAndFooterOffset += $footer.outerHeight();
        }

        height = contentHeight + headerAndFooterOffset;

        if (!isNaN(minHeight) && height < minHeight) {
            height = minHeight;
        }
        if (height > viewHeight) {
            height = viewHeight - 30;
            contentHeight = height - headerAndFooterOffset;
        }
        if (!isNaN(maxHeight) && height > maxHeight) {
            height = maxHeight;
            contentHeight = maxHeight - headerAndFooterOffset;
        }

        this.resizeModalTo($modal, undefined, height, contentHeight);
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
        $body.css(bodyCss);
        $modal.css(modalCss);
    }

    private calculateContentHeight(content) {
        var contentContainer = $('<div id="simplebox-content" class="simplebox modal"><div class="modal-body"></div></div>'),
            modalBody,
            height,
            content = content.replace(/<script[\s\S]*<\/script>/gi, ''),
            width = 800;
        contentContainer.css({width: width, position: 'absolute', left: -3000});
        $('body').append(contentContainer);
        modalBody = $('#simplebox-content').find('.modal-body');
        modalBody.append(content);
        height = modalBody.find(':first').outerHeight();
        contentContainer.remove();
        return height;
    }

    private addFunctions(modal) {
        modal.fitToContent = fitToContent;
        modal.autoFit = autoFit;
        modal.replaceAndFitToContent = replaceAndFitToContent;
        return modal;
    }

    private backDropExists() {
        var b = $('.modal-backdrop');
        console.log(b, 'isempty', b.length === 0);
        return $('.modal-backdrop').length !== 0;
    }

    private moveBackdropToModal(div) {
        var z = div.css('z-index') - 5;
        console.log('Preparing backdrop z-index shift to ', z);
        $('.modal-backdrop').css('z-index', z);
    }

    private moveBackdropToPreviousModalOrRemove() {
        var modals = $('.modal');
        if (modals.length <= 0) {
            if (this._animate) {
                $('.modal-backdrop').fadeOut(300, function () {
                    $('.modal-backdrop').remove();
                });
            }
            else {
                $('.modal-backdrop').remove();
            }
        }
        else {
            this.moveBackdropToModal(modals.last());
        }
    }

    public setIcons(icons) {
        this._icons = icons;
        if (typeof this._icons !== 'object' || this._icons == null) {
            this._icons = {};
        }
    }

    private loadContent(url, callback) {
        $.ajax({
            url: url,
            success: callback
        });
    }
}