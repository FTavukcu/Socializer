// ==UserScript==
// @name         Socializer
// @namespace    https://github.com/FTavukcu/Socializer
// @version      0.2.2
// @description  Be more social - fully automated
// @author       Fatih Tavukcu
// @include      https://w3-connections.ibm.com/blogs/Socializer/*
// @grant        none
// @require      http://code.jquery.com/jquery-latest.js
// @require      https://github.com/FTavukcu/Socializer/raw/master/xml2json.js
// @require      https://github.com/FTavukcu/Socializer/raw/master/log.js
// @downloadURL  https://github.com/FTavukcu/Socializer/raw/master/Socializer.user.js
// ==/UserScript==

log.info("Socializer 0.2.2 by Fatih Tavukcu - Local");

var $dashboard = $("<div data-ft-app='Socializer'><input type='checkbox' data-ft-data='config'></div>");
$('#entries').hide().after($dashboard);


var FT = {
    app: {},
    initApp: function(appname, data){
        log.debug('FT.Initializing "' + appname + '"');
        FT.app[appname] = data;
    },
    compile: function(jqobj){
        log.debug('FT.Compiling "' + jqobj + '"');
        jqobj.find('[data-ft-app]').each(function(app){
            console.log("App", app);
        });
    }
};


FT.initApp('Socializer', {
    config: true
});

FT.compile($dashboard);




var Socializer = {														// Don't touch anything before this point
    me: "fatih.tavukcu@de.ibm.com",  					// Replace with your email
    checkEveryXMinutes: 60,										// Socializer will check once at startup and then every specified amount of minutes again for updates on all selected blogs
    monitoredBlogs: ["WebDev", "testblogf"],	// The shortname of the blog. Take it from the URL. F.e.: https://w3-connections.ibm.com/blogs/WebDev/... => WebDev (attention, case sensitive)
    messages: [{
            matches: [/cloud/gi],							// An array of regular expressions. The more they match the content, the likelier one of the following responses will be randomly selected		
            responses: ["Concentrating on the technological advancements in the cloud is crucial for our CAMSS targets. Great post!"]
        }, {
            matches: [/mobile/gi, /apple/gi],
            responses: ["The future is now!", "Fantastic post. Mobile is the future."]
        }, {
            default: true,
            matches: [/default/],
            responses: ["Thanks for this post!", "Great post!", "Very good post. Interesting read."]
        }
    ],																				// Don't touch anything after this point
    root: "https://w3-connections.ibm.com/blogs/",
    comment: function (entry, blog) {
        var content = entry.content[0].__text;
        var scores = [];
        Socializer.messages.forEach(function(analyser, n){
            var score = 0;
            if (!analyser.default){
                analyser.matches.forEach(function(matcher){
                    var matches = content.match(matcher);
                    if (matches)
                        score += matches.length * 2;
                });
            } else
                score = 1;
            scores.push(score);
        });
        var takeMessageFrom = scores.indexOf(Math.max.apply(window, scores));
        
        console.log("Will pick from " + Socializer.messages[takeMessageFrom].matches.join(';'));
        var responses = Socializer.messages[takeMessageFrom].responses;
        var response = responses[Math.floor(Math.random() * responses.length)];
        console.log("Chosen response", '"' + response + '"');
        
        var strData = '<?xml version="1.0" encoding="UTF-8"?>';
        strData += '<entry xmlns="http://www.w3.org/2005/Atom" xmlns:thr="http://purl.org/syndication/thread/1.0">';
        strData += '<id>ignored</id><title type="text">ignored</title>';
        strData += '<thr:in-reply-to ref="' + entry.id[0].__text + '"/>';
        strData += '<content type="html">' + response + '</content></entry>';
 
        $.ajax({
            url : "https://w3-connections.ibm.com/blogs/" + blog + "/api/comments",
            type : "POST",
            contentType: "application/atom+xml",
            async : true,
            data: strData,
            statusCode : {
                201 : function() {
                    console.log('Comment "' + response + '" created in ' + entry["_xml:base"]);
                }
            },
            error: function(jqXHR, textStatus, errorThrown) {
                console.log(jqXHR + " - " + textStatus + ' - ' + errorThrown);
            }
        });
    }, checkPost: function(entry, blog) {
        $.ajax({
            url: entry.link[2]._href,
            type: "GET",
            contentType: "application/atom+xml",
            async: true,
            statusCode: {
                200: function(xml) {
                    var json = $.xml2json.translate(xml);
                    var comments = json.feed.entry;
                    var iCommented = false;
                    if (comments){
                        comments.forEach(function(comment){
                            if (comment.author[0].email[0].__text.toLowerCase() == Socializer.me)
                                iCommented = true;
                        });
                    }
                    if (!iCommented){
                        console.log("No comment by " + Socializer.me + " found in " + entry["_xml:base"] + " -> will create comment...");
                        Socializer.comment(entry, blog);
                    } else {
                        console.log(entry["_xml:base"] + " already contains a comment by " + Socializer.me);
                    }
                }
            }
        });
//        console.log("Entry", entry);
    }, checkBlogs: function(blogs) {
        console.log("Checking all blogs: " + blogs.join(',') + " ...");
        console.log("Next check in " + Socializer.checkEveryXMinutes + " minutes.");
        blogs.forEach(function(blog){
            $.ajax({
                url: Socializer.root + blog + "/feed/entries/atom",
                type: "GET",
                contentType: "application/atom+xml",
                async: true,
                statusCode: {
                    200: function(xml) {
                        var json = $.xml2json.translate(xml);
                        json.feed.entry.forEach(function(entry){
                            Socializer.checkPost(entry, blog);
                        });
                    }
                }
            });
        });
   }, start: function() {
       Socializer.checkBlogs(Socializer.monitoredBlogs);
       window.setInterval(function(){
           Socializer.checkBlogs(Socializer.monitoredBlogs);
       }, Socializer.checkEveryXMinutes * 1000 * 60);
    }
}

//Socializer.start();