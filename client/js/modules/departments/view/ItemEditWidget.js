define([
    "require",
    "dojo/_base/declare",
    "implab/safe",
    "dojo/on",
    "dojo/dom-class",
    "dojo/dom-attr",
    "dojo/query",
    "dijit/_WidgetBase",
    "dijit/_TemplatedMixin",
    "dijit/_WidgetsInTemplateMixin",
    "dijit/Tree",
    "asktu/view/_OverlayFormMixin",
    "dojo/text!./resources/ItemEditWidget.html",
    "implab/text/format",    
    "dojo/i18n!./nls/MainView",
    "dojo/store/Memory",
    "implab/data/StoreAdapter",
    "dojo/_base/lang",
    "dijit/tree/ObjectStoreModel",

    "dijit/form/FilteringSelect",
    "dijit/form/TextBox",
    "dijit/form/Textarea"
], function(
    require,
    declare,
    safe,
    on,
    domClass,
    dattr,
    dquery,
    _WidgetBase,
    _TemplatedMixin,
    _WidgetsInTemplateMixin,
    Tree,
    _OverlayFormMixin,
    templateString,
    format,    
    nls,
    Memory,
    StoreAdapter,
    lang,
    ObjectStoreModel)
{

    return declare([
        _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, _OverlayFormMixin
    ], {

        templateString : templateString,

        contextRequire : require,

        nls : nls,

        overlayWatchAttr : 'model',

        overlayOnCreate : null,

        levelStore: null,

        model : null,
        /**
         * @model{item:Object}
         */
        _setModelAttr : function(model) {
            if (model) {      
                if(model.levelStore){
                    this.levelStore = model.levelStore;
                    this.levelSelect.set("store", model.levelStore);
                }         
                if (model.item) {
                    this._onShowEditableItem(model.item);
                }                
            }
            this._set('model', model);
        },

        /**
         * convenience method
         */
        setModel : function(model) {
            this.showOverlay('loading', {
                watch : 'model'
            });
            this.set('model', model);
            this.hideOverlay('loading', {
                watch : 'model'
            });
        },
        /*
        constructor:function(){
            this.inherited(arguments);            
        },
        */
        postCreate : function() {
            var me = this;            
            on(this.saveButton, "click", function() {
                me._onSave();
            });
            on(this.cancelButton, "click", function() {
                me._onCancelEdit();
            });
            on(this.deleteButton, "click", function() {
                me._onDelete();
            })
        },
        _onShowEditableItem : function(item) {
            this._editableItem = item;            
            if (item.shortName) {
                this.shortName.set("value", item.shortName);
            } else {
                this.shortName.set("value", "");
            }
            if (item.fullName) {
                this.fullName.set("value", item.fullName);
            } else {
                this.fullName.set("value", "");
            }
            if (item.level) {
                this.levelSelect.set("value", item.level);
            } else {
                this.levelSelect.set("value", "");
            }
            if (item.description) {
                this.description.set("value", item.description);
            } else {
                this.description.set("value", "");
            }
            domClass.remove(this.editFormContainer, "hidden");            
        },
        _onSave : function(department) {
            if (!department && this.model.item) {
                // TODO:Провести валидацию

                // Создать объект                
                this.model.item.shortName = this.shortName.get("value");
                this.model.item.fullName = this.fullName.get("value");
                this.model.item.level = this.levelSelect.get("value");
                this.model.item.description = this.description.get("value");
                department = this.model.item;
            }
            this.emit("savedepartment", {item:department});
        },
        _onDelete : function(department) {
            if (!department && this.model.item) {
                department = this.model.item;
            }
            this.emit("deletedepartment", {item:department});
            this._clearFields();
        },
        _onCancelEdit : function() {
            domClass.add(this.editFormContainer, "hidden");
            this._clearFields();
        },
        _clearFields : function() {
            //this.parentSelect.set("value", "");
            this.shortName.set("value", "");
            this.fullName.set("value", "");
            this.levelSelect.set("value", "");
            this.description.set("value", "");
        }    
    });
});