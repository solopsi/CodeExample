define([
    "dojo/_base/declare",
    "dojo/on",
    "dojo/promise/all",
    "dojo/when",
    "implab/safe",
    "implab/log/trace!"
], function (
    declare,
    on,
    all,
    when,
    safe,
    trace
) {
    return declare([], {

        _dataContext: null,

        _appController: null,

        _currentDepartmentId: null,

        constructor: function (opts) {
            safe.argumentNotNull(opts && opts.dataContext, "opts.dataContext");
            safe.argumentNotNull(opts.appController, "opts.appController");

            safe.mixin(this, opts, {
                dataContext: "_dataContext",
                appController: "_appController"
            });
        },

        setView: function (view, type) {
            var me = this;
            me._view = view;
            view.startup();
            me._view.showDepartmentsTreeInfo(me._dataContext.checkItemAcceptanceFunction);
            me.loadModel();
        },

        loadModel: function () {
            var me = this;
            me._view.showContentOverlay();
            when(me._dataContext.loadModel(), function () {
                me.onDepartmentsTreeInfoLoadModel();
            });
        },

        onDepartmentsTreeInfoLoadModel: function () {
            var me = this;
            /*
            when(me._dataContext._dataContext.getDepartments(),function(store){                
                me._view.showDepartmentsTreeInfo({store:store});                    
            });
            */
            when(me._dataContext.getDepartmentsTreeStore(), function (store) {
                me._view.setDepartmentsTreeInfoModel({
                    treeModel: store
                });
            });
        },

        onAddDepartment: function (evt) {
            var me = this;
            when(me._dataContext.createDepartment(evt), function (result) {
                console.log("Добавлено новое подразделение.");
                var paths = [];
                paths = me.getPathToNode(paths, result.item, result.treeModel);
                if (paths && paths.length > 0) {
                    me._view.selectTreeInfoWidgetNode([paths.reverse()]);
                    me.onEditDepartment(result);
                }
            });
        },
        onEditDepartment: function (evt) {
            var me = this;
            console.log("Редактировать подразделение ", evt.item);
            when(me._dataContext.getLevelStore(), function (store) {
                me._view.showDepartmentsEditWidget({
                    levelStore: store,
                    item: evt.item
                });
            });
        },
        onSaveDepartment: function (department) {
            var me = this;
            console.log("Сохранить подразделение ", department);
            when(me._dataContext.saveDepartment(department), function (result) {
                console.log("Выполнено сохранение подразделения.");
            });

        },
        onDeleteDepartment: function (department) {
            var me = this;
            console.log("Удалить подразделение ", department);
            when(me._dataContext.deleteDepartment(department), function (result) {
                console.log("Выполнено удаление подразделения.");
            });
        },
        getPathToNode: function (paths, item, treeModel) {
            var me = this;
            if (item && item.department_id) {
                paths.push(item);
                console.log(item);
                if (item.parent_id && treeModel && treeModel.store && treeModel.store.get) {
                    var parentItems = treeModel.store.query({
                        department_id: item.parent_id
                    });
                    if (treeModel.store.query({
                            department_id: item.parent_id
                        }).length == 1) {
                        var parentItem = parentItems[0];
                        if (parentItem) {
                            paths = me.getPathToNode(paths, parentItem, treeModel);
                        }
                    }
                }
            }
            return paths;
        }
    });
});