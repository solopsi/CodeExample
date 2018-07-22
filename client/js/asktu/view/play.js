define([
    "dojo/Deferred", "dojo/aspect"
], function(Deferred, aspect) {
    return function(ani) {
        var d = new Deferred(function() {
            ani.stop();
        });
        aspect.after(ani, "onEnd", function(x) {
            d.resolve();
            return x;
        });
        ani.play();

        return d.promise;

    };
});