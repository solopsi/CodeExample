define([
    "dojo/_base/declare",
    "../safe",
    "dojo/when",
    "dojo/store/util/QueryResults" ],

function(declare, safe, when, QueryResults) {

    "use strict";

    /**
     * Обертка вокруг произвольного хранилища, только для чтения. Используется
     * для преобразования данных, например, отображения в списках элементов
     * пространственных данных.
     */
    return declare(null, {
        /**
         * @type{String} Свойство, хранящее идентификатор
         */
        idProperty : null,

        _store : null,

        /**
         * @param{String} opts.idProperty Имя свойства, в которое будет записан
         *                идентификатор, если не указан, то идентификатор будет
         *                взят из родительского хранилища или использоваться
         *                строка <code>id</code>
         * @param{dojo.store} opts.store Родительское хранилище
         */
        constructor : function(opts) {
            safe.argumentNotNull(opts, "opts");
            safe.argumentNotNull(opts.store, "opts.store");            

            this._store = opts.store;
            delete opts.store;
            declare.safeMixin(this, opts);
            this.idProperty = opts.idProperty || this._store.idProperty || "id";
        },

        getParentStore : function() {
            return this._store;
        },

        get : function(id) {
            var me = this;
            return when(me._store.get(id), function(x) {
                var m = me.mapItem(x);
                if (!(me.idProperty in m))
                    m[me.idProperty] = id;
                return m;
            });
        },

        /**
         * Выполняет запрос в родительском хранилище, для этого используется
         * <code>translateQuery</code> для подготовки запроса, затем,
         * <code>mapItem</code> для преобразования результатов.
         */
        query : function(q, options) {
            var me = this, store = this._store;
            return when(store.query(me.translateQuery(q), me
                .translateOptions(options)), function(res) {
                var total = res.total;
                var mapped = res.map(function(x) {
                    var m = me.mapItem(x);
                    if (!(me.idProperty in m))
                        m[me.idProperty] = store.getIdentity &&
                            store.getIdentity(x);
                    return m;
                });
                mapped.total = total;
                var results = new QueryResults(mapped);
                console.log(results);
                return results;
            });
        },

        getIdentity : function(obj) {
            return obj && obj[this.idProperty];
        },

        /**
         * Преобразование запроса в формат родительского хранилища.
         * 
         * @param{Object} q Запрос в формате текущего хранилища
         * @returns{Object} Запрос в формате родительского хранилища
         */
        translateQuery : function(q) {
            return q;
        },

        translateOptions : function(options) {
            return options;
        },

        /**
         * Преобразование объекта из родительского хранилища. При преобразовании
         * в объекте можно задать идентификатор, иначе идентификатор будет
         * автоматически получен и присвоен из родительского хранилища
         * 
         * @param{Object} item Объект из родительского хранилища
         * @returns{Object} результат преобразования
         */
        mapItem : function(item) {
            return item;
        }
    });

});