/*
 * Copyright (c) 2010 iceScrum Technologies.
 *
 * This file is part of iceScrum.
 *
 * iceScrum is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License.
 *
 * iceScrum is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with iceScrum.  If not, see <http://www.gnu.org/licenses/>.
 *
 */

(function($) {

    $.widget("ui.selectmenu", {
                _init: function() {
                    var self = this, o = this.options;

                    this.container = (o.container == undefined) ? 'body' : o.container;

                    if (this.element.attr('id').indexOf('.') != -1) {
                        this.element.attr('id', this.element.attr('id').replace(/\./g, '_'));
                    }

                    //quick array of button and menu id's
                    this.ids = [this.element.attr('id') + '-' + 'button', this.element.attr('id') + '-' + 'menu'];

                    //if already created do nothing
                    if ($('#' + this.element.attr('id') + '-' + 'button').length) {
                        return;
                    }

                    //define safe mouseup for future toggling
                    this._safemouseup = true;

                    //create menu button wrapper
                    this.newelement = $('<a class="' + this.widgetBaseClass + ' ui-widget ui-state-default ui-corner-all" id="' + this.ids[0] + '" role="button" href="#" aria-haspopup="true" aria-owns="' + this.ids[1] + '"></a>')
                            .insertAfter(this.element);

                    //transfer tabindex
                    var tabindex = this.element.attr('tabindex');
                    if (tabindex) {
                        this.newelement.attr('tabindex', tabindex);
                    }

                    //save reference to select in data for ease in calling methods
                    this.newelement.data('selectelement', this.element);

                    //menu icon
                    this.selectmenuIcon = $('<span class="' + this.widgetBaseClass + '-icon ui-icon"></span>')
                            .prependTo(this.newelement)
                            .addClass((o.style == "popup") ? 'ui-icon-triangle-2-n-s' : 'ui-icon-triangle-1-s');


                    //make associated form label trigger focus
                    $('label[for=' + this.element.attr('id') + ']')
                            .attr('for', this.ids[0])
                            .bind('click', function() {
                                self.newelement[0].focus();
                                return false;
                            });

                    //click toggle for menu visibility
                    this.newelement
                            .bind('mousedown', function(event) {
                        self._toggle(event);
                        //make sure a click won't open/close instantly
                        if (o.style == "popup") {
                            self._safemouseup = false;
                            setTimeout(function() {
                                self._safemouseup = true;
                            }, 300);
                        }
                        return false;
                    })
                            .bind('click', function() {
                                return false;
                            })
                            .keydown(function(event) {
                                var ret = true;
                                switch (event.keyCode) {
                                    case $.ui.keyCode.ENTER:
                                        ret = true;
                                        break;
                                    case $.ui.keyCode.SPACE:
                                        ret = false;
                                        self._toggle(event);
                                        break;
                                    case $.ui.keyCode.UP:
                                    case $.ui.keyCode.LEFT:
                                        ret = false;
                                        self._moveSelection(-1);
                                        break;
                                    case $.ui.keyCode.DOWN:
                                    case $.ui.keyCode.RIGHT:
                                        ret = false;
                                        self._moveSelection(1);
                                        break;
                                    case $.ui.keyCode.TAB:
                                        ret = true;
                                        break;
                                    default:
                                        ret = false;
                                        self._typeAhead(event.keyCode, 'mouseup');
                                        break;
                                }
                                return ret;
                            })
                            .bind('mouseover focus', function() {
                                $(this).addClass(self.widgetBaseClass + '-focus ui-state-hover');
                            })
                            .bind('mouseout blur', function() {
                                $(this).removeClass(self.widgetBaseClass + '-focus ui-state-hover');
                            });

                    //document click closes menu
                    $(document)
                            .mousedown(function(event) {
                                self.close(event);
                            });

                    //change event on original selectmenu
                    this.element
                            .click(function() {
                        this._refreshValue();
                    })
                            .focus(function() {
                                this.newelement[0].focus();
                            });

                    //create menu portion, append to body
                    var cornerClass = (o.style == "dropdown") ? " ui-corner-bottom" : " ui-corner-all"

                    this.list = $('<ul class="' + self.widgetBaseClass + '-menu ui-widget ui-widget-content' + cornerClass + '" aria-hidden="true" role="listbox" aria-labelledby="' + this.ids[0] + '" id="' + this.ids[1] + '"></ul>').appendTo(this.container);

                    //serialize selectmenu element options
                    var selectOptionData = [];
                    this.element
                            .find('option')
                            .each(function() {
                                selectOptionData.push({
                                            value: $(this).attr('value'),
                                            text: self._formatText(jQuery(this).text()),
                                            selected: $(this).attr('selected'),
                                            classes: $(this).attr('class'),
                                            parentOptGroup: $(this).parent('optgroup').attr('label')
                                        });
                            });

                    //active state class is only used in popup style
                    var activeClass = (self.options.style == "popup") ? " ui-state-active" : "";

                    //write li's
                    for (var i in selectOptionData) {
                        if (!$.isFunction(selectOptionData[i])) {
                            var thisLi = $('<li role="presentation"><a href="#" tabindex="-1" role="option" aria-selected="false">' + selectOptionData[i].text + '</a></li>')
                                    .data('index', i)
                                    .addClass(selectOptionData[i].classes)
                                    .data('optionClasses', selectOptionData[i].classes || '')
                                    .mouseup(function(event) {
                                        if (self._safemouseup) {
                                            var changed = $(this).data('index') != self._selectedIndex();
                                            self.value($(this).data('index'));
                                            self.select(event);
                                            if (changed) {
                                                self.change(event);
                                            }
                                            self.close(event, true);
                                        }
                                        return false;
                                    })
                                    .click(function() {
                                        return false;
                                    })
                                    .bind('mouseover focus', function() {
                                        self._selectedOptionLi().addClass(activeClass);
                                        self._focusedOptionLi().removeClass(self.widgetBaseClass + '-item-focus ui-state-hover');
                                        $(this).removeClass('ui-state-active').addClass(self.widgetBaseClass + '-item-focus ui-state-hover');
                                    })
                                    .bind('mouseout blur', function() {
                                        if ($(this).is(self._selectedOptionLi())) {
                                            $(this).addClass(activeClass);
                                        }
                                        $(this).removeClass(self.widgetBaseClass + '-item-focus ui-state-hover');
                                    });

                            //optgroup or not...
                            if (selectOptionData[i].parentOptGroup) {
                                var optGroupName = self.widgetBaseClass + '-group-' + selectOptionData[i].parentOptGroup;
                                if (this.list.find('li.' + optGroupName).size()) {
                                    this.list.find('li.' + optGroupName + ':last ul').append(thisLi);
                                }
                                else {
                                    $('<li role="presentation" class="' + self.widgetBaseClass + '-group ' + optGroupName + '"><span class="' + self.widgetBaseClass + '-group-label">' + selectOptionData[i].parentOptGroup + '</span><ul></ul></li>')
                                            .appendTo(this.list)
                                            .find('ul')
                                            .append(thisLi);
                                }
                            }
                            else {
                                thisLi.appendTo(this.list);
                            }

                            //this allows for using the scrollbar in an overflowed list
                            this.list.bind('mousedown mouseup', function() {
                                return false;
                            });

                            //append icon if option is specified
                            if (o.icons) {
                                for (var j in o.icons) {
                                    if (thisLi.is(o.icons[j].find)) {
                                        thisLi
                                                .data('optionClasses', selectOptionData[i].classes + ' ' + self.widgetBaseClass + '-hasIcon')
                                                .addClass(self.widgetBaseClass + '-hasIcon');
                                        var iconClass = o.icons[j].icon || "";

                                        thisLi
                                                .find('a:eq(0)')
                                                .prepend('<span class="' + self.widgetBaseClass + '-item-icon ui-icon ' + iconClass + '"></span>');
                                    }
                                }
                            }
                        }
                    }

                    //add corners to top and bottom menu items
                    this.list.find('li:last').addClass("ui-corner-bottom");
                    if (o.style == 'popup') {
                        this.list.find('li:first').addClass("ui-corner-top");
                    }

                    //transfer classes to selectmenu and list
                    if (o.transferClasses) {
                        var transferClasses = this.element.attr('class') || '';
                        this.newelement.add(this.list).addClass(transferClasses);
                    }

                    //original selectmenu width
                    var selectWidth = this.element.width();
                    if (selectWidth < 44) {
                        selectWidth = selectWidth + 30;
                    }

                    //set menu button width
                    this.newelement.width((o.width) ? o.width : selectWidth);

                    //set menu width to either menuWidth option value, width option value, or select width
                    if (o.style == 'dropdown') {
                        this.list.width((o.menuWidth) ? o.menuWidth : ((o.width) ? o.width : selectWidth));
                    }
                    else {
                        this.list.width((o.menuWidth) ? o.menuWidth : ((o.width) ? o.width - o.handleWidth : selectWidth - o.handleWidth));
                    }

                    //set max height from option
                    if (o.maxHeight && o.maxHeight < this.list.height()) {
                        this.list.height(o.maxHeight);
                    }

                    //save reference to actionable li's (not group label li's)
                    this._optionLis = this.list.find('li:not(.' + self.widgetBaseClass + '-group)');

                    //transfer menu click to menu button
                    this.list
                            .keydown(function(event) {
                        var ret = true;
                        switch (event.keyCode) {
                            case $.ui.keyCode.UP:
                            case $.ui.keyCode.LEFT:
                                ret = false;
                                self._moveSelection(-1);
                                break;
                            case $.ui.keyCode.DOWN:
                            case $.ui.keyCode.RIGHT:
                                ret = false;
                                self._moveSelection(1);
                                break;
                            case $.ui.keyCode.HOME:
                                ret = false;
                                self._moveSelection(':first');
                                break;
                            case $.ui.keyCode.PAGE_UP:
                                ret = false;
                                self._scrollPage('up');
                                break;
                            case $.ui.keyCode.PAGE_DOWN:
                                ret = false;
                                self._scrollPage('down');
                                break;
                            case $.ui.keyCode.END:
                                ret = false;
                                self._moveSelection(':last');
                                break;
                            case $.ui.keyCode.ENTER:
                            case $.ui.keyCode.SPACE:
                                ret = false;
                                self.close(event, true);
                                $(event.target).parents('li:eq(0)').trigger('mouseup');
                                break;
                            case $.ui.keyCode.TAB:
                                ret = true;
                                self.close(event, true);
                                break;
                            case $.ui.keyCode.ESCAPE:
                                ret = false;
                                self.close(event, true);
                                break;
                            default:
                                ret = false;
                                self._typeAhead(event.keyCode, 'focus');
                                break;
                        }
                        return ret;
                    });

                    //selectmenu style
                    if (o.style == 'dropdown') {
                        this.newelement
                                .addClass(self.widgetBaseClass + "-dropdown");
                        this.list
                                .addClass(self.widgetBaseClass + "-menu-dropdown");
                    }
                    else {
                        this.newelement
                                .addClass(self.widgetBaseClass + "-popup");
                        this.list
                                .addClass(self.widgetBaseClass + "-menu-popup");
                    }

                    //append status span to button
                    this.newelement.prepend('<span class="' + self.widgetBaseClass + '-status">' + selectOptionData[this._selectedIndex()].text + '</span>');

                    //hide original selectmenu element
                    this.element.hide();

                    //transfer disabled state
                    if (this.element.attr('disabled') == true) {
                        this.disable();
                    }

                    //update value
                    this.value(this._selectedIndex());
                },
                destroy: function() {
                    this.element.removeData(this.widgetName)
                            .removeClass(this.widgetBaseClass + '-disabled' + ' ' + this.namespace + '-state-disabled')
                            .removeAttr('aria-disabled');

                    //unbind click on label, reset its for attr
                    $('label[for=' + this.newelement.attr('id') + ']')
                            .attr('for', this.element.attr('id'))
                            .unbind();
                    this.newelement.unbind();
                    this.newelement.remove();
                    this.list.remove();
                    this.element.show();
                    this.element.unbind();
                },
                _typeAhead: function(code, eventType) {
                    var self = this;
                    //define self._prevChar if needed
                    if (!self._prevChar) {
                        self._prevChar = ['',0];
                    }
                    var C = String.fromCharCode(code);
                    c = C.toLowerCase();
                    var focusFound = false;

                    function focusOpt(elem, ind) {
                        focusFound = true;
                        $(elem).trigger(eventType);
                        self._prevChar[1] = ind;
                    }

                    ;
                    this.list.find('li a').each(function(i) {
                        if (!focusFound) {
                            var thisText = $(this).text();
                            if (thisText.indexOf(C) == 0 || thisText.indexOf(c) == 0) {
                                if (self._prevChar[0] == C) {
                                    if (self._prevChar[1] < i) {
                                        focusOpt(this, i);
                                    }
                                }
                                else {
                                    focusOpt(this, i);
                                }
                            }
                        }
                    });
                    this._prevChar[0] = C;
                },
                _uiHash: function() {
                    return {
                        value: this.value()
                    };
                },
                open: function(event) {
                    var self = this;
                    var disabledStatus = this.newelement.attr("aria-disabled");
                    if (disabledStatus != 'true') {
                        this._refreshPosition();
                        this._closeOthers(event);
                        this.newelement
                                .addClass('ui-state-active');

                        this.list
                                .appendTo(this.container)
                                .addClass(self.widgetBaseClass + '-open')
                                .attr('aria-hidden', false)
                                .find('li:not(.' + self.widgetBaseClass + '-group):eq(' + this._selectedIndex() + ') a')[0].focus();
                        if (this.options.style == "dropdown") {
                            this.newelement.removeClass('ui-corner-all').addClass('ui-corner-top');
                        }
                        this._refreshPosition();
                        this._trigger("open", event, this._uiHash());
                    }
                },

                close: function(event, retainFocus) {
                    if (this.newelement.is('.ui-state-active')) {
                        this.newelement
                                .removeClass('ui-state-active');
                        this.list
                                .attr('aria-hidden', true)
                                .removeClass(this.widgetBaseClass + '-open');
                        if (this.options.style == "dropdown") {
                            this.newelement.removeClass('ui-corner-top').addClass('ui-corner-all');
                        }
                        if (retainFocus) {
                            this.newelement[0].focus();
                        }
                        this.element.trigger('close');
                        this._trigger("close", event, this._uiHash());
                    }
                },
                change: function(event) {
                    this.element.trigger('change');
                    this._trigger("change", event, this._uiHash());
                },
                settings: function() {
                    return this.options;
                },
                select: function(event) {
                    this._trigger("select", event, this._uiHash());
                },
                _closeOthers: function(event) {
                    $('.' + this.widgetBaseClass + '.ui-state-active').not(this.newelement).each(function() {
                        $(this).data('selectelement').selectmenu('close', event);
                    });
                    $('.' + this.widgetBaseClass + '.ui-state-hover').trigger('mouseout');
                },
                _toggle: function(event, retainFocus) {
                    if (this.list.is('.' + this.widgetBaseClass + '-open')) {
                        this.close(event, retainFocus);
                    }
                    else {
                        this.open(event);
                    }
                },
                _formatText: function(text) {
                    return this.options.format ? this.options.format(text) : text;
                },
                _selectedIndex: function() {
                    return this.element[0].selectedIndex;
                },
                _selectedOptionLi: function() {
                    return this._optionLis.eq(this._selectedIndex());
                },
                _focusedOptionLi: function() {
                    return this.list.find('.' + this.widgetBaseClass + '-item-focus');
                },
                _moveSelection: function(amt) {
                    var currIndex = parseInt(this._selectedOptionLi().data('index'), 10);
                    var newIndex = currIndex + amt;
                    return this._optionLis.eq(newIndex).trigger('mouseup');
                },
                selectNext: function() {
                    var currIndex = parseInt(this._selectedOptionLi().data('index'), 10);
                    var newIndex = currIndex + 1;
                    if (newIndex < this._optionLis.size()) {
                        this.element[0].selectedIndex = newIndex;
                        this._refreshValue();
                        this._refreshPosition();
                        this.element.trigger('change');
                    }
                },
                selectPrevious: function() {
                    var currIndex = parseInt(this._selectedOptionLi().data('index'), 10);
                    var newIndex = currIndex - 1;
                    if (newIndex >= 0) {
                        this.element[0].selectedIndex = newIndex;
                        this._refreshValue();
                        this._refreshPosition();
                        this.element.trigger('change');
                    }
                },
                value: function(newValue) {
                    if (arguments.length) {
                        this.element[0].selectedIndex = newValue;
                        this._refreshValue();
                        this._refreshPosition();
                    }
                    return this.element[0].selectedIndex;
                },
                add:function(key, value, id, selected) {
                    var select = this.element;
                    var options = this.options;
                    var option = $("<option></option>").attr("value", key).text(value);
                    if (id) {
                        option.attr("id", id);
                    }
                    $(select).append(option);
                    this.destroy();
                    $(select).selectmenu(options);
                    if (selected) {
                        $(select).selectmenu('value', value);
                    }
                },
                remove:function(key, withID, andAfter) {
                    var type = withID ? 'id' : 'value';
                    var select = this.element;
                    var options = this.options;
                    if (andAfter) {
                        var remove = false;
                        $(select).find("option").each(function() {
                            var option = $(this);
                            if (option.attr(type) == key) {
                                remove = true;
                            }
                            if (remove) {
                                option.remove();
                            }
                        });
                    } else {
                        $(select).find("option[" + type + "='" + key + "']").remove();
                    }
                    this.destroy();
                    $(select).selectmenu(options);
                },
                update:function(key, newkey, newvalue, withID, selected) {
                    var select = this.element;
                    var options = this.options;
                    var type = withID ? 'id' : 'value';
                    var currentoption = $(select).find("option[" + type + "='" + key + "']");
                    currentoption.attr('value', newkey);
                    if (newvalue) {
                        currentoption.text(newvalue);
                    }
                    this.destroy();
                    $(select).selectmenu(options);
                    if (selected) {
                        $(select).selectmenu('value', currentoption.index());
                    }
                },
                _moveFocus: function(amt) {
                    if (!isNaN(amt)) {
                        var currIndex = parseInt(this._focusedOptionLi().data('index'), 10);
                        var newIndex = currIndex + amt;
                    }
                    else {
                        var newIndex = parseInt(this._optionLis.filter(amt).data('index'), 10);
                    }

                    if (newIndex < 0) {
                        newIndex = 0;
                    }
                    if (newIndex > this._optionLis.size() - 1) {
                        newIndex = this._optionLis.size() - 1;
                    }
                    var activeID = this.widgetBaseClass + '-item-' + Math.round(Math.random() * 1000);
                    this._focusedOptionLi().find('a:eq(0)').attr('id', '');
                    this._optionLis.eq(newIndex).find('a:eq(0)').attr('id', activeID)[0].focus();
                    this.list.attr('aria-activedescendant', activeID);
                },
                _scrollPage: function(direction) {
                    var numPerPage = Math.floor(this.list.outerHeight() / this.list.find('li:first').outerHeight());
                    numPerPage = (direction == 'up') ? -numPerPage : numPerPage;
                    this._moveFocus(numPerPage);
                },
                _setData: function(key, value) {
                    this.options[key] = value;
                    if (key == 'disabled') {
                        this.close();
                        this.element
                                .add(this.newelement)
                                .add(this.list)
                                [value ? 'addClass' : 'removeClass'](
                                this.widgetBaseClass + '-disabled' + ' ' +
                                        this.namespace + '-state-disabled')
                                .attr("aria-disabled", value);
                    }
                },
                _refreshValue: function() {
                    var activeClass = (this.options.style == "popup") ? " ui-state-active" : "";
                    var activeID = this.widgetBaseClass + '-item-' + Math.round(Math.random() * 1000);
                    //deselect previous
                    this.list
                            .find('.' + this.widgetBaseClass + '-item-selected')
                            .removeClass(this.widgetBaseClass + "-item-selected" + activeClass)
                            .find('a')
                            .attr('aria-selected', 'false')
                            .attr('id', '');
                    //select new
                    this._selectedOptionLi()
                            .addClass(this.widgetBaseClass + "-item-selected" + activeClass)
                            .find('a')
                            .attr('aria-selected', 'true')
                            .attr('id', activeID);

                    //toggle any class brought in from option
                    var currentOptionClasses = this.newelement.data('optionClasses') ? this.newelement.data('optionClasses') : "";
                    var newOptionClasses = this._selectedOptionLi().data('optionClasses') ? this._selectedOptionLi().data('optionClasses') : "";
                    this.newelement
                            .removeClass(currentOptionClasses)
                            .data('optionClasses', newOptionClasses)
                            .addClass(newOptionClasses)
                            .find('.' + this.widgetBaseClass + '-status')
                            .html(
                            this._selectedOptionLi()
                                    .find('a:eq(0)')
                                    .html()
                    );

                    this.list.attr('aria-activedescendant', activeID)
                },

                _refreshPosition: function() {
                    //set left value
                    if (this.container == 'body')
                        this.list.css('left', this.newelement.offset().left);
                    else
                        this.list.css('left', this.newelement.position().left);

                    //set left value
                    if (this.container == 'body')
                        var menuTop = this.newelement.offset().top;
                    else
                        var menuTop = this.newelement.position().top;


                    var scrolledAmt = this.list[0].scrollTop;
                    this.list.find('li:lt(' + this._selectedIndex() + ')').each(function() {
                        scrolledAmt -= $(this).outerHeight();
                    });

                    if (this.newelement.is('.' + this.widgetBaseClass + '-popup')) {
                        menuTop += scrolledAmt;
                    }
                    else {
                        if (menuTop + this.list.height() > $(window).height()) {
                            menuTop = menuTop - this.list.height();
                        }
                        else {
                            menuTop += this.newelement.height();
                        }
                    }
                    this.list.css('top', menuTop);
                }
            });

    $.extend($.ui.selectmenu, {
                getter: "value",
                version: "@VERSION",
                eventPrefix: "selectmenu",
                defaults: {
                    transferClasses: true,
                    style: 'popup',
                    width: null,
                    menuWidth: null,
                    handleWidth: 26,
                    maxHeight: null,
                    icons: null,
                    format: null,
                    container: 'body'
                }
            });

})(jQuery);