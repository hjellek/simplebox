/**
 * The MIT License
 *
 * Copyright (C) 2011-2012 by Knut Eirik Leira Hjelle <knuteirik@leirahjelle.net>
 *
 * Based on bootbox by Nick Payne nick@kurai.co.uk (https://github.com/makeusabrew/simplebox)
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE
 */

var exports = this;
(function (window)
{
    "use strict";

    var _animate = true,
        _icons = {},
        modalOptions = {
            cssClass:"",
            backdrop:'static',
            hidden:  false,
            resize:  false
        },
        callbacks = [],
        handlers = [],
        that = {
            RESIZE:'simplebox.resize'
        };

    function createButtons(handlers)
    {
        if (handlers == null)
        {
            handlers = [];
        }
        else if (typeof handlers.length == 'undefined')
        {
            handlers = [handlers];
        }

        var buttons = "",
            i = handlers.length;
        while (i--)
        {
            var label = null,
                _class = null,
                icon = '',
                callback = null;

            if (typeof handlers[i]['label'] == 'undefined' &&
                typeof handlers[i]['class'] == 'undefined' &&
                typeof handlers[i]['callback'] == 'undefined')
            {
                var propCount = 0, // condensed will only match if this == 1
                    property = null;   // save the last property we found

                // be nicer to count the properties without this, but don't think it's possible...
                for (var j in handlers[i])
                {
                    property = j;
                    if (++propCount > 1)
                    {
                        break;
                    }
                }

                if (propCount == 1 && typeof handlers[i][j] == 'function')
                {
                    handlers[i]['label'] = property;
                    handlers[i]['callback'] = handlers[i][j];
                }
            }

            if (typeof handlers[i]['callback'] == 'function')
            {
                callback = handlers[i]['callback'];
            }

            if (handlers[i]['class'])
            {
                _class = handlers[i]['class'];
            }
            else if (i == handlers.length - 1 && handlers.length <= 2)
            {
                _class = 'btn-primary';
            }

            if (handlers[i]['label'])
            {
                label = handlers[i]['label'];
            }
            else
            {
                label = "Option " + (i + 1);
            }

            if (handlers[i]['icon'])
            {
                icon = "<i class='" + handlers[i]['icon'] + "'></i> ";
            }

            buttons += "<a data-handler='" + i + "' class='btn " + _class + "' href='#'>" + icon + "" + label + "</a>";

            callbacks[i] = callback;
        }
        return buttons;
    }

    function createHeaderAndCloseButton(options)
    {
        var shouldHaveCloseButton = typeof options['closeButton'] === 'undefined' || options['closeButton'] !== false,
            closeButton = "",
            html = "";
        if (options['header'])
        {
            if (shouldHaveCloseButton)
            {
                if (typeof options['closeButton'] == 'string')
                {
                    closeButton = options['closeButton'];
                }
                else
                {
                    closeButton = "<a href='#' class='close'>&times;</a>";
                }
            }

            var header = "";
            if (options['header'])
            {
                header = "<h3>" + options['header'] + "</h3>";
            }

            html = "<div class='modal-header'>" + closeButton + header + "</div>";
        }
        else if (shouldHaveCloseButton)
        {
            if (typeof options['closeButton'] == 'string')
            {
                closeButton = options['closeButton'];
            }
            else
            {
                closeButton = "<a href='#' class='close'></a>";
            }
            html = closeButton;
        }
        return html;
    }

    function getModalAreaSizes()
    {
        var tmpModal = $('<div></div>');
        var content = this.html();
        var header = 0,
            footer = 0,
            body = 0;
        content = content.replace(/(<script[\s\S]*?<\/script>)+/gi, '');

        tmpModal.addClass(this.attr('class'));
        tmpModal.html(content);
        tmpModal.css({
            position:'absolute',
            left:    -3000
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
        return {header:header, body:body, footer:footer};
    }

    function resize(options)
    {
        if (!options || typeof options !== 'object' || Object.keys(options).length === 0)
        {
            return;
        }

        var $body = this.find('.modal-body'),
            height = 0,
            viewHeight = $(window).innerHeight(),
            max = false,
            min = false,
            content = false,
            modalAreaSizes = getModalAreaSizes.apply(this),
            headerAndFooterOffset = modalAreaSizes.header + modalAreaSizes.footer;

        var padding = parseInt($body.css('padding-top'), 10) + parseInt($body.css('padding-bottom'), 10);
        if (options.content && options.content !== false)
        {
            content = options.content === true ? modalAreaSizes.body + 10 : options.content;
            height = content;
        }

        if (options.max && options.max !== false)
        {
            max = options.max === true ? parseInt(this.css('max-height'), 10) : options.max;
            if (max && (!content || content > max))
            {
                height = max;
            }
        }
        else if (!content)
        {
            height = viewHeight - 30;
        }

        if (height > viewHeight)
        {
            height = viewHeight - 30; // a bit offset
        }

        if (options.min && options.min !== false)
        {
            min = options.min === true ? parseInt(this.css('min-height'), 10) : options.min;
            if (height < min && min > viewHeight)
            {
                height = min - 30;
            }
            else if (height < min)
            {
                height = min;
            }
        }

        if (content && (height + (headerAndFooterOffset + padding) < viewHeight && (!max || content <= max)))
        {
            resizeModalTo(this, undefined, height + (headerAndFooterOffset + padding), height);
        }
        else
        {
            resizeModalTo(this, undefined, height, height - (headerAndFooterOffset + padding));
        }

    }

    function resizeModalTo($modal, width, height, bodyHeight)
    {
        var $body = $modal.find('.modal-body'),
            bodyCss = {
                'height':bodyHeight
            },
            modalCss = {
                'margin-top':-(height / 2),
                'height':    height
            };
        if (width)
        {
            bodyCss.width = width;
            modalCss.width = width;
        }

        if (_animate)
        {
            $body.animate(bodyCss, 250);
            $modal.animate(modalCss, 250, function ()
            {
                $modal.trigger(that.RESIZE);
            });
        }
        else
        {
            $body.css(bodyCss);
            $modal.css(modalCss);
            $modal.trigger(that.RESIZE);

        }
    }

    function backDropExists()
    {
        var b = $('.modal-backdrop');
        return $('.modal-backdrop').length !== 0;
    }

    function moveBackdropToModal(div)
    {
        var z = div.css('z-index') - 5;
        $('.modal-backdrop').css('z-index', z);
        $('body').addClass('modal-open');
    }

    function moveBackdropToPreviousModalOrRemove()
    {
        var modals = $('.modal');
        if (modals.length <= 0)
        {
            if (_animate)
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
            moveBackdropToModal(modals.last());
        }
    }

    that.setIcons = function (icons)
    {
        _icons = icons;
        if (typeof _icons !== 'object' || _icons == null)
        {
            _icons = {};
        }
    };

    that.modal = function (/*str, label, options*/)
    {
        var str,
            label,
            options = {},
            defaultOptions = {
                onEscape:null,
                keyboard:true,
                backdrop:true
            };

        switch (arguments.length)
        {
            case 1:
                str = arguments[0];
                break;
            case 2:
                str = arguments[0];
                if (typeof arguments[1] == 'object')
                {
                    options = arguments[1];
                }
                else
                {
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

        return that.renderModal(str, [], options);
    };

    that.renderModal = function (str, buttons, options)
    {
        var hideSource = null,
            buttonHtml = createButtons(buttons),
            options = options || {},
            cssClass,
            parts,
            modal,
            shouldFade;

        options = $.extend({}, modalOptions, options);

        cssClass = options['cssClass'] || "";
        shouldFade = (typeof options.animate === 'undefined') ? _animate : options.animate;

        parts = ["<div class='simplebox modal " + cssClass + "'>"];

        parts.push(createHeaderAndCloseButton(options));

        parts.push("<div class='modal-body'></div>");

        if (buttonHtml)
        {
            parts.push("<div class='modal-footer'>" + buttonHtml + "</div>")
        }

        parts.push("</div>");

        modal = $(parts.join("\n"));

        if (shouldFade)
        {
            modal.addClass("fade");
        }
        if (options.hidden)
        {
            modal.addClass('hidden');
        }

        $(".modal-body", modal).html(str);

        modal.bind('hidden', function ()
        {
            modal.remove();
        });

        modal.bind('hide', function ()
        {
            if (hideSource == 'escape' &&
                typeof options.onEscape == 'function')
            {
                options.onEscape();
            }
        });

        $(document).bind('keyup.modal', function (e)
        {
            if (e.which === 27)
            {
                hideSource = 'escape';
            }
        });

        modal.bind('shown', function ()
        {
            $("a.btn-primary:last", modal).focus();
        });

        $('.modal-footer a, a.close', modal).click(function (e)
        {
            e.preventDefault();
            hideSource = 'button';
            var handler = $(this).data("handler");
            var cb = callbacks[handler];
            if (typeof cb === 'function')
            {
                var returnValue = cb(modal,e);
                if(returnValue === true || typeof returnValue === 'undefined')
                {
                    modal.close();
                }
            }
            else
            {
                modal.close();
            }
        });

        if (options.keyboard == null)
        {
            options.keyboard = (typeof options.onEscape === 'function');
        }

        $("body").append(modal);

        var backdropAlreadyExists = backDropExists(),
            backdrop = (options.backdrop === 'static' || options.backdrop) && !backdropAlreadyExists ? options.backdrop : false;

        modal.modal({
            "backdrop":backdrop,
            "keyboard":options.keyboard
        });

        if (backdropAlreadyExists)
        {
            moveBackdropToModal(modal);
        }

        modal.close = function ()
        {
            this.bind('hidden', function ()
            {
                moveBackdropToPreviousModalOrRemove();
            });
            this.modal('hide');
        };

        modal.data('options', options);
        //modal = addFunctions(modal);

        modal.modalResize = function (options)
        {
            var allOptions = this.data('options') || {},
                params = allOptions.resize || {};
            options = options || {};
            $.extend(params, options);

            resize.call(modal, params);
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

        return modal;
    };

    that.loadContent = function (url, callback)
    {
        $.ajax({
            url:    url,
            success:callback
        });
    };

    that.hideAll = function ()
    {
        $(".simplebox").modal("hide");
    };

    that.animate = function (animate)
    {
        _animate = animate;
    };

    exports.simplebox = that;
}(window));
