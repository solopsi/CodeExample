define(
    [],
    function() {
        var map = {
            "\\{" : "&curlopen;",
            "\\}" : "&curlclose;",
            "&" : "&amp;",
            "\\:" : "&colon;"
        };

        var rev = {
            curlopen : "{",
            curlclose : "}",
            amp : "&",
            colon : ":"
        };

        var espaceString = function(s) {
            if (!s)
                return s;
            return "'" + s.replace(/('|\\)/g, "\\$1") + "'";
        };

        var encode = function(s) {
            if (!s)
                return s;
            return s.replace(/\\{|\\}|&|\\:/g, function(m) {
                return map[m] || m;
            });
        };

        var decode = function(s) {
            if (!s)
                return s;
            return s.replace(/&(\w+);/g, function(m, $1) {
                return rev[$1] || m;
            });
        };

        var subst = function(s) {
            var i = s.indexOf(":"), name, pattern;
            if (i >= 0) {
                name = s.substr(0, i);
                pattern = s.substr(i + 1);
            } else {
                name = s;
            }

            if (pattern)
                return [
                    espaceString(decode(name)),
                    espaceString(decode(pattern)) ];
            else
                return [ espaceString(decode(name)) ];
        };

        var compile = function(str) {
            if (!str)
                return function() {};

            var chunks = encode(str).split("{"), chunk;

            var code = [ "var result=[];" ];

            for (var i = 0; i < chunks.length; i++) {
                chunk = chunks[i];

                if (i === 0) {
                    if (chunk)
                        code.push("result.push(" + espaceString(decode(chunk)) +
                            ");");
                } else {
                    var len = chunk.indexOf("}");
                    if (len < 0)
                        throw new Error("Unbalanced substitution #" + i);

                    code.push("result.push(subst(" +
                        subst(chunk.substr(0, len)).join(",") + "));");
                    if (chunk.length > len + 1)
                        code.push("result.push(" +
                            espaceString(decode(chunk.substr(len + 1))) + ");");
                }
            }

            code.push("return result.join('');");

            /* jshint -W054 */
            return new Function("subst", code.join("\n"));
        };

        var cache = {};

        return function(template) {
            var compiled = cache[template];
            if (!compiled) {
                compiled = compile(template);
                cache[template] = compiled;
            }
            return compiled;
        };
    });