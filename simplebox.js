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

var simplebox = window.simplebox || (function ()
{

    var _animate = true,
        _icons = {},
        that = {};

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
        var str;
        var label;
        var options;

        var defaultOptions = {
            "onEscape":null,
            "keyboard":true,
            "backdrop":true
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
                } else
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

        defaultOptions['header'] = label;

        if (typeof options == 'object')
        {
            options = $.extend(defaultOptions, options);
        } else
        {
            options = defaultOptions;
        }

        return that.dialog(str, [], options);
    };

    that.dialog = function (str, handlers, options)
    {
        var hideSource = null,
            buttons = "",
            callbacks = [],
            options = options || {};

        if (handlers == null)
        {
            handlers = [];
        } else if (typeof handlers.length == 'undefined')
        {
            handlers = [handlers];
        }

        var i = handlers.length;
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
            } else if (i == handlers.length - 1 && handlers.length <= 2)
            {
                _class = 'btn-primary';
            }

            if (handlers[i]['label'])
            {
                label = handlers[i]['label'];
            } else
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

        var parts = ["<div class='simplebox modal'>"],
            shouldHaveCloseButton = typeof options['closeButton'] === 'undefined' || options['closeButton'] !== false,
            closeButton = "";
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

            parts.push("<div class='modal-header'>" + closeButton + header + "</div>");
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
            parts.push(closeButton);
        }

        parts.push("<div class='modal-body'></div>");

        if (buttons)
        {
            parts.push("<div class='modal-footer'>" + buttons + "</div>")
        }

        parts.push("</div>");

        var div = $(parts.join("\n"));

        var shouldFade = (typeof options.animate === 'undefined') ? _animate : options.animate;

        if (shouldFade)
        {
            div.addClass("fade");
        }

        $(".modal-body", div).html(str);

        div.bind('hidden', function ()
        {
            div.remove();
        });

        div.bind('hide', function ()
        {
            if (hideSource == 'escape' &&
                typeof options.onEscape == 'function')
            {
                options.onEscape();
            }
        });

        $(document).bind('keyup.modal', function (e)
        {
            if (e.which == 27)
            {
                hideSource = 'escape';
            }
        });

        div.bind('shown', function ()
        {
            $("a.btn-primary:last", div).focus();
        });

        $('.modal-footer a, a.close', div).click(function (e)
        {
            e.preventDefault();
            hideSource = 'button';
            div.modal("hide");
            var handler = $(this).data("handler");
            var cb = callbacks[handler];
            if (typeof cb == 'function')
            {
                cb();
            }
        });

        if (options.keyboard == null)
        {
            options.keyboard = (typeof options.onEscape == 'function');
        }

        $("body").append(div);

        div.modal({
            "backdrop":options.backdrop || true,
            "keyboard":options.keyboard
        });

        return div;
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

    return that;
})();
