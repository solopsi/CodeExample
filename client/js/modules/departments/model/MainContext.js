define([
    "dojo/_base/declare",
    "dojo/aspect",
    "dojo/when",
    "dojo/promise/all",
    "implab/safe",
    "dojo/store/Memory",
    "dojo/store/Observable",
    "implab/Uuid",
    "dijit/tree/ObjectStoreModel",
    "dijit/registry"
], function (declare, aspect, when, all, safe, Memory, Observable, UUID, ObjectStoreModel, registry) {   
    /**
     * Специальный контекст данных для работы с моделью подразделений.
     *
     * Контекст раскладывает внутри себя информацию о подразделении, а также создает
     * дополнительные представления (хранилища) которые в дальнейшем
     * искользуются контроллером и представлением. Аггрегирует внутри себя
     * обычный контекст данных
     *
     * Вся бизнес-логика сосредоточена в данном контексте, в контроллере
     * находится только логика обработки событий пользовательского интерфейса.
     *
     */
    return declare(null, {
        _dataContext: null,

        _model: null,
        
        _departmentsStore:null,
        _levelStore: null,
        
        _departmentsTreeStore:null,

        constructor: function (opts) {
            safe.argumentNotNull(opts && opts.dataContext, "opts.dataContext");

            this._dataContext = opts.dataContext;
        },

        /**
         * инициализирует хранилища
         *
         * @async
         */
        initialize: function (opts) {
            var me = this;
            return when(me._createLevelMemoryStore(), function(levelStore){
                me._levelStore = levelStore;
                return when(me._createMemoryStore(), function (store) {
                    me._departmentsStore = store;
                    when(store.query({}), function(departments){
                        me.setLevels(departments);
                    })
                    return when(me._createDepartmentsTreeStore(),function(treeStore){
                        me._departmentsTreeStore = treeStore;
                    });
                });
            });            
        },

        /**
         * Загружает модель занятия и инициализирует контекст
         *
         * @async
         */
        loadModel: function () {
            var me = this;
            var dc = me._dataContext;
            //return when(all({
                //departments: dc.getDepartments(),
                //userProfiles: dc.getUserProfiles(),
                //users: dc.getUsers()
            //}), function (args) {
                return me.initialize(/*args*/);
            //});
        },
        _createTemplatedDepartmentsStore:function(items){
            var me = this;
            var store = new Memory({
                data : items.map(function(x, i) {
                    return {
                        id : i + 1,
                        shortName : x.shortName,
                        fullName : x.fullName,     
                        description : x.description,
                        department_id : x.id,
                        parent_id: x.parent_id,
                        selected : false,
                        treeLabel: x.shortName + " " + x.fullName,                            
                        topicRelation: x.topicRelation,
                        level: me._getLevel(x,0)
                    };
                }),
                getChildren: function(object){
                    return this.query({parent_id: object.department_id});
                },                
            });           
            
            aspect.around(store, "put", function(originalPut){                
                return function(obj, options){                    
                    if(options && options.parent){
                        if(options.parent.id == 0){
                            obj.parent_id = null;
                        }else{
                            obj.parent_id = options.parent.department_id;
                        }
                    }
                    obj.id = obj.department_id;
                    obj["level"] = null;
                    obj["level"] = me._getLevel(obj, 0);
                    console.log("store put() obj=",obj);                                                            
                    return when(me._dataContext.getDepartments().put(obj, options),function(result){
                        console.log(result);
                        if(result && result.id){
                            obj["id"] = result.id;                            
                            obj["department_id"] = result.id;
                        }else if(result == "ok"){
                            obj["department_id"] = obj.id;
                        }
                        return originalPut.call(store, obj, options);
                    })
                }
            });
            
            aspect.around(store, "remove", function(originalRemove){                
                return function(objId, options){                       
                    console.log("store remove() obj=",objId);                    
                    return when(me.getDepartmentsStore().get(objId), function(department){
                        when(me._dataContext.getDepartments().remove(department.department_id),function(result){
                            return originalRemove.call(store, objId, options);
                        });                         
                    });                    
                }
            });
            
            return new Observable(store);
        },
        setLevels:function(departments){
            var me = this;
            return when(departments.forEach(function(department){
                when(me._getLevel(department,0),function(level){
                    department["level"]=level;
                });
            }));
        },
        _getLevel:function(departmentInfo, level){
            var me = this;
            if(!(safe.isNull(departmentInfo.level))){
                return departmentInfo.level;
            }else{
                if(departmentInfo.id == 0){
                    return level;
                }else if(safe.isNull(departmentInfo.parent_id)){
                    return level+1;
                }else{
                    return when(me.getDepartmentsStore().query({"department_id":departmentInfo.parent_id}), function(departments){
                        if(departments.length > 0){
                            return me._getLevel(departments[0],level)+1;
                        }else{
                            return level;
                        }
                    });
                }
            }
        },
        _createMemoryStore: function () {
            var me = this;
            return when(me._dataContext.getDepartmentsResult() ,function(departments){
                return when(me._createTemplatedDepartmentsStore(departments),function(store){
                    return store;
                });
            })
        },
        _createLevelMemoryStore:function(){
            var me = this;
            return new Observable(new Memory({
                data:[                    
                    {id:1, name:"Центральное"},
                    {id:2, name:"Региональное"},
                    {id:3, name:"Линейное"}
                ]}));
        },
        getDepartmentsStore:function(){
            return this._departmentsStore;            
        },
        getLevelStore:function(){
            return this._levelStore;
        },
        _createDepartmentsTreeStore:function(){
            var me = this;
            return when(me.getDepartmentsStore(),function(store){
                var treeModel = new ObjectStoreModel({
                    store: store,
                    query: {parent_id:null},
                    getLabel:function(item){
                        item["treeLabel"] = item.shortName + " " + item.fullName;
                        return item.treeLabel;
                    }                
                });
                
                return treeModel;
            })
        },
        getDepartmentsTreeStore: function(){
            return this._departmentsTreeStore;
        },
        /**
         * Сохранение информации о подразделении
         * @departmentInfo {
         *      ...
         *      id: Number
         *      shortName: String
         *      fullName: String
         *      description: String      
         *      ...
         * }
         */         
        saveDepartment:function(departmentInfo){
            var me = this;            
            return when(me._createDepartmentByInfo(departmentInfo), function(item){
                return when(me.getDepartmentsStore().put(item, {                        
                    overwrite: true,                        
                }),function(result){
                        return {treeModel:me._departmentsTreeStore, item:item}
                    }
                );                    
            });             
        },
        _createDepartmentByInfo:function(departmentInfo){
            return { 
                department_id: departmentInfo.department_id,
                description: departmentInfo.description,
                fullName: departmentInfo.fullName,
                id: departmentInfo.id,
                shortName: departmentInfo.shortName,                
                parent_id: departmentInfo.parent_id,                
                treeLabel: departmentInfo.shortName + " " + departmentInfo.fullName                
            }
        },
        deleteDepartment:function(departmentInfo){
            var me = this;
            if(departmentInfo && departmentInfo.id){
                return when(me.getDepartmentsStore().query({parent_id:departmentInfo.department_id}), function(childDepartments){
                    if(childDepartments.length > 0){
                        var r = confirm("Подразделение содержит подчиненное. Хотите удалить подразделение со свеми вложенными подразделениями.");
                        if (r == true) {                            
                            var promises = [];
                            promises.push(me.getDepartmentsStore().remove(departmentInfo.id));
                            childDepartments.forEach(function(childDepartment){
                                me._createRemoveRecursivePromises(me, promises, childDepartment);
                            });
                            return when(all(promises), function(result){
                                return {treeModel:me._departmentsTreeStore, item:null}
                            });
                        } else {
                            return {treeModel:me._departmentsTreeStore, item:null}
                        } 
                    }else{
                        return when(me.getDepartmentsStore().remove(departmentInfo.id),function(){
                            return {treeModel:me._departmentsTreeStore, item:null}
                        });
                    }
                });                
            }else{
                console.warn("Не передана информация об удаляемой теме.");
            }
        },
        _createRemoveRecursivePromises:function(me, promises, department){
            when(me.getDepartmentsStore().query({parent_id:department.id}), function(childDepartments){
                childDepartments.forEach(function(childDepartment){
                    me._createRemoveRecursivePromises(me, promises, childDepartment);
                });                
            });
            promises.push(me.getDictionaryTopicsStore().remove(department.id));
        },
        /**
         * Создание новогог подразделения в DataContext
         */
        createDepartment: function(evt){
            var me = this;
            var selectedObject = null;
            if(evt.selectedObject){
                selectedObject = evt.selectedObject;
            }else{
                selectedObject = this._departmentsTreeStore.root;
            }         
            return when(me._createNewDepartment(), function(item){
                return when(me.getDepartmentsStore().put(item, {                        
                        overwrite: true,
                        parent: selectedObject                        
                    }),function(result){
                        return {treeModel:me._departmentsTreeStore, item:item}
                    }
                );                    
            });            
        },
        
        _createNewDepartment:function(){
            return {                
                shortName : "",
                fullName : "",     
                description : "",                
                parent_id: 0,
                selected : false,
                treeLabel: "",                            
                topicRelation: null,
                level: 0,
                externalSystem: "xls"
            };            
        },
        checkItemAcceptanceFunction: function(target, source, position){
            //console.log("target=",target," source=",source, " position=",position);
            var treeNodeWidget = registry.getEnclosingWidget(target);
            if(treeNodeWidget){
                var item = treeNodeWidget.item;
                //console.log("item.level=",item.level);
                if(item.level>2){
                    return false;
                }else{
                    return true;
                }
            }
            return true;
        }
    });

});