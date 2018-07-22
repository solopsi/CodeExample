define([],

    function () {
        var _create = Object.create,
            _keys = Object.keys;

        var safe = null;
        safe = {
            argumentNotNull: function (arg, name) {
                if (arg === null || arg === undefined)
                    throw new Error("The argument " + name + " can't be null or undefined");
            },

            argumentNotEmptyString: function (arg, name) {
                if (typeof (arg) !== "string" || !arg.length)
                    throw new Error("The argument '" + name + "' must be a not empty string");
            },

            argumentNotEmptyArray: function (arg, name) {
                if (!(arg instanceof Array) || !arg.length)
                    throw new Error("The argument '" + name + "' must be a not empty array");
            },

            argumentOfType: function (arg, type, name) {
                if (!(arg instanceof type))
                    throw new Error("The argument '" + name + "' type doesn't match");
            },

            isNull: function (arg) {
                return (arg === null || arg === undefined);
            },

            isPrimitive: function (arg) {
                return (arg === null || arg === undefined || typeof (arg) === "string" ||
                    typeof (arg) === "number" || typeof (arg) === "boolean");
            },

            isInteger: function (arg) {
                return parseInt(arg) == arg;
            },

            isNumber: function (arg) {
                return parseFloat(arg) == arg;
            },

            isString: function (val) {
                return typeof (val) == "string" || val instanceof String;
            },

            isNullOrEmptyString: function (str) {
                if (str === null || str === undefined ||
                    ((typeof (str) == "string" || str instanceof String) && str.length === 0))
                    return true;
            },

            isNotEmptyArray: function (arg) {
                return (arg instanceof Array && arg.length > 0);
            },

            /**
             * Выполняет метод для каждого элемента массива, останавливается, когда
             * либо достигнут конец массива, либо функция <c>cb</c> вернула
             * значение.
             * 
             * @param{Array | Object} obj массив элементов для просмотра
             * @param{Function} cb функция, вызываемая для каждого элемента
             * @param{Object} thisArg значение, которое будет передано в качестве
             *                <c>this</c> в <c>cb</c>.
             * @returns Результат вызова функции <c>cb</c>, либо <c>undefined</c>
             *          если достигнут конец массива.
             */
            each: function (obj, cb, thisArg) {
                safe.argumentNotNull(cb, "cb");
                var i, x;
                if (obj instanceof Array) {
                    for (i = 0; i < obj.length; i++) {
                        x = cb.call(thisArg, obj[i], i);
                        if (x !== undefined)
                            return x;
                    }
                } else {
                    var keys = _keys(obj);
                    for (i = 0; i < keys.length; i++) {
                        var k = keys[i];
                        x = cb.call(thisArg, obj[k], k);
                        if (x !== undefined)
                            return x;
                    }
                }
            },

            /**
             * Копирует свойства одного объекта в другой.
             * 
             * @param{Any} dest объект в который нужно скопировать значения
             * @param{Any} src источник из которого будут копироваться значения
             * @tmpl{Object|Array} tmpl шаблон по которому будет происходить
             *                     копирование. Если шаблон является массивом
             *                     (список свойств), тогда значения этого массива
             *                     являются именами свойсвт которые будут
             *                     скопированы. Если шаблон является объектом (карта
             *                     преобразования имен свойств src->dst), тогда
             *                     копирование будет осуществляться только
             *                     собственных свойств источника, присутсвующих в
             *                     шаблоне, при этом значение свойства шаблона
             *                     является именем свойства в которое будет
             *                     произведено коприрование
             */
            mixin: function (dest, src, tmpl) {
                safe.argumentNotNull(dest, "dest");
                if (!src)
                    return dest;

                var keys, i, p;
                if (arguments.length < 3) {
                    keys = _keys(src);
                    for (i = 0; i < keys.length; i++) {
                        p = keys[i];
                        dest[p] = src[p];
                    }
                } else {
                    if (tmpl instanceof Array) {
                        for (i = 0; i < tmpl.length; i++) {
                            p = tmpl[i];
                            if (p in src)
                                dest[p] = src[p];
                        }

                    } else {
                        keys = _keys(src);
                        for (i = 0; i < keys.length; i++) {
                            p = keys[i];
                            if (p in tmpl)
                                dest[tmpl[p]] = src[p];
                        }
                    }
                }
                return dest;
            },

            /** Wraps the specified function to emulate an asynchronous execution.
             * @param{Object} thisArg [Optional] Object which will be passed as 'this' to the function.
             * @param{Function|String} fn [Required] Function wich will be wrapped.
             */
            async: function (fn, thisArg) {
                if (arguments.length == 2 && !(fn instanceof Function))
                    fn = thisArg[fn];

                if (fn == null)
                    throw new Error("The function must be specified");

                function wrapresult(x, e) {
                    if (e) {
                        return {
                            then: function (cb, eb) {
                                try {
                                    return eb ? wrapresult(eb(e)) : this;
                                } catch (e2) {
                                    return wrapresult(null, e2);
                                }
                            }
                        };
                    } else {
                        if (x && x.then)
                            return x;
                        return {
                            then : function(cb) {
                                try {
                                    return cb ? wrapresult(cb(x)) : this;
                                } catch(e2) {
                                    return wrapresult(e2);
                                }
                            }
                        };
                    }
                }

                try {
                    return wrapresult(fn.apply(thisArg, arguments));
                } catch (e) {
                    return wrapresult(null, e);
                };
            },

            create: function () {
                if (console && console.warn)
                    console.warn("implab/safe::create is deprecated use Object.create instead");
                _create.apply(this, arguments);
            },

            delegate: function (target, method) {
                if (!(method instanceof Function)) {
                    this.argumentNotNull(target, "target");
                    method = target[method];
                }

                if (!(method instanceof Function))
                    throw new Error("'method' argument must be a Function or a method name");

                return function () {
                    return method.apply(target, arguments);
                };
            },

            /**
             * Для каждого элемента массива вызывает указанную функцию и сохраняет
             * возвращенное значение в массиве результатов.
             * 
             * @remarks cb может выполняться асинхронно, при этом одновременно будет
             *          только одна операция.
             * 
             * @async
             */
            pmap: function (items, cb) {
                safe.argumentNotNull(cb, "cb");

                if (items && items.then instanceof Function)
                    return items.then(function (data) {
                        return safe.pmap(data, cb);
                    });

                if (safe.isNull(items) || !items.length)
                    return items;

                var i = 0,
                    result = [];

                function next() {
                    var r, ri;

                    function chain(x) {
                        result[ri] = x;
                        return next();
                    }

                    while (i < items.length) {
                        r = cb(items[i], i);
                        ri = i;
                        i++;
                        if (r && r.then) {
                            return r.then(chain);
                        } else {
                            result[ri] = r;
                        }
                    }
                    return result;
                }

                return next();
            },

            /**
             * Для каждого элемента массива вызывает указанную функцию, результаты
             * не сохраняются
             * 
             * @remarks cb может выполняться асинхронно, при этом одновременно будет
             *          только одна операция.
             * @async
             */
            pfor: function (items, cb) {
                safe.argumentNotNull(cb, "cb");

                if (items && items.then instanceof Function)
                    return items.then(function (data) {
                        return safe.pmap(data, cb);
                    });

                if (safe.isNull(items) || !items.length)
                    return items;

                var i = 0;

                function next() {
                    while (i < items.length) {
                        var r = cb(items[i], i);
                        i++;
                        if (r && r.then)
                            return r.then(next);
                    }
                }

                return next();
            },

            /**
             * Выбирает первый элемент из последовательности, или обещания, если в
             * качестве параметра используется обещание, оно должно вернуть массив.
             * 
             * @param{Function} cb обработчик результата, ему будет передан первый
             *                  элемент последовательности в случае успеха
             * @param{Fucntion} err обработчик исключения, если массив пустой, либо
             *                  не массив
             * 
             * @remarks Если не указаны ни cb ни err, тогда функция вернет либо
             *          обещание, либо первый элемент.
             * @async
             */
            first: function (sequence, cb, err) {
                if (sequence) {
                    if (sequence.then instanceof Function) {
                        return sequence.then(function (res) {
                            return safe.first(res, cb, err);
                        }, err);
                    } else if (sequence && "length" in sequence) {
                        if (sequence.length === 0) {
                            if (err)
                                return err(new Error("The sequence is empty"));
                            else
                                throw new Error("The sequence is empty");
                        }
                        return cb ? cb(sequence[0]) : sequence[0];
                    }
                }

                if (err)
                    return err(new Error("The sequence is required"));
                else
                    throw new Error("The sequence is required");
            }
        };

        return safe;
    });