define(["../text/format"], function (format) {
    'use strict';

    var listeners = [];
    var channels = {};

    var Trace = function (name) {
        this.name = name;
        this._subscribers = [];
    };

    Trace.prototype.debug = function () {
        if (Trace.level >= 4)
            this.notify("debug", format.apply(null, arguments));
    };

    Trace.prototype.log = function () {
        if (Trace.level >= 3)
            this.notify("log", format.apply(null, arguments));
    };

    Trace.prototype.warn = function () {
        if (Trace.level >= 2)
            this.notify("warn", format.apply(null, arguments));

    };

    Trace.prototype.error = function () {
        if (Trace.level >= 1)
            this.notify("error", format.apply(null, arguments));
    };

    Trace.prototype.notify = function (name, msg) {
        var me = this;
        me._subscribers.forEach(function (cb) {
            cb(me, name, msg);
        });
    };

    Trace.prototype.subscribe = function (cb) {
        this._subscribers.push(cb);
    };

    Trace.prototype.toString = function () {
        return this.name;
    };

    Trace.createChannel = function (type, name, cb) {
        var chId = name;
        if (channels[chId])
            return channels[chId];

        var channel = new type(chId);
        channels[chId] = channel;

        Trace._onNewChannel(chId, channel);
        cb(channel);
    };

    Trace._onNewChannel = function (chId, ch) {
        listeners.forEach(function (listener) {
            listener(chId, ch);
        });
    };

    Trace.on = function (filter, cb) {
        if (arguments.length == 1) {
            cb = filter;
            filter = undefined;
        }
        var d, test;
        if (filter instanceof RegExp) {
            test = function (chId) {
                return filter.test(chId);
            };
        } else if (filter instanceof Function) {
            test = filter;
        } else if (filter) {
            test = function (chId) {
                return chId == filter;
            };
        }

        if (test) {
            d = function(chId, ch) {
                if(test(chId))
                    ch.subscribe(cb);
            };
        } else {
            d = function(chId, ch) {
                ch.subscribe(cb);
            };
        }
        listeners.push(d);

        for(var chId in channels)
            d(chId,channels[chId]);
    };

    Trace.load = function (id, require, cb) {
        if (id)
            Trace.createChannel(Trace, id, cb);
        else if (require.module && require.module.mid)
            Trace.createChannel(Trace, require.module.mid, cb);
        else
            require(['module'], function (module) {
                Trace.createChannel(Trace, module && module.id, cb);
            });
    };

    Trace.dynamic = true;

    Trace.level = 4;

    return Trace;
});