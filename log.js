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
    debug: function (message) {this.log(0, message);},
    info: function (message) {this.log(1, message);},
    warn: function (message) {this.log(2, message);},
    error: function (message) {this.log(3, message);},
    fatal: function (message) {this.log(4, message);},
    log: function (ltype, lmessage) {
        var ldate = new Date().toLocaleDateString(window.navigator.language, {year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute:'2-digit', second:'2-digit'});
        
        if (ltype >= this.level){
            console.log("%c[" + this.levels[ltype].description.toUpperCase() + "]%c " + ldate + " - %s", this.levels[ltype].style, "color: #888", lmessage);
        }
        this.history.push({
            ltype: ltype,
            ldate: ldate,
            lmessage: lmessage
        });
    }
};