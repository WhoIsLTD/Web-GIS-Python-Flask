if (!Array.prototype.map) {
    Array.prototype.map = function(b) {
        var a = this.length;
        if (typeof b !== "function") {
            throw new TypeError()
        }
        var e = new Array(a);
        var d = arguments[1];
        for (var c = 0; c < a; c++) {
            if (c in this) {
                e[c] = b.call(d, this[c], c, this)
            }
        }
        return e
    }
}
L.Control.FuseSearch = L.Control.extend({
    includes: L.Mixin.Events,
    options: {
        position: "topright",
        title: "Search",
        placeholder: "Search",
        caseSensitive: false,
        threshold: 0.5,
        maxResultLength: null,
        showResultFct: null,
        showInvisibleFeatures: true
    },
    initialize: function(a) {
        L.setOptions(this, a);
        this._panelOnLeftSide = (this.options.position.indexOf("left") !== -1)
    },
    onAdd: function(b) {
        var a = this._createControl();
        this._createPanel(b);
        this._setEventListeners();
        b.invalidateSize();
        return a
    },
    onRemove: function(a) {
        this.hidePanel(a);
        this._clearEventListeners();
        this._clearPanel(a);
        this._clearControl();
        return this
    },
    _createControl: function() {
        var d = "leaflet-fusesearch-control"
          , a = L.DomUtil.create("div", d);
        var b = this._openButton = L.DomUtil.create("a", "button", a);
        b.href = "#";
        b.title = this.options.title;
        var c = L.DomEvent.stopPropagation;
        L.DomEvent.on(b, "click", c).on(b, "mousedown", c).on(b, "touchstart", c).on(b, "mousewheel", c).on(b, "MozMousePixelScroll", c);
        L.DomEvent.on(b, "click", L.DomEvent.preventDefault);
        L.DomEvent.on(b, "click", this.showPanel, this);
        return a
    },
    _clearControl: function() {
        var a = this._openButton;
        var b = L.DomEvent.stopPropagation;
        L.DomEvent.off(a, "click", b).off(a, "mousedown", b).off(a, "touchstart", b).off(a, "mousewheel", b).off(a, "MozMousePixelScroll", b);
        L.DomEvent.off(a, "click", L.DomEvent.preventDefault);
        L.DomEvent.off(a, "click", this.showPanel)
    },
    _createPanel: function(e) {
        var h = this;
        var d = e.getContainer();
        var c = "leaflet-fusesearch-panel"
          , g = this._panel = L.DomUtil.create("div", c, d);
        var b = L.DomEvent.stopPropagation;
        L.DomEvent.on(g, "click", b).on(g, "dblclick", b).on(g, "mousedown", b).on(g, "touchstart", b).on(g, "mousewheel", b).on(g, "MozMousePixelScroll", b);
        if (this._panelOnLeftSide) {
            L.DomUtil.addClass(g, "left")
        } else {
            L.DomUtil.addClass(g, "right")
        }
        var a = L.DomUtil.create("div", "content", g);
        L.DomUtil.create("img", "search-image", a);
        this._input = L.DomUtil.create("input", "search-input", a);
        this._input.maxLength = 30;
        this._input.placeholder = this.options.placeholder;
        this._input.onkeyup = function(i) {
            var j = i.currentTarget.value;
            h.searchFeatures(j)
        }
        ;
        var f = this._closeButton = L.DomUtil.create("a", "close", a);
        f.innerHTML = "&times;";
        L.DomEvent.on(f, "click", this.hidePanel, this);
        this._resultList = L.DomUtil.create("div", "result-list", a);
        return g
    },
    _clearPanel: function(c) {
        var a = L.DomEvent.stopPropagation;
        L.DomEvent.off(this._panel, "click", a).off(this._panel, "dblclick", a).off(this._panel, "mousedown", a).off(this._panel, "touchstart", a).off(this._panel, "mousewheel", a).off(this._panel, "MozMousePixelScroll", a);
        L.DomEvent.off(this._closeButton, "click", this.hidePanel);
        var b = c.getContainer();
        b.removeChild(this._panel);
        this._panel = null
    },
    _setEventListeners: function() {
        var b = this;
        var a = this._input;
        this._map.addEventListener("overlayadd", function() {
            b.searchFeatures(a.value)
        });
        this._map.addEventListener("overlayremove", function() {
            b.searchFeatures(a.value)
        })
    },
    _clearEventListeners: function() {
        this._map.removeEventListener("overlayadd");
        this._map.removeEventListener("overlayremove")
    },
    isPanelVisible: function() {
        return L.DomUtil.hasClass(this._panel, "visible")
    },
    showPanel: function() {
        if (!this.isPanelVisible()) {
            L.DomUtil.addClass(this._panel, "visible");
            this._map.panBy([this.getOffset() * 0.5, 0], {
                duration: 0.5
            });
            this.fire("show");
            this._input.select();
            this.searchFeatures(this._input.value)
        }
    },
    hidePanel: function(a) {
        if (this.isPanelVisible()) {
            L.DomUtil.removeClass(this._panel, "visible");
            if (null !== this._map) {
                this._map.panBy([this.getOffset() * -0.5, 0], {
                    duration: 0.5
                })
            }
            this.fire("hide");
            if (a) {
                L.DomEvent.stopPropagation(a)
            }
        }
    },
    getOffset: function() {
        if (this._panelOnLeftSide) {
            return -this._panel.offsetWidth
        } else {
            return this._panel.offsetWidth
        }
    },
    indexFeatures: function(d, c) {
        this._keys = c;
        var b = d.map(function(e) {
            e.properties._feature = e;
            return e.properties
        });
        var a = {
            keys: c,
            caseSensitive: this.options.caseSensitive,
            threshold: this.options.threshold
        };
        this._fuseIndex = new Fuse(b,a)
    },
    searchFeatures: function(e) {
        var j = this._fuseIndex.search(e);
        $(".result-item").remove();
        var b = $(".result-list")[0];
        var d = 0;
        var g = this.options.maxResultLength;
        for (var c in j) {
            var f = j[c];
            var h = f.item._feature;
            var a = this._getFeaturePopupIfVisible(h);
            if (undefined !== a || this.options.showInvisibleFeatures) {
                this.createResultItem(f, b, a);
                if (undefined !== g && ++d === g) {
                    break
                }
            }
        }
    },
    _getFeaturePopupIfVisible: function(b) {
        var a = b.layer;
        if (undefined !== a && this._map.hasLayer(a)) {
            return a.getPopup()
        }
    },
    createResultItem: function(f, b, a) {
        var g = this;
        var e = f.item._feature;
        var c = L.DomUtil.create("p", "result-item", b);
        if (undefined !== a) {
            L.DomUtil.addClass(c, "clickable");
            c.onclick = function() {
                if (window.matchMedia("(max-width:480px)").matches) {
                    g.hidePanel();
                    e.layer.openPopup()
                } else {
                    g._panAndPopup(e, a)
                }
            }
        }
        if (null !== this.options.showResultFct) {
            this.options.showResultFct(e, c)
        } else {
            str = "<b>" + f.item[this._keys[0]] + "</b>";
            for (var d = 1; d < this._keys.length; d++) {
                str += "<br/>" + f.item[this._keys[d]]
            }
            c.innerHTML = str
        }
        return c
    },
    _panAndPopup: function(c, a) {
        if (this._panelOnLeftSide) {
            var d = a.options.autoPanPaddingTopLeft;
            var b = new L.Point(-this.getOffset(),10);
            a.options.autoPanPaddingTopLeft = b;
            c.layer.openPopup();
            a.options.autoPanPaddingTopLeft = d
        } else {
            var d = a.options.autoPanPaddingBottomRight;
            var b = new L.Point(this.getOffset(),10);
            a.options.autoPanPaddingBottomRight = b;
            c.layer.openPopup();
            a.options.autoPanPaddingBottomRight = d
        }
    }
});
L.control.fuseSearch = function(a) {
    return new L.Control.FuseSearch(a)
}
;