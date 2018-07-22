define([
    "../safe",
    "./format-compile",
    "dojo/number",
    "dojo/date/locale",
    "dojo/_base/array" ], function(safe, compile, number, date, array) {

    // {short,medium,full,long}-{date,time}
    var convert = function(value, pattern) {
        if (!pattern)
            return value.toString();

        if (pattern.toLocaleLowerCase() == "json") {
            var cache = [];
            return JSON.stringify(value, function(k, v) {
                if (!safe.isPrimitive(v)) {
                    var id = array.indexOf(cache, v);
                    if (id >= 0)
                        return "@ref-" + id;
                    else
                        return v;
                } else {
                    return v;
                }
            },2);
        }

        if (safe.isNumber(value)) {
            var nopt = {};
            if (pattern.indexOf("!") === 0) {
                nopt.round = -1;
                pattern = pattern.substr(1);
            }
            nopt.pattern = pattern;
            return number.format(value, nopt);
        } else if (value instanceof Date) {
            var m = pattern.match(/^(\w+)-(\w+)$/);
            if (m)
                return date.format(value, {
                    selector : m[2],
                    formatLength : m[1]
                });
            else if (pattern == "iso")
                return value.toISOString();
            else
                return date.format(value, {
                    selector : "date",
                    datePattern : pattern
                });
        } else {
            return value.toString(pattern);
        }
    };

    function formatter(format) {
        var data;

        if (arguments.length <= 1)
            return format;

        data = Array.prototype.slice.call(arguments, 1);

        var template = compile(format);

        return template(function(name, pattern) {
            var value = data[name];
            return !safe.isNull(value) ? convert(value, pattern) : "";
        });
    }

    formatter.compile = function(format) {
        var template = compile(format);

        return function() {
            var data = arguments;

            return template(function(name, pattern) {
                var value = data[name];
                return !safe.isNull(value) ? convert(value, pattern) : "";
            });
        };
    };

    formatter.convert = convert;

    return formatter;
});