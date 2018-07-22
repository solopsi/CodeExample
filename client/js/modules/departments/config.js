define({
    controller : {
        $type : "modules/departments/controller/MainController",
        params : {            
            dataContext : {
                $type : "modules/departments/model/MainContext",
                params : {
                    dataContext : {
                        $dependency : "dataContext"
                    }
                }
            },
            appController : {
                $dependency : "appController"
            }
        }
    },

    // главное представление, подключается в конфиге приложения
    view : {
        $type : "modules/departments/view/MainView",
        activation : "context", // должно быть одним для всех 
        params : {
            controller : {
                $dependency : "controller"
            }
        }
    }
});