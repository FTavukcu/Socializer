// ==UserScript==
// @name         Socializer
// @namespace    https://github.com/FTavukcu/Socializer
// @resource     materialicons https://fonts.googleapis.com/icon?family=Material+Icons
// @version      1.0.2
// @description  Be more social - fully automated
// @author       Fatih Tavukcu
// @match        https://w3-connections.ibm.com/blogs/Socializer/*
// @grant        GM_addStyle
// @grant        GM_getResourceText
// @run-at       document-end
// @require      http://code.jquery.com/jquery-latest.js
// @require      https://ajax.googleapis.com/ajax/libs/angularjs/1.4.6/angular.min.js
// @require      https://github.com/FTavukcu/Socializer/raw/master/xml2json.js
// @require      https://github.com/FTavukcu/Socializer/raw/master/log.js
// @downloadURL  https://github.com/FTavukcu/Socializer/raw/master/Socializer.user.js
// ==/UserScript==

var version = '1.0.2';
log.info('Socializer ' + version);

GM_addStyle(GM_getResourceText("materialicons"));

GM_addStyle("\
	div.pool {z-index: 1000}\
	div.pool ul.tabber {margin-top: 20px;}\
	ul.tabber > li.tab {display: inline-block;margin-right: 1px; }\
	ul.tabber > li.tab:first-child > label {border-top-left-radius: 4px;}\
	ul.tabber > li.tab:last-child > label {border-top-right-radius: 4px;}\
	ul.tabber > li.tab > label > input[type='radio'] {display: none;}\
	ul.tabber > li.tab > label {padding: 10px 20px; background: #bbb; font-weight: bold; color: #fff;}\
	ul.tabber > li.tab > label.checked {background: #f2f2f2; color: #666;}\
	input[type='checkbox'], label, button {cursor:pointer;}\
	ul.tabber > li.tab > label.btn {background: #0af; color: #fff;}\
	div.pool table td{text-align: center; vertical-align: top; padding: 2px 5px;}\
	div.pool table {background: #f2f2f2; color: #666; margin-top: 10px; width: 740px; padding-top: 10px; padding-bottom: 10px; border-top-right-radius: 4px;}\
	div.pool button {background: transparent; color: #666; font-weight: bold; border:0; margin: 0px;padding:0px;}\
	div.pool input[type='text'] {border:0; outline:0; padding: 2px 4px; margin: 0px 2px 4px 0px;}\
	.material-icons {font-size: 14px; vertical-align: text-bottom;}\
	.material-icons.red {color:#d04;}\
	.material-icons.blue {color:#0af;}\
	#loader{display:none;}\
	div.pool[data-ng-cloak]~#loader{display:block;}\
	div.pool table tr.notification td{text-align: left;}\
	div.pool table button.settings {padding: 10px 20px; color: #fff;border-radius: 2px;}\
	div.pool table button.settings.save {background:#19f}\
	div.pool table button.settings.reset {background:#f12}\
    #notcont {max-height:400px; overflow: auto;}\
	");

