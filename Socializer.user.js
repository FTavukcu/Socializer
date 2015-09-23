// ==UserScript==
// @name         Socializer
// @namespace    https://github.com/FTavukcu/Socializer
// @version      0.2
// @description  Be more social - fully automated
// @author       Fatih Tavukcu
// @include      https://w3-connections.ibm.com/blogs/Socializer/*
// @grant        none
// @require      http://code.jquery.com/jquery-latest.js
// ==/UserScript==

/* xml2json jquery extension by Fatih Tavukcu
* Version 0.1 - 2014-06-05
*/
(function($){$.xml2json={nodeType:{1:'ELEMENT',2:'ATTRIBUTE',3:'TEXT',4:'CDATA_SECTION',5:'ENTITY_REFERENCE',6:'ENTITY',7:'PROCESSING_INSTRUCTION',8:'COMMENT',9:'DOCUMENT',10:'DOCUMENT_TYPE',11:'DOCUMENT_FRAGMENT',12:'NOTATION'},translate:function(source,benchmark){var xml=$.isXMLDoc(source)?source:$.parseXML(source);var start=Date.now();var result=$.extend({},$.xml2json.extend(xml));if(typeof benchmark!="undefined")
if(benchmark)
console.log("Time taken: "+(Date.now()-start)+" ms");return result;},extend:function(xml){switch($.xml2json.nodeType[xml.nodeType]){case'ELEMENT':var element={};element[xml.nodeName]={};$.each(xml.attributes,function(n,xmlAttribute){var attribute={};attribute["_"+xmlAttribute.name]=xmlAttribute.value;$.extend(element[xml.nodeName],attribute);});$.each(xml.childNodes,function(n,xmlChild){var child=$.xml2json.extend(xmlChild);if(child!=null){switch($.xml2json.nodeType[xmlChild.nodeType]){case"ELEMENT":if(typeof element[xml.nodeName][xmlChild.nodeName]=="undefined")
element[xml.nodeName][xmlChild.nodeName]=[];element[xml.nodeName][xmlChild.nodeName].push(child[Object.keys(child)[0]]);break;case"TEXT":if(typeof element[xml.nodeName]["__text"]=="undefined")
element[xml.nodeName]["__text"]="";element[xml.nodeName]["__text"]+=child[Object.keys(child)[0]];break;default:$.extend(element[xml.nodeName],child);break;}}});return element;break;case'ATTRIBUTE':var attribute={};attribute[xml.nodeName]=xml.nodeValue;return attribute;break;case'TEXT':var text=$.trim(xml.nodeValue);return text.length==0?null:{"__text":text};break;case'CDATA_SECTION':var cdata=$.trim(xml.nodeValue);return cdata.length==0?null:{"__cdata":cdata};break;case'PROCESSING_INSTRUCTION':return null;break;case'DOCUMENT':var document={}
$.each(xml.childNodes,function(n,xmlchild){var child=$.xml2json.extend(xmlchild);if(child!=null)
$.extend(document,child);});return document;break;}}}})(jQuery);



console.log("Socializer 0.2 by Fatih Tavukcu");

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