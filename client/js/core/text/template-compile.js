define(
    ["dojo/request", "./format", "../log/trace!"],
    function (request, format, trace) {

        // разбивает строку шаблона на токены, возвращает контекст для
        // дальнейшей обработки в visitTemplate
        var parseTemplate = function (str) {
            var tokens = str.split(/(<%=|\[%=|<%|\[%|%\]|%>)/);
            var pos = -1;
            var data = [],
                code = [];

            return {
                next: function () {
                    pos++;
                    return pos < tokens.length;
                },
                token: function () {
                    return tokens[pos];
                },
                pushData: function () {
                    var i = data.length;
                    data.push.apply(data, arguments);
                    return i;
                },
                pushCode : function() {
                    var i = code.length;
                    code.push.apply(code, arguments);
                    return i;
                },
                compile: function () {
                    var text = "var $p = [];\n" +
                        "var print = function(){\n" +
                        "   $p.push(format.apply(null,arguments));\n" +
                        "};\n" +
                        // Introduce the data as local variables using with(){}
                        "with(obj){\n" +
                        code.join("\n") +
                        "}\n" +
                        "return $p.join('');";
                    
                    try {
                        var compiled = new Function("obj, format, $data", text);
                        /**
                         * Функция форматирования по шаблону
                         * 
                         * @type{Function}
                         * @param{Object} obj объект с параметрами для подстановки
                         */
                        return function (obj) {
                            return compiled(obj || {}, format, data);
                        };
                    } catch (e) {
                        trace.error([e]);
                        trace.log([text, data]);
                        throw e;
                    }
                }
            }
        };

        function visitTemplate(context) {
            while (context.next()) {
                switch (context.token()) {
                    case "<%":
                    case "[%":
                        visitCode(context);
                        break;
                    case "<%=":
                    case "[%=":
                        visitInline(context);
                        break;
                    default:
                        visitTextFragment(context);
                        break;
                }
            }
        }

        function visitInline(context) {
            var code = ["$p.push("];
            while (context.next()) {
                if (context.token() == "%>" || context.token() == "%]")
                    break;
                code.push(context.token());
            }
            code.push(");");
            context.pushCode(code.join(''));
        }

        function visitCode(context) {
            var code = [];
            while (context.next()) {
                if (context.token() == "%>" || context.token() == "%]")
                    break;
                code.push(context.token());
            }
            context.pushCode(code.join(''));
        }

        function visitTextFragment(context) {
            var i = context.pushData(context.token());
            context.pushCode("$p.push($data["+i+"]);");
        }

        var compile = function (str) {
            if (!str)
                return function() { return "";};

            var ctx = parseTemplate(str);
            visitTemplate(ctx);
            return ctx.compile();
        };

        var cache = {};

        compile.load = function (id, require, callback) {
            var url = require.toUrl(id);
            if (url in cache) {
                callback(cache[url]);
            } else {
                request(url).then(compile).then(function (tc) {
                    callback(cache[url] = tc);
                }, function (err) {
                    require.signal("error", [{
                        error: err,
                        src: 'implab/text/template-compile'
                    }]);
                });
            }
        };

        return compile;
    });