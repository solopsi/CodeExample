define([
    "require",
    "dojo/_base/declare",
    "dojo/on",
    "dojo/query",
    "core/safe",
    "dojo/dom-class",
    "dojo/when",
    "dijit/_WidgetBase",
    "dijit/_TemplatedMixin",
    "dijit/_WidgetsInTemplateMixin",    
    "implab/log/trace!",
    "asktu/controller/ViewManager",
    "dojo/text!./resources/MainView.html",
    "dojo/i18n!./nls/MainView",
    "./TreeInfoWidget",
    "./ItemEditWidget",
    /* widgets in the template */
    "dijit/layout/ContentPane",
    "dijit/layout/StackContainer",
    "dijit/layout/BorderContainer",
    "dijit/form/Button"], function(
    require,
    declare,
    on,
    dquery,
    safe,
    domClass,
    when,
    _WidgetBase,
    _TemplatedMixin,
    _WidgetsInTemplateMixin,
    trace,
    ViewManager,
    templateString,
    nls,    
    TreeInfoWidget,
    ItemEditWidget)
{
    return declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin ], {
        
        templateString : templateString,
        
        overlayWatchAttr : 'model',
        
        contextRequire : require,
        
        controller : null,
        
        _departmentsTreeInfoWidget: null, 
        _departmentEditWidget: null,        
        
        getController : function() {
            if (this.controller instanceof Function)
                this.controller = this.controller.call();
            return this.controller;
        },
        
        nls: nls,        
        
        postCreate : function() {
            this.inherited(arguments);

            var contentView = new ViewManager({
                viewport : this.contentContainer
            });
            var navView = new ViewManager({
                viewport : this.editContainer
            });

            this._views = {
                content : contentView,
                nav : navView,
                'default' : contentView
            };

            var controller = this.getController();
            if (controller)
                this.attachController(controller);
            
            this.emptyContent.set("content", nls.emptyContent);            
        },

        attachController : function(controller) {
            var me = this;

            controller.setView(me, "index");
            
            me.on('adddepartment',function(evt){
                controller.onAddDepartment(evt); 
            });
            me.on('editdepartment',function(evt){
                controller.onEditDepartment(evt); 
            });
            me.on('savedepartment',function(evt){
                controller.onSaveDepartment(evt.item); 
            });
            me.on('deletedepartment',function(evt){
                controller.onDeleteDepartment(evt.item); 
            });                      
        },

        resize:function(){
            this.inherited(arguments);
            this.layoutBorderContainer.resize();
        },
        
        /**
         * Отобразить дерево подразделений в левой часте View
         */
        showDepartmentsTreeInfo: function(checkItemAcceptanceFunction){
            var me = this;
            if(this._departmentsTreeInfoWidget){
                this.contentContainer.selectChild(this._departmentsTreeInfoWidget);
            }else{
                this._departmentsTreeInfoWidget = new TreeInfoWidget({checkItemAcceptanceFunction:checkItemAcceptanceFunction});
                this.contentContainer.addChild(this._departmentsTreeInfoWidget);
                this.contentContainer.selectChild(this._departmentsTreeInfoWidget);
            }            
            this.layoutBorderContainer.resize();
        },
        /**
         * Заполнить дерево подразделений данными
         */
        setDepartmentsTreeInfoModel: function(model){
            this._departmentsTreeInfoWidget.setModel(model.treeModel);
            this.layoutBorderContainer.resize();
        },
        /**
         * @param {item: Object{ подразделение для редактирования}} model
         */
        showDepartmentsEditWidget:function(model){
            if(this._departmentEditWidget){
                this.editContainer.selectChild(this._departmentEditWidget);                
            }else{
                this._departmentEditWidget = new ItemEditWidget();
                this.editContainer.addChild(this._departmentEditWidget);
                this.editContainer.selectChild(this._departmentEditWidget);
            }
            this._departmentEditWidget.setModel(model);
            this.layoutBorderContainer.resize();
        },

        showContentOverlay:function(){
            if(this._departmentsTreeInfoWidget){
                this._departmentsTreeInfoWidget.showOverlay('loading', {
                    watch : 'model'
                });
            }
        },
        selectTreeInfoWidgetNode:function(paths){
            if(this._departmentsTreeInfoWidget){
                this._departmentsTreeInfoWidget.selectTreeNode(paths);
            }
        }
    });
});