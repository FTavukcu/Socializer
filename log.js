var log = {
    level: 0,
    levels: [
        {
            description: "debug",
            style: "color: #444"
        }, {
            description: "info",
            style: "color: #08f"
        }, {
            description: "warn",
            style: ""
        }, {
            description: "error",
            style: ""
        }, {
            description: "fatal",
            style: ""
        }
    ],
    history: [],
    debug: function () {this.log(0, arguments);},
    info: function () {this.log(1, arguments);},
    warn: function () {this.log(2, arguments);},
    error: function () {this.log(3, arguments);},
    fatal: function () {this.log(4, arguments);},
    log: function (ltype, lmessages) {
        var ldate = new Date().toLocaleDateString(window.navigator.language, {year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute:'2-digit', second:'2-digit'});
        
        if (ltype >= this.level){
            var message = [];
            message.push("%c[" + this.levels[ltype].description.toUpperCase() + "]%c " + ldate + " - ");
            message.push(this.levels[ltype].style);
            message.push("color: #888");
            Array.prototype.slice.call(lmessages).forEach(function(argument){
                message.push(argument);
            });
            console.log.apply(console, message);
        }
        this.history.push({
            ltype: ltype,
            ldate: ldate,
            lmessages: lmessages
        });
    }
};