var $dashboard = $("\
		<h1>Socializer Dashboard</h1>\
		<div class='pool' data-ng-app='Socializer' data-ng-cloak>\
		  <div data-ng-controller='MainCtrl'>\
		    <div id='notcont'><table id='notifications' data-ng-show='notifications.length>0'>\
		      <tr><td>Date</td><td>Notification</td><td>Confirm</td></tr>\
		      <tr data-ng-repeat='notification in notifications' class='notification'><td width='20%'>{{notification.date.toLocaleString()}}</td><td width='70%'><div ng-bind-html='notification.html | unsafe'></div></td><td width='10%'><button class='confirmer' data-ng-if='notification.confirm' data-ng-click='publishPostN(notification.confirm, $index)'>Yes</button></td></tr>\
		      <tr><td></td><td><button data-ng-click='clearNot()'>Clear all notifications</button> | <button data-ng-click='publishAll()'>Publish all</button></td></tr>\
		    </table></div>\
		    <table>\
		      <tr data-ng-if='data.blogs.length > 0' style='font-weight: bold'><td></td><td>Blog name</td><td>Reply pool</td><td>Check interval</td><td>Ignore posts before</td><td>Mode</td></tr>\
		      <tr data-ng-repeat='blog in data.blogs'>\
		        <td><button data-ng-click='removeBlog($index)'><i class='material-icons red'>remove_circle_outline</i></button></td>\
		        <td><input data-ng-model='blog.name' size='6' data-ng-change='disableBlog(blog)'><a data-ng-show='blog.name.length>0' data-ng-href='{{data.root}}/{{blog.name}}' target='_BLANK' title='Visit'><i class='material-icons'>launch</i></a></td>\
		        <td><select data-ng-model='blog.pool' data-ng-init='blog.pool = blog.pool || 0' data-ng-options='$index as pool.title for pool in data.pools' data-ng-change='disableBlog(blog)'></select></td>\
		        <td>Every <input data-ng-model='blog.timer' size='2' data-ng-change='disableBlog(blog)'> min.</td>\
		        <td><input type='date' data-ng-model='blog.ignorebefore' size='10' data-ng-change='disableBlog(blog)'></td>\
		        <td><i class='material-icons'>{{getIcon(blog.mode)}}</i><select data-ng-model='blog.mode' data-ng-init='blog.mode = blog.mode || 0' data-ng-options='mode.value as mode.name for mode in validModes(blog)' data-ng-change='updateBlog(blog)'></select></td>\
		      </tr>\
		      <tr data-ng-if='data.blogs.length > 0'><td colspan='6'><hr/></td></tr>\
		      <tr><td colspan='6'><button data-ng-click='addBlog();'><i class='material-icons blue'>add_circle_outline</i> Add Blog</button></td></tr>\
		      <tr><td colspan='6'><hr/></td></tr>\
		      <tr><td colspan='6'>Blogs will be monitored in the specified interval for new blog posts and will use answers from the selected reply pools. If no reply pools are available, make sure to create one right below.</td></tr>\
		    </table>\
		    <form><ul class='tabber'>\
		      <li class='tab'><label class='btn' data-ng-click='addPool()'><i class='material-icons'>add_circle_outline</i> Add reply pool</label></li><li class='tab' data-ng-repeat='pool in data.pools'><label data-ng-class=\"$index==selectedPool?'checked':''\"><input name='selectedPool' data-ng-value='$index' type='radio' data-ng-model='$parent.selectedPool'><button data-ng-if='$index==selectedPool' data-ng-click='removeFrom(data.pools, $index)' title='Remove this reply pool'><i class='material-icons red'>remove_circle_outline</i></button> <span data-ng-if='$index!=selectedPool'>{{pool.title}}</span><input data-ng-if='$index==selectedPool' size='6' type='text' data-ng-model='pool.title'></label></li>\
		    </ul></form>\
		    <table data-ng-repeat='pool in data.pools' data-ng-if='$index==selectedPool' style='margin-top:-8px;'>\
		      <tbody data-ng-if='pool.matches.length > 0'>\
		      <tr><td><b title='Regular expression'>Match</b></td><td><b>Possible responses</b></td></tr>\
		      <tr data-ng-repeat-start='match in pool.matches'>\
		        <td><button data-ng-click='removeFrom(pool.matches, $index)' title='Remove this match'><i class='material-icons red'>remove_circle_outline</i></button> <input type='text' data-ng-model='match.regex' placeholder='Enter a regular expression'> <label title='case insensitive'>i<input type='checkbox' data-ng-model='match.caseinsensitive'></label></td>\
		        <td><div data-ng-repeat='response in match.responses track by $index'><button data-ng-click='removeFrom(match.responses, $index)' title='Remove this response'><i class='material-icons red'>remove_circle_outline</i></button> <input type='text' placeholder='Please enter a text' size='60' data-ng-model='match.responses[$index]'></div><div><button data-ng-click='addResponse(match.responses)'><i class='material-icons blue'>add_circle_outline</i> Add response</button></div></td>\
		      </tr>\
		      <tr data-ng-repeat-end=''><td colspan='2'><hr/></td></tr>\
		      </tbody>\
		      <tr><td colspan='2'><button data-ng-click='addMatch(pool)'><i class='material-icons blue'>add_circle_outline</i> Add match</button></td></tr>\
		      <tr data-ng-repeat-end=''><td colspan='2'><hr/></td></tr>\
		      <tr><td colspan='2'>Automated replies on blog posts will be randomly selected from these reply pools. The more matches a match has in a blog post, the more likely a response for that match will be chosen. Enter default as match for cases where no match is found. A list of usable variables<dl style='text-align: left;'>\
		      <dt><b>Available variables in responses</b></dt>\
		        <dt>%fullname%</dt><dd>The full name of the blog poster</dd>\
		        <dt>%name%</dt><dd>The name of the blog poster</dd>\
		        <dt>%surname%</dt><dd>The surname of the blog poster</dd>\
		      </dl></td></tr>\
		    </table>\
		    <table><tr><td><button class='reset settings' data-ng-click='reset()'>Reset settings</button></td><td><button class='save settings' data-ng-click='save()'>Save settings</button></td></tr>\
		    <tr><td colspan='2'>Make sure to bookmark this page with [CTRL]+D/&#8984;+D - If you close this dashboard, Socializer will stop checking for updates and posting comments. If you want to give some feedback, please head over to the <a href='https://w3-connections.ibm.com/blogs/Socializer-Discussion/'>Socializer Discussion blog</a> and leave a comment.</td></tr><tr><td colspan='2'>Socializer v" + version + " - 2015 by <a href='mailto:fatih.tavukcu@de.ibm.com' target='_BLANK'>Fatih Tavukcu</a></td></tr></table>\
		  </div>\
		</div>\
		<div id='loader'>Socializer is initializing, please wait...</div>\
		");

