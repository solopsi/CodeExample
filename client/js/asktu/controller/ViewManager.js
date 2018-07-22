define([
    "dojo/_base/declare", "implab/safe", "dojo/when"
], function(declare, safe, when) {
    /**
     * Контроллер, управляющий октрывание/закрыванием форм использует контейнер
     * типа StackContainer для размещения форм.
     */
    return declare(null, {
        /**
         * @type{StackContainer} Панель, реализует addChild, removeChild,
         *                       selectChild
         */
        _viewport : null,

        /**
         * Сопоставление форм и ролей
         * 
         * @type{Object}
         */
        _names : null,

        /**
         * Очередь из форм, которые отображаются
         */
        _stack : null,

        /**
         * @type{Widget} текущая форма
         */
        currentForm : null,

        /**
         * @param{Object} opts.viewport Контейнер виджетов, реалищующий методы
         *                addChild, removeChild, selectChild, getChildren
         * 
         * Если opts.viewport реализует метод getChildren, тогда содержащиеся в
         * контейнере виджеты будут добавлены в контроллер
         */
        constructor : function(opts) {
            safe.argumentNotNull(opts && opts.viewport, "opts.viewport");
            var me = this;

            me._names = {};
            var vp = me._viewport = opts.viewport;

            if (vp.getChildren) {
                var children = me._stack = vp.getChildren();
                children.forEach(function(w) {
                    me._setCloseHandler(w);
                });
                var i = children.indexOf(vp.selectedChildWidget);
                if (i >= 0)
                    this._stack.splice(i, 1);

                // get selected child from the stack container
                this.currentForm = vp.selectedChildWidget;
            } else {
                this._stack = [];
            }
        },

        /**
         * Отображает указанную форму.
         * 
         * @async
         * @param{Widget} Форма для отображения
         * @param{opts.name} Имя формы. только одна форма с указанным именем
         *                   может быть показана
         * @return{Boolean}
         * @remarks
         * 
         * Виджет должен иметь событие <code>close</code>, чтобы контроллер
         * мог удалить форму из контейнера после закрытия. контроллер не
         * управляет временм жизни формы и не уничтожает ее после закрытия, что
         * позволяет повторно использовать форму.
         * 
         * Метод асинхронный поскольку если уже существет форма с указанным
         * именем, контроллер попытается ее закрыть, при этом форма может
         * выполнять асинхронные операции сохранения в хранилище, либо
         * отобразить диалоговое окно с запросом на подтверждение. Контейнер
         * виджетов также может выполнять операцию отображения формы асинхронно.
         */
        showForm : function(form, opts) {
            safe.argumentNotNull(form, "form");
            var me = this, name = opts && opts.name, d;

            if (form._destroyed)
                throw new Error("The specified form is already destroyed");

            // если указанная форма уже присутсвует в контейнере
            // тогда сделаем ее активной
            if (me.currentForm === form)
                return form; // уже активна

            if (me._stack.indexOf(form) >= 0)
                return me._selectForm(form);

            // если для формы указана роль
            if (name) {
                var formToClose = me._names[name];
                if (formToClose) {
                    // закрываем форму, при этом форма может
                    // запросить у пользователя подтверждение,
                    // либо выплнить асинхронную операцию сохранения
                    d = formToClose.close();
                }
            }

            return when(d, function() {
                // форма еще не отображалась
                me._viewport.addChild(form);
                me._names[name] = form;

                me._setCloseHandler(form, name);

                return me._selectForm(form);
            });

        },

        contains : function(form) {
            if (!form)
                return false;
            if (this.currentForm === form)
                return true;
            if (this._stack.indexOf(form) >= 0)
                return true;
            return false;
        },

        isVisible : function(form) {
            return (this.currentForm === form);
        },

        _setCloseHandler : function(form, name) {
            var me = this;

            var hs = [];

            hs.push(form.on('form-activate', function() {
                me._selectForm(form);
            }));

            // добавляем обработчик закрытия формы
            hs.push(form.on('form-close', function() {
             // обработчик должен сработать однократно
                hs.forEach(function(h) {
                    h.remove();
                });
                
                if (name)
                    me._names[name] = undefined;

                if (me.currentForm === form) {
                    me.currentForm = null;
                    var prev = me._stack.pop();
                    if (prev)
                        me._selectForm(prev);
                } else {
                    var i = me._stack.indexOf(form);
                    if (i >= 0)
                        me._stack.splice(i, 1);
                }

                when(me._viewport.removeChild(form), function() {
                    // после того, как форма убрана из представления ее нужно об
                    // этом оповестить.
                    if (form.onRemoved)
                        form.onRemoved();
                });
            }));
        },

        /**
         * Перемещает форму на передний план
         * 
         * @async
         */
        _selectForm : function(form) {
            var me = this, current = this.currentForm;

            // только если текущая форма отличается от указанной
            if (current !== form) {

                // находим у удаляем форму из стека
                // т.е. принудительно поднимаем ее наверх
                var i = me._stack.indexOf(form);
                if (i >= 0)
                    me._stack.splice(i, 1);

                if (current) {
                    me._stack.push(current);
                    if (current.onDeactivated)
                        current.onDeactivated();
                }

                if (form.onActivated)
                    form.onActivated();

                me.currentForm = form;

                return when(me._viewport.selectChild(form), function() {
                    return form;
                });
            }
        }
    });
});