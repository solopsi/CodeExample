define(
    [
        "dojo/_base/declare",
        "dojo/_base/lang",
        "dojo/dom-construct",
        "dojo/dom-class",
        "dojo/dom-style",
        "dojo/dom-geometry",
        "dojo/_base/fx",
        "dojo/fx",
        "dojo/Deferred",
        "dojo/i18n!./nls/_OverlayFormMixin",
        "implab/text/template-compile",
        "./play"
    ],
    function (
        declare,
        lang,
        ddom,
        dclass,
        dstyle,
        dgeom,
        fx,
        fxx,
        Deferred,
        nls,
        tc,
        playAnimation) {
        return declare(
            null, {

                /**
                 * A name of the attribute to monitor changes on load
                 */
                overlayWatchAttr: "value",

                /**
                 * force the target node to this height if overlay is shown
                 */
                overlayMinHeight: 50,

                /**
                 * Target node which will be covered by the overlay
                 */
                overlayTargetNode: null,

                overlayOnCreate: "loading",

                /**
                 * localized collection of messages to display on overlay
                 * (waiting, loading, saving)
                 */
                overlayNls: nls,

                /**
                 * apply position:relative if necessary
                 */
                overlayFixTarget: true,

                /**
                 * function to generate an overlay contents
                 */
                buildOverlay: tc("<span class='inline-extender'></span><span class='asktu-form-overlay-content'><span class='animate-spin icon-spin2'></span><%=label%></span>"),

                _overlayNode: null,

                _overlayAnimation: null,

                buildRendering: function () {
                    this.inherited(arguments);

                    var target = this.overlayTargetNode;

                    if (target) {
                        this._overlayNode = ddom.create("div", {
                            "class": "asktu-form-overlay" +
                                (this.overlayOnCreate ? "" : " hidden"),
                            innerHTML: this.buildOverlay({
                                label: this.getOverlayText(this.overlayOnCreate)
                            })
                        }, target);

                        if (this.overlayFixTarget) {
                            if (!(/absolute|fixed|relative/.test(dstyle.get(target, "position"))))
                                dstyle.set(target, "position", "relative");
                            dstyle.set(target, "overflow", "hidden");
                        }
                    }
                },

                startup: function () {
                    this.inherited(arguments);

                    if (this.overlayMinHeight && this.overlayOnCreate) {
                        // fix on start
                        var target = this.overlayTargetNode;
                        var cstyle = dstyle.getComputedStyle(target);
                        var box = dgeom.getContentBox(target, cstyle);
                        // console.log(box.h + "->" + this.overlayMinHeight);
                        if (box.h < this.overlayMinHeight) {
                            dstyle.set(target, "height", this.overlayMinHeight + "px");
                        } else {
                            dstyle.set(target, "height", box.h + "px");
                        }
                    }
                },

                getOverlayText: function (text) {
                    if (!text)
                        text = "waiting";

                    return this.overlayNls[text] || text;
                },

                postCreate: function () {
                    this.inherited(arguments);
                    this.hideOverlayOnAttrChange(this.overlayWatchAttr);
                },

                hideOverlayOnAttrChange: function (attr) {
                    var me = this;
                    if (attr) {
                        var h = me.watch(attr, function () {
                            h.remove();
                            me.hideOverlay();
                        });
                        return h;
                    }
                },

                showOverlay: function (text, opts) {
                    var me = this;

                    if (!me._overlayNode)
                        return;

                    if (me._overlayAnimation) {
                        me._overlayAnimation.cancel();
                    } else {
                        dstyle.set(me._overlayNode, {
                            opacity: 0
                        });
                    }

                    // prepare overlay
                    me._overlayNode.innerHTML = me.buildOverlay({
                        label: this.getOverlayText(text)
                    });

                    dclass.remove(this._overlayNode, "hidden");

                    if (opts && opts.watch)
                        me.hideOverlayOnAttrChange(opts.watch);

                    var target = me.overlayTargetNode;
                    var cstyle = dstyle.getComputedStyle(target);
                    var box = dgeom.getContentBox(target, cstyle);

                    // console.log(box, me.overlayMinHeight);

                    var anim = fx.fadeIn({
                        node: me._overlayNode
                    });

                    dstyle.set(target, "overflow", "hidden");

                    if (box.h < me.overlayMinHeight) {
                        anim = fxx.combine([
                            anim, fx.animateProperty({
                                node: target,
                                properties: {
                                    height: {
                                        start: box.h,
                                        end: me.overlayMinHeight
                                    }
                                }
                            })
                        ]);
                    } else {
                        dstyle.set(target, "height", box.h + "px");
                    }

                    return (me._overlayAnimation = playAnimation(anim).always(function () {
                        me._overlayAnimation = null;
                    }));
                },

                hideOverlay: function () {
                    var me = this;

                    if (!me._overlayNode)
                        return;

                    if (me._overlayAnimation)
                        me._overlayAnimation.cancel();

                    var target = me.overlayTargetNode;
                    var cstyle = dstyle.getComputedStyle(target);
                    var box = dgeom.getContentBox(target, cstyle);

                    dstyle.set(target, "height", null);
                    // console.log(box, target.scrollHeight);

                    var anim = fxx.combine([
                        fx.fadeOut({
                            node: me._overlayNode
                        }), fx.animateProperty({
                            node: target,
                            properties: {
                                height: {
                                    start: box.h,
                                    end: target.scrollHeight
                                }
                            }
                        })
                    ]);

                    return (me._overlayAnimation = playAnimation(anim).always(function () {
                        me._overlayAnimation = null;
                        dclass.add(me._overlayNode, "hidden");
                        dstyle.set(target, "height", null);
                    }));
                },

                destroy: function () {
                    this.inherited(arguments);

                    if (this._overlayAnimation)
                        this._overlayAnimation.cancel();

                    this._overlayNode = null;
                }
            });
    });