angular.module('Socializer', []).controller('MainCtrl', ['$scope', '$http', '$interval', '$compile', function ($scope, $http, $interval, $compile) {
			$scope.classes = {
				Pool : function (title, matches) {
					var $this = this;
					$this.title = title;
					$this.matches = [];
					if (matches)
						matches.forEach(function (match) {
							$this.matches.push(match);
						});
				},
				Match : function (regex, global, caseinsensitive, responses) {
					var $this = this;
					$this.regex = regex;
					$this.global = global;
					$this.caseinsensitive = caseinsensitive;

					$this.responses = [];
					if (responses)
						responses.forEach(function (response) {
							$this.responses.push(response);
						});
				},
				Blog : function (name, timer, mode, ignorebefore, pool) {
					this.name = name; // The url for the blog https://w3-connections.ibm.com/blogs/this_is_the_blog_name/
					this.timer = timer; // How often it should be checked for new posts in minutes
					this.mode = mode; // See $scope.global.modes, this takes the value
					this.ignorebefore = ignorebefore; // Ignore posts before this date to prevent the Socializer from posting to older blog posts
					this.pool = pool; // Which pool should be used to select answers
				}
			};

			$scope.save = function () {
				if (confirm('This will overwrite your previous settings')) {
					localStorage['Socializer'] = JSON.stringify($scope.data);
					log.info("Saved all settings");
				}
			};

			$scope.publishAll = function () {
				if (confirm('Publish all posts?')) {
					$scope.notifications.forEach(function (notification) {
						$scope.publishPostN(notification.confirm);
					});
					$('#notifications tr.notification button.confirmer').prop('disabled', true).text('Published');
				}
			};

			$scope.clearNot = function () {
				if (confirm('Clear all notifications?')) {
					$scope.notifications = [];
					$scope.posts = {};
				}
			};

			$scope.reset = function () {
				if (confirm('This will reset your settings')) {
					$scope.data = {
						pools : [],
						blogs : [],
						me : window.eval('currentLogin.email'),
						root : window.eval('BlogsBaseUrl') // "/blogs"
					};
					localStorage['Socializer'] = JSON.stringify($scope.data);
					log.info("Resetted all settings");
					$scope.notifications = [];
				}
			};

			$scope.global = {
				modes : [{
						value : 0,
						name : 'Inactive',
						icon : 'not_interested'
					}, {
						value : 1,
						name : 'Only notify',
						icon : 'sms'
					}, {
						value : 2,
						name : 'Wait for approval',
						icon : 'play_circle_outline'
					}, {
						value : 3,
						name : 'Fully automated',
						icon : 'autorenew'
					}
				]
			};
			$scope.notifications = [];
			$scope.posts = {};

			$scope.retrieve = function (str) {
				var obj = JSON.parse(str);
				obj.blogs.forEach(function (blog) {
					blog.ignorebefore = new Date(blog.ignorebefore);
				});
				return obj;
			};

			$scope.data = localStorage['Socializer'] ? $scope.retrieve(localStorage['Socializer']) : {
				pools : [],
				blogs : [],
				me : window.eval('currentLogin.email'),
				root : window.eval('BlogsBaseUrl') // "/blogs"
			};

			$scope.selectedPool = 0;

			$scope.addPool = function () {
				$scope.data.pools.push(new $scope.classes.Pool('New Pool'));
				$scope.selectedPool = $scope.data.pools.length - 1;
			};

			$scope.addMatch = function (pool) {
				pool.matches.push(new $scope.classes.Match('default', true, true, ['']));
			};

			$scope.addBlog = function () {
				$scope.data.blogs.push(new $scope.classes.Blog('', 60, 0, new Date(), 0));
			};

			$scope.addResponse = function (responses) {
				responses.push('');
			};

			$scope.removeBlog = function (index) {
				if ($scope.data.blogs[index].interval)
					window.clearInterval($scope.data.blogs[index].interval);
				$scope.removeFrom($scope.data.blogs, index);
			};

			$scope.removeFrom = function (obj, index) {
				obj.splice(index, 1);
			};

			$scope.runBlog = function (blog) {
				log.debug("Running Blog", blog);
				if (blog.mode > 0) {
					blog.interval = window.setInterval(function () {
							$scope.checkBlog(blog);
						}, parseInt(blog.timer) * 1000 * 60);
					$scope.checkBlog(blog);
				}
			};

			$scope.run = function () {
				$scope.data.blogs.forEach(function (blog) {
					$scope.runBlog(blog);
				});
			};

			$scope.validModes = function (blog) {
				if (blog.name.length > 0 && parseInt(blog.timer) > 0 && $scope.data.pools.length > 0 && blog.pool != null)
					return $scope.global.modes;
				else
					return [$scope.global.modes[0]];
			};

			$scope.checkBlog = function (blog) {
				log.debug("Checking blog", blog.name);
				$scope.notifications.push({
					blog : blog,
					date : new Date(Date.now()),
					html : 'Checking "' + blog.name + '"...'
				});
				$.ajax({
					url : $scope.data.root + "/" + blog.name + "/feed/entries/atom",
					type : "GET",
					contentType : "application/atom+xml",
					async : true,
					statusCode : {
						200 : function (xml) {
							log.debug("checkBlog response received", xml);
							var json = $.xml2json.translate(xml);
							json.feed.entry.forEach(function (entry) {
								$scope.checkPost(entry, blog);
							});
						}
					}
				});
			};

			$scope.checkPost = function (entry, blog) {
				log.debug("Checking post", entry);
				if (new Date(entry.published[0].__text) > new Date(blog.ignorebefore)) {
                    var replyurl = false;
                    entry.link.forEach(function(link){
                        if (link._rel == "replies")
                            replyurl = link._href;
                    });
                    if (replyurl){
                        $.ajax({
                            url : replyurl,
                            type : "GET",
                            contentType : "application/atom+xml",
                            async : true,
                            statusCode : {
                                200 : function (xml) {
                                    log.debug("checkPost response comments list received", xml);
                                    var json = $.xml2json.translate(xml);
                                    log.debug("JSON", json);
                                    var comments = json.feed?json.feed.entry:json.entry;
                                    var iCommented = false;
                                    if (comments) {
                                        comments.forEach(function (comment) {
                                            if (comment.author[0].email[0].__text.toLowerCase() == $scope.data.me)
                                                iCommented = true;
                                        });
                                    }
                                    if (!iCommented) {
                                        log.info("No comment by " + $scope.data.me + " found in " + entry["_xml:base"]);
                                        if (blog.mode == 1)
                                            $scope.notifications.push({
                                                blog : blog,
                                                entry : entry,
                                                date : new Date(Date.now()),
                                                html : 'Post "<a href="' + entry["_xml:base"] + '" target="_BLANK">' + entry.title[0].__text + '</a>" found with no comment.'
                                            });
                                        if (blog.mode > 1) {
                                            if (!$scope.posts[entry["_xml:base"]] || blog.mode == 3)
                                                $scope.comment(entry, blog);
                                        }
                                    } else {
                                        log.info(entry["_xml:base"] + " already contains a comment by " + $scope.data.me);
                                    }
                                    $scope.$digest();
                                }
                            }
                        });
                    } else
                        log.error("This entry doesn't have any link to comments.");
				} else
					log.warn("This entry is older than the ignore before set for this blog", blog.ignorebefore);
			};

			$scope.comment = function (entry, blog) {
				log.debug("Commenting on entry ...", entry);
				var content = entry.content[0].__text;
				var scores = [];
				var pool = $scope.data.pools[blog.pool - 1];
				log.debug('Selected pool for', blog, 'is', post);
				pool.matches.forEach(function (matcher) {
					log.debug('Matching', content, 'with', matcher.regex);
					var score = 0;
					if (matcher.regex != 'default') {
						var matches = content.match(new RegExp(matcher.regex, (matcher.global ? 'g' : '') + (matcher.caseinsensitive ? 'i' : '')));
						if (matches)
							score += matches.length * 2;
					} else
						score = 1;
					log.debug('Score', score);
					scores.push(score);
				});
				var takeMessageFrom = scores.indexOf(Math.max.apply(window, scores));

				log.debug("Will pick from " + pool.matches[takeMessageFrom].regex);
				var responses = pool.matches[takeMessageFrom].responses;
				var response = responses[Math.floor(Math.random() * responses.length)];

				var author = entry.author[0].name[0].__text.split(' ');
				var a_name = author.shift();
				var a_surname = author.join(' ');
				var rpl = {
					"\%fullname\%" : entry.author[0].name[0].__text,
					"\%name\%" : a_name,
					"\%surname\%" : a_surname
				}

				$.each(rpl, function (regex, value) {
					response = response.replace(new RegExp(regex, "gi"), value);
				});
				log.debug("Chosen response", '"' + response + '"');

				var strData = '<?xml version="1.0" encoding="UTF-8"?>';
				strData += '<entry xmlns="http://www.w3.org/2005/Atom" xmlns:thr="http://purl.org/syndication/thread/1.0">';
				strData += '<id>ignored</id><title type="text">ignored</title>';
				strData += '<thr:in-reply-to ref="' + entry.id[0].__text + '"/>';
				strData += '<content type="html">' + response + '</content></entry>';

				var post = {
					url : $scope.data.root + "/" + blog.name + "/api/comments",
					type : "POST",
					contentType : "application/atom+xml",
					async : true,
					data : strData,
					statusCode : {
						201 : function () {
							log.debug('Comment "' + response + '" created in ' + entry["_xml:base"]);
						}
					},
					error : function (jqXHR, textStatus, errorThrown) {
						log.error(jqXHR + " - " + textStatus + ' - ' + errorThrown);
					},
				};

				$scope.posts[entry["_xml:base"]] = post;

				if (blog.mode == 2) {
					log.info("No auto commenting desired");
					$scope.notifications.push({
						blog : blog,
						entry : entry,
						date : new Date(Date.now()),
						html : 'Should "' + response + '" be published to <a href="' + entry["_xml:base"] + '" target="_BLANK">' + entry.title[0].__text + '</a>?',
						confirm : entry["_xml:base"]
					});
				}

				if (blog.mode == 3) {
					log.info("Auto commenting...");
					$scope.notifications.push({
						blog : blog,
						entry : entry,
						date : new Date(Date.now()),
						html : '"' + response + '" auto published to <a href="' + entry["_xml:base"] + '" target="_BLANK">' + entry.title[0].__text + '</a>.'
					});
					$scope.publishPost(post);
				}
				$scope.$digest();
			};

			$scope.publishPostN = function (n, t) {
				if (t)
					$('.notification:eq(' + t + ') button.confirmer').prop('disabled', true).text('Published');
				$scope.publishPost($scope.posts[n]);
				delete $scope.posts[n];
			};

			$scope.publishPost = function (post) {
				log.info('Publishing', post);
				$.ajax(post);
			};

			$scope.getIcon = function (imode) {
				var r = "";
				$scope.global.modes.forEach(function (mode) {
					if (mode.value == imode)
						r = mode.icon;
				});
				return r;
			};

			$scope.disableBlog = function (blog) {
				if (blog.interval)
					window.clearInterval(blog.interval);
				blog.mode = 0;
			};

			$scope.updateBlog = function (blog) {
				if (blog.interval)
					window.clearInterval(blog.interval);

				$scope.runBlog(blog);
			};

			$scope.run();
		}
	]).filter('unsafe', function ($sce) {
	return function (val) {
		return $sce.trustAsHtml(val);
	};
});

$('#lotusContent').html($dashboard);

window.onbeforeunload = function () {
	return "Socializer will be shut down. Non-saved changes will be lost.";
}

document.title = 'Socializer Dashboard';
