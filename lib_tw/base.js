// app keys
var consumerKey = 'Nqs01pigEQdfrDH0Qrt3w';
var consumerSec = 'CUzPVKvD33nkyLKR9zgdnO3pgONztA8vi42PdFSx90';

var autoloadCfg;

var savedTabs = [];

// handle config
var cfgUpdater = {
    basics: {
        refresh: {
            home: function(t) {
                TabMgr.home.setRefreshTime(t);
            },
            mentions: function(t) {
                TabMgr.mentions.setRefreshTime(t);
            },
            retweets: function(t) {
                TabMgr.retweets.setRefreshTime(t);
            },
            messages: function(t) {
                TabMgr.messages.setRefreshTime(t);
            },
            search: function(t) {
                config.get().basics.refresh.search = t;
                $.each(TabMgr, function(k, v) {
                    if (/^s_/.test(k)) {
                        v.setRefreshTime(t);
                    }
                });
            },
            others: function(t) { // fav, trends, users, lists
                config.get().basics.refresh.others = t;
                $.each(TabMgr, function(k, v) {
                    if (/^@/.test(k) || /^li_\w+-\w+$/.test(k) || k == 'favorites' || k == 'trends') {
                        v.setRefreshTime(t);
                    }
                });
            },
            autoload: function(v) {
                config.get().basics.refresh.autoload = v;
                autoloadCfg = v;
            },
            disreadingload: function(v) {
                config.get().basics.refresh.disreadingload = v;
                if (!v) { // reset autoload
                    autoloadCfg = config.get().basics.refresh.autoload;
                }
            },
        },
        api: {
            address: function(url) {
                kt.getBAuth().setAPIBase(url);
            },
        },
        trends: {
            country: function(id) {
                if (id != config.get().basics.trends.country) {
                    config.get().basics.trends.country = id;
                    config.get().basics.trends.town = '0'; // reset town

                    var index = $('#tabs > div').index($('#trends'));
                    if (index != -1) {
                        $('#tabs').tabs('remove', index);
                        showTrends();
                    }
                }
            },
            town: function(id) {
                if (id != config.get().basics.trends.town) {
                    config.get().basics.trends.town = id;
                    var index = $('#tabs > div').index($('#trends'));
                    if (index != -1) {
                        $('#tabs').tabs('remove', index);
                        showTrends();
                    }
                }
            }
        }
    },
    gui: {
        background: {
            imageFileName: function() {}
        },
        theme: {
            tltheme: function(v) {
                var cssLink = $('<link href="'+config.themes[v]+'" type="text/css" rel="Stylesheet" class="ui-theme" />');
                var linkColor = config.themes[v].match(/fcActive=(\w+)&/)[1];
                if (v == 'Start' || v == 'Cupertino' || v == 'Hot sneaks' || v == 'Excite Bike') {
                    linkColor = config.themes[v].match(/bgColorActive=(\w+)&/)[1];
                }
                var style = $('<style type="text/css" class="ui-theme">.ui-widget-content a {color: #'+linkColor+'} .t_ref a {color: #888}</style>');

                $('head').append(cssLink).append(style);
                if ($('link.ui-theme').size() > 3) { // cache
                    $('link.ui-theme:first').remove();
                }
                if ($('style.ui-theme').size() > 3) { // cache
                    $('style.ui-theme:first').remove();
                }
            }
        },
        display: {
            compact: function() { 
                // do not update compact mode during runtime
            },
            expandurl: function(v) {
                config.get().gui.display.expandurl = v;
            },
            rich: function(v) {
                config.get().gui.display.rich = v;
            },
            tabwidth: function(v) {
                chrome.windows.getCurrent(function(w) {
                    if (!((w.type == 'app' || w.type == 'popup') && config.get().gui.display.compact)) {
                        if (v == 'Normal') {
                            $('#container').width(540);
                        } else if (v == 'Wider') {
                            $('#container').width(1000);
                        } else if (v == 'Full') {
                            $('#container').width('100%');
                        }
                    }
                })
            }
        }
    },

    bgImgData: function(data) {
        if (data) {
            $('body').css('background', 'url("' + data + '")');
            $('body').css('background-attachment', 'fixed');
        }
    }
};

var loadValue = function(item, val) {
    var path = item.split('.');
    var target = cfgUpdater;
    for (var i = 0; i != path.length; ++i) {
        if (i < path.length-1) {
            target = target[path[i]];
        } else {
            target[path[i]](val);
        }
    }
};

var loadValues = function(obj, id) {
    if (typeof(obj) == 'object') {
        $.each(obj, function(k, v) {
            if (typeof(v) == 'object') {
                var subid = id+'.'+k;
                loadValues(v, subid);
            } else {
                loadValue(id+'.'+k, v);
            }
        });
    } else {
        loadValue(id, obj);
    }
};

chrome.extension.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.msg == 'update') {
        console.log('config update: ', request.item, ':', request.value);
        loadValue(request.item, request.value);
    } else if (request.msg == 'reset') {
        logout();
    }
    sendResponse(true);
});


var Render = {
    tweet: function(t) {
        var html = function() {
/*
<li class="t_status newTweet" id="{8}">
    <span class="t_head"><img src="{0}"></span>
    <span class="t_actions">
        {9}
        {10}
        {11}
        {12}
        {13}
        {14}
    </span>
    <span class="t_body">
        <span class="t_info">
            <span class="t_screen_name"><a href="#">{1}</a></span>
            <span class="t_name">{2}</span>
            {6}
            {7}
        </span>
        <span class="t_text">{3}</span>
        <span class="t_ref">
            <span>{4} {5}{15}</span>
        </span>
    </span>
</li>
*/
        };

        var tweet = t;

        // retweet replace
        var rt = '';
        if (t.retweeted_status) {
            rt = '<span class="t_retweeted_icon icon" /> by <span class="t_retweet" id="{1}"><a href="#">{0}</a></span>'.format(t.user.screen_name, t.id_str);
            tweet = t.retweeted_status;
        }

        // retweeted by
        var rtby = '<span class="t_retweeted_by" id="{0}">, <a href="#">retweeted by</a></span>&nbsp;<img class="spinner invisible" src="../img/spinner.gif">'.format(tweet.id_str);

        // reply
        var re = '';
        if (tweet.in_reply_to_screen_name && tweet.in_reply_to_status_id_str) {
            re = '<span class="t_conversation_icon icon" /><span class="t_reply" id="{1}"><a href="#">to {0}</a></span>&nbsp;<img class="spinner invisible" src="../img/spinner.gif">'.format(tweet.in_reply_to_screen_name, tweet.in_reply_to_status_id_str);
        }
        
        // search tweet
        if (t.from_user_name) { 
            t.user = {};
            t.user.profile_image_url = t.profile_image_url;
            t.user.screen_name = t.from_user;
            t.user.name = t.from_user_name;
        }

        // DM addition
        var ref = '';
        var from = '';
        var me = kt.getCurrentUserName();

        var replyIcon = '<span class="t_reply_icon icon" />';
        var rtIcon = '<span class="t_rt_icon icon" />';
        var retweetIcon = '<span class="t_retweet_icon icon" />';
        var favIcon = '<span class="t_fav_icon icon" />';
        var dmIcon = '<span class="t_dm_icon icon" />';
        var delIcon = '<span class="t_del_icon icon" />';
        if (tweet.sender) { // DM tweet
            tweet.user = tweet.sender;
            ref = kt.util.makeTime(tweet.created_at);

            replyIcon = '';
            rtIcon = '';
            retweetIcon = '';
            favIcon = '';

            delIcon = '<span class="t_delmsg_icon icon" />';
            if (tweet.user.screen_name == me) {
                dmIcon = '';
            }

            // msg sent by me
            if (tweet.sender_screen_name == me) {
                re = '<span class="t_msgto_icon icon" /><span class="t_msgto"><a href="#">{0}</a></span>'.format(tweet.recipient_screen_name);
            }

        } else { // normal tweet
            from = 'via {0}'.format(ut.addBlankTarget(ut.unescapeHtml(tweet.source)));
            ref = ut.addBlankTarget(kt.util.makeTime(tweet.created_at).link("https://twitter.com/"+tweet.user.screen_name+"/status/"+tweet.id_str));

            // hide retweet if it is your own tweet or retweeted
            if (tweet.user.screen_name == me || t.user.screen_name == me) {
                retweetIcon = '';
            }

            // hide delete if it is not your own tweet
            if (t.user.screen_name != me) {
                delIcon = '';
            }

            // fav
            if (tweet.favorited) {
               favIcon = '<span class="t_faved_icon icon" />';
            }

            dmIcon = '';
        }


        var text = kt.util.makeEntities(tweet.text, tweet.entities);

 
        html = html.mlstr().format(tweet.user.profile_image_url,
                                   tweet.user.screen_name,
                                   tweet.user.name,
                                   text,
                                   ref,
                                   from,
                                   re,
                                   rt,
                                   tweet.id_str,
                                   replyIcon,
                                   rtIcon,
                                   retweetIcon,
                                   favIcon,
                                   dmIcon,
                                   delIcon,
                                   rtby);
        return html;
    },

    reply: function(t) {
        var html = function() {
/*
<span class="t_reply_text">{0}</span>
*/
        };

        html = html.mlstr().format(kt.util.makeEntities(t.text, t.entities));
        return html;
    },

    retweeters: function(users) {
        var html = function() {
/*
<span class="t_retweeters">{0}</span>
*/
        };

        var userslist = '';
        $.each(users, function(i, u) {
            userslist += '<img src="{0}" title="{1}"> '.format(u.profile_image_url.replace('_normal.', '_mini.'), u.screen_name);
        });

        html = html.mlstr().format(userslist);
        return html;
    },

    profile: function(user) {
        var html = function() {
/*
<div class="profile">
    <span class="p_head"><img src="{0}">{11}</span>
    <span class="p_body">
        <span class="p_name">{2}</span>
        <span class="p_name_location">@<span class="p_screen_name">{1}</span> {4}</span>
        <span class="p_tweets">{8} tweets since {3}, {10} t/day <a href="#">Export</a><b class="p_progress"></b></span>
        {5}
        {9}
        <span class="p_follow"><a href="#">Following: {7}</a> <a href="#">Followers: {6}</a> {12}</span>
        <br />
    </span>
</div>
*/
        };

        var freq = kt.util.computeFreq(user.created_at, user.statuses_count);
        var created = new Date(user.created_at);
        var since = (created.getMonth()+1) + "-" + created.getDate() + ", " + created.getFullYear();

        var description = '';
        if (user.description) {
            description = '<span class="p_desc">{0}</span>'.format(user.description);
        }

        var link = '';
        if (user.url) {
            link = '<span class="p_link"><a href="{0}" target="_blank">{0}</a></span>'.format(user.url);
        }

        var action = '';
        if (user.following != null) {
            action = '<button>Follow</button>';
            if (user.following) {
                action = '<button>Unfollow</button>';
            }
        }

        var foYou = '';
        if (user.followed_by != null) {
            foYou = '(Not following you)';
            if (user.followed_by) {
                foYou = '(Following you)';
            }
        }

        html = html.mlstr().format(user.profile_image_url.replace('_normal.', '_bigger.'), // make bigger image
                                   user.screen_name,
                                   user.name,
                                   since,
                                   user.location,
                                   description,
                                   user.followers_count,
                                   user.friends_count,
                                   user.statuses_count,
                                   link,
                                   freq,
                                   action,
                                   foYou);
        return html;
    },

    timeline: function() {
        var html = function() {
/*
<div class="tl">
    <button class="new hidden">new</button>
    <ol></ol>
    <div class="loader"><img src="../img/loader.gif"></div>
    <button class="more hidden">more</button>
</div>
*/
        };

        html = html.mlstr().format();
        return html;
    },

    friendship: function() {
        var html = function() {
/*
<div class="fs">
    <ol></ol>
    <div class="loader"><img src="../img/loader.gif"></div>
    <button class="more hidden">more</button>
</div>
*/
        };

        html = html.mlstr().format();
        return html;
    },

    user: function(u) {
        var html = function() {
/*
<li class="t_status">
    <span class="t_head"><img src="{0}"></span>
    <span class="u_action"><button>{4}</button></span>
    <span class="u_body">
        <span class="t_info">
            <span class="t_screen_name"><a href="#">{1}</a></span>
            <span class="t_name">{2}</span>
            <span> - {5} t/day</span>
            {6}
        </span>
        {3}
    </span>
</li>
*/
        };

        var description = '';
        if (u.description) {
            description = '<span class="t_text">{0}</span>'.format(u.description);
        }

        var action = 'Unfollow';
        if (!u.following) {
            action = 'Follow';
            if (u.protected) {
                //action = 'Req Fo'
            }
        }

        var protectedIcon = '';
        if (u.protected) {
            protectedIcon = '<span class="t_protected_icon icon" />';
        }

        var freq = kt.util.computeFreq(u.created_at, u.statuses_count);

        html = html.mlstr().format(u.profile_image_url,
                                   u.screen_name,
                                   u.name,
                                   description,
                                   action,
                                   freq,
                                   protectedIcon);
        return html;
    },

    exTweet: function(t) {
        var html = function() {
/*
<tr>
    <td>{0}</td>
    <td>{1}</td>
    <td>{2}</td>
    <td>{3}</td>
</tr>
*/
        };

        var text = kt.util.makeEntities(t.text, t.entities, true);
        var from = ut.addBlankTarget(t.source);
        var time = kt.util.makeTime(t.created_at);
        var id = ut.addBlankTarget((t.id_str).link("https://twitter.com/"+t.user.screen_name+"/status/"+t.id_str));

        html = html.mlstr().format(id, text, time, from);
        return html;
    },


    trends: function(name) {
        var html = function() {
/*
<div class="tr">
    <h2>{0}</h2>
    <ol></ol>
    <div class="loader"><img src="../img/loader.gif"></div>
</div>
*/
        };

        html = html.mlstr().format(name);
        return html;
    },

    trend: function(t) {
        var html = function() {
/*
<li class="t_status">
    <span class="t_trend">
    <span class="ui-icon {0}"></span> <span class="t_trname">{1}</span>
    </span>
</li>
*/
        };

        var state = "ui-icon-plus"; // new
        if (t.state == "up") {
            state = "ui-icon-arrowthick-1-n";
        } else if (t.state == "down") {
            state = "ui-icon-arrowthick-1-s";
        } else if (t.state == "level") {
            state = "ui-icon-arrowthick-1-e";
        }
    
        html = html.mlstr().format(state, t.name);
        return html;
    },

    lists: function(l) {
        var html = function() {
/*
<div class="li">
    <ol></ol>
    <div class="loader"><img src="../img/loader.gif"></div>
</div>
*/
        };

        html = html.mlstr().format();
        return html;
    },

    subs: function(s) {
        var html = function() {
/*
<li class="t_status">
    <span class="t_head"><img src="{0}"></span>
    <span class="u_body">
        <span class="t_info">
            <span class="t_screen_name">{4}</span>
            <span class="t_list_name"><a href="#">{1}</a></span>
            <span> - {2} members</span>
        </span>
        {3}
    </span>
</li>
*/
        };

        var description = '';
        if (s.description) {
            description = '<span class="t_text">{0}</span>'.format(s.description);
        }

        html = html.mlstr().format(s.user.profile_image_url, s.full_name, s.member_count, description, s.user.screen_name);
        return html;
    }
};


var TabMgr = {
    home: null,
    mentions: null,
    retweets: null,
    messages: null,
};
var tweetBox = null;


var createTab = function() {
    var tab = {}
    tab.onError = function(errorStatus) {
        console.warn('Tab.onError():', errorStatus);
        if (errorStatus.retry) { // if we can retry
            errorStatus.retry();
        } else {
            errorHandler('Failed to load tweets', errorStatus);
        }
    };
    return tab;
};

var createStatusesTab = function(id, tl) {
    console.log('createStatusesTab():', id);

    var tlID = '#' + id + ' .tl ol';
    var newBtnID = '#' + id + ' .new';
    var moreBtnID = '#' + id + ' .more';
    var loaderID = '#' + id + ' .loader';
    var newTextID = '#' + id +' .newTweet .t_text';
    var embedparams = {
        maxWidth: 390,
        wrapElement: 'span',
        className: 't_embed',
        wmode: 'transparent',
        method: 'afterParent'
    };
    var inited = false;

    var statusesTab = createTab();
    // [override] called after fist get successfully, no callback
    statusesTab.loadOnce = function(data) {
        console.log('StatusesTab.loadOnce()');
    };

    // [override] called before fist get
    statusesTab.preload = function(success, error) {
        console.log('StatusesTab.preload()');
        success();
    };

    statusesTab.append = function(data) {
        console.log('StatusesTab.append()');

        $(tlID+' .newTweet').addClass('oldTweet').removeClass('newTweet');

        $.each(data, function(i, t) {
            $(tlID).append(Render.tweet(t));
        });
 
        if (config.get().gui.display.rich) {
            $(newTextID).embedly(embedparams);
        }
        if (config.get().gui.display.expandurl) {
            $(newTextID).longurl();
        }
    };

    statusesTab.prepend = function(data, animate) {
        console.log('StatusesTab.prepend()');

        $(tlID+' .newTweet').addClass('oldTweet').removeClass('newTweet');

        $.each(data, function(i, t) {
            var twhtml = Render.tweet(t);
            if (animate) {
                $(twhtml).hide().prependTo($(tlID)).slideDown('slow');
            } else {
                if (i == 0) { // first oldest tweet
                    twhtml = $(twhtml).css('border-bottom-style', 'solid');
                }

                $(twhtml).prependTo($(tlID));
            }
        });

        if (config.get().gui.display.rich) {
            $(newTextID).embedly(embedparams);
        }
        if (config.get().gui.display.expandurl) {
            $(newTextID).longurl();
        }
    };

    statusesTab.hideNewBtn = function() {
        var count = tl.getCachedTweets().length;
        if (count == 0) {
            $(newBtnID).hide();
        }
    };

    statusesTab.showNew = function() {
        console.log('StatusesTab.showNew()');

        document.title = 'kwitty'  // restore title
        $(tlID+' .tmpTweet').hide();
        $(newBtnID).slideUp();

        var newTweets = tl.getCachedTweets();
        statusesTab.prepend(newTweets, autoloadCfg);
        // clear
        tl.clearCachedTweets();
    };

    statusesTab.showMore = function() {
        console.log('StatusesTab.showMore()');
        $(moreBtnID).hide();
        $(loaderID).show();

        tl.getMore(this.onMoreTweets, statusesTab.onError);
    };

    statusesTab.onMoreTweets = function(data) {
        console.log('StatusesTab.onMoreTweets()');

        $(loaderID).hide();
        if (data.length) {
            statusesTab.append(data);
            $(moreBtnID).show();
        } else {
            errorHandler('No more tweets');
        }
    };

    statusesTab.onNewTweets = function(data) {
        console.log('StatusesTab.onNewTweets()');

        var count = tl.getCachedTweets().length;
        if (count) {
            var index = $('#tabs > div').index($('#'+id));
            var labelID = '#tabs > ul li:eq('+index+') a';
            var selected = $('#tabs').tabs('option', 'selected');
            var label = $(labelID).text();
            var labeltt = label;
            if (label.slice(-1) == '*') {
                labeltt = label.slice(0, label.length-1);
            }
            document.title = 'kwitty | '+labeltt+' - '+count+' new'  // blink title
            if (index != selected && label.slice(-1) != '*') {
                $(labelID).text(label+'*');
            }

            if (config.get().basics.refresh.autoload && config.get().basics.refresh.disreadingload) {
                $('body').scrollTop() < 50 ?
                    autoloadCfg = config.get().basics.refresh.autoload : autoloadCfg = false;
            }

            if (autoloadCfg) {
                statusesTab.showNew();
            } else {
                $(newBtnID).text(count+' new').slideDown();
            }
        } else {
            $(loaderID).hide();

            if (!inited) {
                if (data && data.length) {  // first get
                    statusesTab.prepend(data);
                    statusesTab.loadOnce(data);
                    $(moreBtnID).show();
                } else { // no tweets when first get
                    // close this tab
                    var index = $('#tabs > div').index($('#'+id));
                    if (index != -1) {
                        $('#tabs').tabs('remove', index);
                    }
                    statusesTab.onError({textStatus: 'No tweet found.'});
                }

                inited = true;
            } else {
                if (data && data.length) {
                    console.warn('statusesTab.onNewTweets(): data available but could not get cached tweets.');
                } else {
                    console.log('statusesTab.onNewTweets(): No tweet yet.');
                }
            }
        }
    };

    statusesTab.setRefreshTime = function(t) {
        tl.setRefreshTime(t);
    };

    statusesTab.destroy = function() {
        tl.destroy();
    };

    statusesTab.init = function() {
        $('#'+id).html(Render.timeline());
        $('button').button();

        this.preload(function() {
            // first get
            tl.get(statusesTab.onNewTweets, function(errorStatus) {
                statusesTab.onError(errorStatus);  // make overridable
            });
        }, function(errorStatus) {
            // do nothing
        });

        return this;
    };

    return statusesTab;
};

var createUserTab = function(id, tl) {
    console.log('createUserTab():', id);

    var userTab = createStatusesTab(id, tl);
    var relationship = null;
    var user = null;

    userTab.onError = function(errorStatus) {
        if (errorStatus.retry) {
            errorStatus.retry();
        } else {
            // close this user tab
            var index = $('#tabs > div').index($('#'+id));
            if (index != -1) {
                $('#tabs').tabs('remove', index);
            }
            errorHandler('Failed to show user', errorStatus);
        }
    };

    // the following info of user object is not correct, use another api instead
    userTab.preload = function(success, error) {
        kt.friendship.show(id, function(data) {
            relationship = data.relationship;
            success();
        }, function(errorStatus) {
            userTab.onError(errorStatus);
            error(errorStatus);
        });
    };

    userTab.loadOnce = function(data) {
        console.log('UserTab.loadOnce()');
        var tabID = '#' + id;

        user = data[0].user;
        if (relationship && user.screen_name != kt.getCurrentUserName()) {
            user.following = relationship.source.following;
            user.followed_by = relationship.source.followed_by;
        } else {
            user.following = null;
            user.followed_by = null;
        }
        $(tabID).prepend(Render.profile(user));
        $('button').button();
    };

    userTab.exportAll = function(success, error) {
        console.log('UserTab.showAll()');
        var progressID = '#' + id + ' .p_progress';

        tl.getAll(function(data) {

            if ('number' == typeof data) {
                var max = 3200;
                if (user && user.statuses_count < max) {
                    max = user.statuses_count;
                }
                var pro = Math.ceil(data*100/max);
                if (pro > 100) {
                    pro = 100;
                }
                $(progressID).text(pro+'%');
            } else {
                success(data);
            }
        
        }, error);
    };

    return userTab;
};

var createFriendshipTab = function(id, fs) {
    console.log('createFriendshipTab():', id);
    var fsID = '#' + id + ' .fs ol';
    var moreBtnID = '#' + id + ' .more';
    var loaderID = '#' + id + ' .loader';

    var fsTab = createTab();
    fsTab.append = function(data) {
        console.log('FriendshipTab.append()');

        $.each(data, function(i, u) {
            $(fsID).append(Render.user(u));
        });

        $('button').button();
    };

    fsTab.onMoreUsers = function(data) {
        console.log('FriendshipTab.onMoreUsers()');

        $(loaderID).hide();
        if (data.length) {
            fsTab.append(data);
            $(moreBtnID).show();
        } else {
            errorHandler('No more users');
        }
    };

    fsTab.showMore = function() {
        console.log('FriendshipTab.showMore()');
        $(moreBtnID).hide();
        $(loaderID).show();

        fs.get(this.onMoreUsers, this.onError);
    };

    fsTab.destroy = function() {
        console.log('FriendshipTab.destroy()');
        //fs.destroy(); // no need
    };

    fsTab.init = function() {
        console.log('FriendshipTab.init()');
        $('#'+id).html(Render.friendship());
        $('button').button();

        fs.get(this.onMoreUsers, this.onError);
        return this;
    };

    return fsTab;
};

var createListsTab = function(id, li) {
    console.log('createListsTab():', id);
    var liID = '#' + id + ' .li ol';
    var loaderID = '#' + id + ' .loader';

    var liTab = createTab();
    liTab.append = function(data) {
        console.log('ListsTab.append()');

        $.each(data, function(i, s) {
            $(liID).append(Render.subs(s));
        });

        $('button').button();
    };

    liTab.onLists = function(data) {
        console.log('ListsTab.onLists()');

        $(loaderID).hide();
        if (data.length) {
            liTab.append(data);
        } else {
            errorHandler('No lists');
        }
    };

    liTab.destroy = function() {
        console.log('ListsTab.destroy()');
        //fs.destroy(); // no need
    };

    liTab.init = function() {
        console.log('ListsTab.init()');
        $('#'+id).html(Render.lists());
        $('button').button();

        li.get(this.onLists, this.onError);
        return this;
    };

    return liTab;
};

var createTrendsTab = function(id, name, tr) {
    console.log('createFriendshipTab():', id);
    var trID = '#' + id + ' .tr ol';
    var loaderID = '#' + id + ' .loader';

    var trTab = createTab();
    trTab.onTrends = function(data) {
        console.log('TrendsTab.onTrends()');

        var index = $('#tabs > div').index($('#'+id));
        var labelID = '#tabs > ul li:eq('+index+') a';
        var selected = $('#tabs').tabs('option', 'selected');
        var label = $(labelID).text();
        var labeltt = label;
        if (label.slice(-1) == '*') {
            labeltt = label.slice(0, label.length-1);
        }
        //document.title = 'kwitty | '+labeltt+' - '+'updated'  // blink title
        if (index != selected && label.slice(-1) != '*') {
            $(labelID).text(label+'*');
        }


        $(loaderID).hide();
        $(trID).html('');
        if (data.length) {
            $.each(data, function(i, t) {
                $(trID).append(Render.trend(t));
            });
        } else {
            errorHandler('No trends');
        }
    };

    trTab.setRefreshTime = function(t) {
        tr.setRefreshTime(t);
    };

    trTab.destroy = function() {
        tr.destroy();
    };

    trTab.init = function() {
        console.log('TrendsTab.init()');
        $('#'+id).html(Render.trends(name));
        tr.get(this.onTrends, this.onError);
        return this;
    };
    return trTab;
};

var createTweetBox = function(id) {
    console.log('createTweetBox():', id);
    var ID = '#' + id;
    var taID = '#' + id + ' .textarea';
    var counterID = '#' + id + ' .counter';
    var cancelID = '#' + id + ' .cancel';
    var tweetID = '#' + id + ' .tweet';
    var spinnerID = '#' + id + ' .spinner';
    var uploadID = '#' + id + ' .t_upmedia_icon';
    var fileNameID = '#' + id + ' .file_name';
    var linkID = '#' + id + ' .link';
    var homeTLID = '#home .tl ol';

    var content = null;
    var toStatus = null;
    var upfile = null;

    var tweetBox = {};
    tweetBox.begin = function() {
        if (!content) {
            $(ID).removeClass('update_inactive').addClass('update_active');
            $(taID).val('').removeClass('ta_inactive').addClass('ta_active');
            $(taID).siblings().show();
        }
    };

    tweetBox.change = function() {
        content = $(taID).val();
        var total = 140;

        var dm = /^d \w+ /i.exec(content);
        var find = /^f @?\w+/i.test(content);
        var search = /^s .+/i.test(content);
        if (dm) {
            total += dm[0].length;
            $(tweetID).text('Send');
        } else if (find) {
            total = 32 // 30 letters for screen name
            $(tweetID).text('Find');
        } else if (search) {
            total = 32
            $(tweetID).text('Search');
        } else {
            $(tweetID).text('Tweet');
            if (upfile) {
                total -= 20; // media url (t.co) takes 20 chars    
            }

            var urls = twttr.txt.extractUrls(content);
            if (urls.length > 0) {
                $(linkID).show();
            } else {
                $(linkID).hide();
            }
            urls.forEach(function(item, index) {
                total += item.length;
                total -= 20;
            });
        }

        var charleft = total - content.length;
        $(counterID).text(charleft);
        if (charleft >= 0 && charleft < 140) {
            $(tweetID).show();
        } else {
            $(tweetID).hide();
        }
    };

    tweetBox.reset = function() {
        $(ID).removeClass('update_active').addClass('update_inactive');
        $(taID).val("What's happening?").removeClass('ta_active').addClass('ta_inactive');
        $(taID).siblings().hide();
        $(tweetID).text('Tweet');
        $(tweetID).hide();
        $(spinnerID).css('visibility', 'hidden');
        $(counterID).text(140);
        content = null;
        toStatus = null;
        upfile = null;
        $(fileNameID).text('');
        $(linkID).hide();
        return false;
    };

    tweetBox.onError = function(errorStatus) {
        $(spinnerID).css('visibility', 'hidden');
        errorHandler('Failed to update status', errorStatus);
    };

    tweetBox.onSuccess = function(data) {
        $(spinnerID).css('visibility', 'hidden');
        tweetBox.reset();

        // show in home TL
        TabMgr.home.showNew();
        $(homeTLID).prepend($(Render.tweet(data)).addClass('tmpTweet'));
        $('#tabs').tabs('select', 0);
    };

    tweetBox.reply = function(screenName, statusID) {
        toStatus = statusID;

        this.begin();
        content = '@' + screenName + ' ';
        $(taID).focus();
        $(taID).val(content);
        this.change();
    };

    tweetBox.rt = function(screenName, text) {
        toStatus = null;

        this.begin();
        content = 'RT @' + screenName + ': ' + text;
        $(taID).val(content);
        $(taID).focus();
        this.change();
    };

    tweetBox.dm = function(screenName) {
        toStatus = null;

        this.begin();
        content = 'd ' + screenName + ' ';
        $(taID).focus();
        $(taID).val(content);
        this.change();
    };

    tweetBox.update = function() {
        if (content || upfile) {
            if ($(tweetID).text() == 'Tweet') {
                $(spinnerID).css('visibility', 'visible');
                if (upfile) {
                    kt.tweet.updateMedia(content, toStatus, upfile, tweetBox.onSuccess, tweetBox.onError);
                } else {
                    kt.tweet.update(content, toStatus, tweetBox.onSuccess, tweetBox.onError);
                }

            } else if ($(tweetID).text() == 'Send') {  // dm
                $(spinnerID).css('visibility', 'visible');
                var dm = /^d (\w+) (.+)/i.exec(content);
                kt.tweet.directMsg(dm[1], dm[2], function(data) {
                    $(spinnerID).css('visibility', 'hidden');
                    tweetBox.reset();

                    // show in messages TL
                    TabMgr.messages.showNew();
                    $('#messages .tl ol').prepend($(Render.tweet(data)).addClass('tmpTweet'));
                    $('#tabs').tabs('select', 2);
                }, tweetBox.onError);
            } else if ($(tweetID).text() == 'Find') {
                var f = /^f @?(\w+)/i.exec(content);
                showUser(f[1]);
                tweetBox.reset();
            } else if ($(tweetID).text() == 'Search') {
                var f = /^s (.+)/i.exec(content);
                showSearch(f[1].trim());
                tweetBox.reset();
            }
        }
        return false;
    };

    tweetBox.upload = function() {
        $('#upMediaData').click();
    };

    // local init
    (function() {
        $(taID).focus(tweetBox.begin);
        $(taID).keyup(tweetBox.change);
        $(cancelID).click(tweetBox.reset);
        $(tweetID).click(tweetBox.update);
        $(uploadID).click(tweetBox.upload);

        $('#upMediaData').change(function() {
            var file = this.files[0];
            if (!file) {
                return;
            }
            if(!/image\/\w+/.test(file.type)){
                alert('Not image file!');
                return;
            }

            $(fileNameID).text('['+file.name+']');
            upfile = file;
            tweetBox.change();
        });

        tweetBox.reset();
    })();

    return tweetBox;
}

var showMore = function(id) {
    TabMgr[id].showMore();
};

var showNew = function(id) {
    TabMgr[id].showNew();
};

var showUser = function(screenName) {
    var id = '#' + screenName;
    var index = $('#tabs > div').index($(id));
    if (index == -1) {
        $('#tabs').tabs('add', id, '@'+screenName);
        TabMgr[screenName] = createUserTab(screenName, kt.createUserTL(screenName)).init();
        TabMgr[screenName].setRefreshTime(config.get().basics.refresh.others);

        // update
        index = $('#tabs > div').index($(id));
    }

    $('#tabs').tabs('select', index);
    $(window).scrollTop(0);
};

var showSearch = function(q) {
    var idStr = 's_' + q.replace(/[+\/@$#&"'><:. ]/g, '-');
    var id = '#' + idStr;

    var index = $('#tabs > div').index($(id));
    if (index == -1) {
        $('#tabs').tabs('add', id, '/'+q+'/');
        TabMgr[idStr] = createStatusesTab(idStr, kt.createSearchTL(q)).init();
        TabMgr[idStr].setRefreshTime(config.get().basics.refresh.search);

        // update
        index = $('#tabs > div').index($(id));
    }

    $('#tabs').tabs('select', index);
    $(window).scrollTop(0);
};

var showReply = function(thisElem, id) {
    var tInfo = $(thisElem).closest('.t_info');
    var reply = $(tInfo).siblings('.t_reply_text');
    if (reply.length) { // already loaded
        $(reply).slideToggle();
    } else {
        $(tInfo).find('.spinner').css('visibility', 'visible');
        kt.tweet.show(id, function(data) {
            $(tInfo).find('.spinner').css('visibility', 'hidden');
            $(tInfo).after(Render.reply(data));
        }, function(errorStatus) {
            $(tInfo).find('.spinner').css('visibility', 'hidden');
            errorHandler('Failed to load reply', errorStatus);
        });
    }

    return false;
};

var showRetweetedBy = function(thisElem, id) {
    var tRef = $(thisElem).closest('.t_ref');
    var rters = $(tRef).siblings('.t_retweeters');
    if (rters.length) { // already loaded
        $(rters).slideToggle();
    } else {
        $(tRef).find('.spinner').css('visibility', 'visible');
        kt.tweet.retweetedBy(id, function(data) {
            $(tRef).find('.spinner').css('visibility', 'hidden');
            $(tRef).after(Render.retweeters(data));
        }, function(errorStatus) {
            $(tRef).find('.spinner').css('visibility', 'hidden');
            errorHandler('Failed to load retweeters', errorStatus);
        });
    }

    return false;
};

var makeFriendship = function(thisElem, screenName) {
    var fo = $(thisElem).text();
    if (fo == 'Follow') {
        kt.friendship.create(screenName, function(data) {
            $(thisElem).text('Unfollow');
        }, function(errorStatus) {
            errorHandler('Failed to follow', errorStatus);
        });
    } else if (fo == 'Unfollow') {
        kt.friendship.destroy(screenName, function(data) {
            $(thisElem).text('Follow');
        }, function(errorStatus) {
            errorHandler('Failed to unfollow', errorStatus);
        });
    }
};

var showFollowers = function(name) {
    var id = '#fo_' + name;
    var index = $('#tabs > div').index($(id));
    if (index == -1) {
        $('#tabs').tabs('add', id, name+String.fromCharCode(8678));
        TabMgr['fo_'+name] = createFriendshipTab('fo_'+name, kt.createFollowers(name)).init();

        // update
        index = $('#tabs > div').index($(id));
    }
    $('#tabs').tabs('select', index);
};

var showFriends = function(name) {
    var id = '#fr_' + name;
    var index = $("#tabs > div").index($(id));
    if (index == -1) {
        $('#tabs').tabs('add', id, name+String.fromCharCode(8680));
        TabMgr['fr_'+name] = createFriendshipTab('fr_'+name, kt.createFriends(name)).init();

        // update
        index = $('#tabs > div').index($(id));
    }
    $('#tabs').tabs('select', index);
};

var showFavorites = function() {
    var id = '#favorites';
    var index = $("#tabs > div").index($(id));
    if (index == -1) {
        $('#tabs').tabs('add', id, 'Favorites');
        TabMgr.favorites = createStatusesTab('favorites', kt.createFavoritesTL()).init();
        TabMgr.favorites.setRefreshTime(config.get().basics.refresh.others);

        // update
        index = $("#tabs > div").index($(id));
    }
    $('#tabs').tabs('select', index);
};


var showTrends = function() {
    var id = '#trends';
    var index = $("#tabs > div").index($(id));
    var country = config.get().basics.trends.country;
    var town = config.get().basics.trends.town;
    var wid = (town == '0' ? country : town);

    var name = woeid.getCountryNameById(country);
    if (town != '0') {
        name += ' - ' + woeid.getTownNameById(town);
    }

    if (index == -1) {
        $('#tabs').tabs('add', id, 'Trends');
        TabMgr.trends = createTrendsTab('trends', name, kt.createTrends(wid)).init();
        TabMgr.trends.setRefreshTime(config.get().basics.refresh.others);

        // update
        index = $('#tabs > div').index($(id));
    }
    $('#tabs').tabs('select', index);
};

var showLists = function() {
    var id = '#lists';
    var index = $("#tabs > div").index($(id));
    if (index == -1) {
        $('#tabs').tabs('add', id, 'Lists');
        TabMgr.lists = createListsTab('lists', kt.createLists()).init();

        // update
        index = $('#tabs > div').index($(id));
    }
    $('#tabs').tabs('select', index);
};

var showList = function(listName) {
    var name = /^@(\w+)\/(\w+)$/.exec(listName);
    var screenName;
    var slug;
    if (name) {
        screenName = name[1];
        slug = name[2];
    } else {
        console.error('can not create list', listName);
        return;
    }
    var idStr = 'li_' + screenName + '-' + slug;
    var id = '#' + idStr;
    var index = $('#tabs > div').index($(id));
    if (index == -1) {
        $('#tabs').tabs('add', id, String.fromCharCode(8803)+slug);
        TabMgr[idStr] = createStatusesTab(idStr, kt.createListTL(screenName, slug)).init();
        TabMgr[idStr].setRefreshTime(config.get().basics.refresh.others);

        // update
        index = $('#tabs > div').index($(id));
    }

    $('#tabs').tabs('select', index);
    $(window).scrollTop(0);
};

var updateProfile = function(id, data) {
    console.log('updateProfile():', data);

    $('#'+id+' .i_head').prop('src', data.profile_image_url).click(function() {
        $('#'+id+' .i_favorites').animate({opacity: 'toggle'});
        $('#'+id+' .i_trends').animate({opacity: 'toggle'});
        $('#'+id+' .i_lists').animate({opacity: 'toggle'});
    });
    $('#'+id+' .i_screen_name').html(data.screen_name.bold()).click(function() { showUser(data.screen_name) });
    $('#'+id+' .i_followers').html(String.fromCharCode(8678)+data.followers_count).click(function() { showFollowers(data.screen_name) });
    $('#'+id+' .i_following').html(String.fromCharCode(8680)+data.friends_count).click(function() { showFriends(data.screen_name) });
    $('#'+id+' .i_favorites').html(String.fromCharCode(9734)).click(function() { showFavorites(); }).hide();
    $('#'+id+' .i_trends').html(String.fromCharCode(65085)).click(function() { showTrends(); }).hide();
    $('#'+id+' .i_lists').html(String.fromCharCode(8803)).click(function() { showLists(); }).hide();
};

var initEvent = function() {
    $('.tl > button.more, .fs > button.more').live('click', function() {
        var id = $(this).closest('.tl, .fs').parent().prop('id');
        showMore(id);
    });

    $('.tl > button.new').live('click', function() {
        var id = $(this).closest('.tl').parent().prop('id');
        showNew(id);
    });

    $('.t_status .t_actions .t_reply_icon').live('click', function() {
        var screenName = $(this).closest('.t_status').find('.t_screen_name').text();
        var statusID = $(this).closest('.t_status').prop('id');
        console.log('click reply:', screenName, statusID);
        tweetBox.reply(screenName, statusID);
    });

    $('.t_status .t_actions .t_rt_icon').live('click', function() {
        var screenName = $(this).closest('.t_status').find('.t_screen_name').text();
        var text = $(this).closest('.t_status').find('.t_text').text();
        console.log('click RT:', screenName, text);
        tweetBox.rt(screenName, text);
    });

    $('.t_status .t_actions .t_dm_icon').live('click', function() {
        var screenName = $(this).closest('.t_status').find('.t_screen_name').text();
        console.log('click DM:', screenName);
        tweetBox.dm(screenName);
    });

    $('.t_status .t_actions .t_retweet_icon').live('click', function() {
        var statusID = $(this).closest('.t_status').prop('id');

        var thisElem = this;
        kt.tweet.retweet(statusID, function(data) {
            // show in home TL
            TabMgr.home.showNew();
            $('#home .tl ol').prepend(Render.tweet(data));
            $('#tabs').tabs('select', 0);
        }, function(errorStatus) {
            errorHandler('Failed to retweet', errorStatus);
        });
    });

    $('.t_status .t_actions .t_fav_icon').live('click', function() {
        var statusID = $(this).closest('.t_status').prop('id');
        console.log('click fav:', statusID);

        var thisElem = this;
        kt.fav.create(statusID, function(data) {
            $(thisElem).removeClass('t_fav_icon').addClass('t_faved_icon');
        }, function(errorStatus) {
            errorHandler('Failed to add favorite', errorStatus);
        });
    });

    $('.t_status .t_actions .t_faved_icon').live('click', function() {
        var statusID = $(this).closest('.t_status').prop('id');
        console.log('click faved:', statusID);

        var thisElem = this;
        kt.fav.destroy(statusID, function(data) {
            $(thisElem).removeClass('t_faved_icon').addClass('t_fav_icon');
        }, function(errorStatus) {
            errorHandler('Failed to delete favorite', errorStatus);
        });
    });

    $('.t_status .t_actions .t_del_icon').live('click', function() {
        var statusID = $(this).closest('.t_status').prop('id');
        var retweet = $(this).closest('.t_status').find('.t_retweet');
        if (retweet.length) { // it's a retweet by you
            statusID = $(retweet).prop('id');
        }

        var thisElem = this;
        kt.tweet.destroy(statusID, function(data) {
            $(thisElem).closest('.t_status').slideUp();
        }, function(errorStatus) {
            errorHandler('Failed to delete tweet', errorStatus);
        });
    });

    $('.t_status .t_actions .t_delmsg_icon').live('click', function() {
        var statusID = $(this).closest('.t_status').prop('id');

        var thisElem = this;
        kt.tweet.destroyMsg(statusID, function(data) {
            $(thisElem).closest('.t_status').slideUp();
        }, function(errorStatus) {
            errorHandler('Failed to delete message', errorStatus);
        });
    });

    $('.t_status .t_head img').live('click', function() {
        var screenName = $(this).closest('.t_status').find('.t_screen_name').text();
        showUser(screenName);
    });
    $('.t_status .t_screen_name a').live('click', function() {
        var screenName = $(this).text();
        showUser(screenName);
    });
    $('.t_status .t_retweet a').live('click', function() {
        var screenName = $(this).text();
        showUser(screenName);
    });
    $('.t_status .t_userlink').live('click', function() {
        var screenName = $(this).text();
        if (screenName[0] == '@') {
            screenName = screenName.slice(1);
        }
        showUser(screenName);
    });
    $('.t_status .t_hashtag').live('click', function() {
        var tag = $(this).text();
        showSearch(tag);
    });
    $('.t_status .t_msgto a').live('click', function() {
        var screenName = $(this).text();
        showUser(screenName);
    });
    $('.t_status .t_retweeters img').live('click', function() {
        var screenName = $(this).prop('title');
        showUser(screenName);
    });

    $('.t_status .t_reply').live('click', function() {
        var id = $(this).prop('id');
        showReply(this, id);
        return false; // do not go to top
    });

    $('.t_status .t_retweeted_by').live('click', function() {
        var id = $(this).prop('id');
        showRetweetedBy(this, id);
        return false; // do not go to top
    });

    $('.t_status .t_trend .t_trname').live('click', function() {
        var tag = $(this).text();
        showSearch(tag);
    });

    $('.t_status .t_list_name a').live('click', function() {
        var listName = $(this).text();
        showList(listName);
    });

    $('.profile .p_follow a:first').live('click', function() {
        var screenName = $(this).closest('.profile').find('.p_screen_name').text();
        showFriends(screenName);
    });
    $('.profile .p_follow a:last').live('click', function() {
        var screenName = $(this).closest('.profile').find('.p_screen_name').text();
        showFollowers(screenName);
    });
    $('.profile .p_tweets a').live('click', function() {
        var screenName = $(this).closest('.profile').find('.p_screen_name').text();
        var progress = $(this).closest('.profile').find('.p_progress');
        var exporter = $(this);

        if (TabMgr[screenName]) {
            $(exporter).hide();
            $(progress).text('0%');

            // first check rate limit
            kt.user.rateLimit(function(data) {
                console.log('got rate limit', data)

                // need about 16 hits to get 3200 tweets
                if (data.remaining_hits < 20) { // a bit more than 16
                    errorHandler('Too few APIs remain to complete export');
                    return;
                }

                TabMgr[screenName].exportAll(function(data) {
                    console.log('exportAll done, length:', data.length);
                    $(exporter).show();
                    $(progress).text('');

                    var html = '';
                    $.each(data, function(i, t) {
                        html += Render.exTweet(t);
                    });

                    chrome.tabs.create({url: chrome.extension.getURL("export.html")}, function(tab) {
                        var sendMsg = function() {
                            chrome.extension.sendMessage({msg: 'export', html: html}, function(response) {
                                if (response) {
                                    console.log('export tweets ok')
                                } else {
                                    console.error('export failed: ', chrome.extension.lastError.message);
                                    setTimeout(sendMsg, 1000); // retry
                                }
                            })
                        };
                        sendMsg();
                    });

                }, function(errorStatus) {
                    $(exporter).show();
                    $(progress).text('');
                    errorHandler('Failed to export', errorStatus);
                });
            }, function(errorStatus) {
                $(exporter).show();
                $(progress).text('');
                errorHandler('Failed to query rate limit', errorStatus);
            });
           
        } else {
            errorHandler('UserTab does not exist');
        }
    });
    $('.profile button').live('click', function() {
        var screenName = $(this).closest('.profile').find('.p_screen_name').text();
        makeFriendship(this, screenName);
    });

    $('.u_action button').live('click', function() {
        var screenName = $(this).closest('.t_status').find('.t_screen_name').text();
        makeFriendship(this, screenName);
    });

    $('#logout').live('click', function() {
        logout();
    });

};

var createSavedTabs = function() {
    if (!localStorage.tabs) {
        return;
    }

    var tabs = JSON.parse(localStorage.tabs);
    var fo = new RegExp(String.fromCharCode(8678)+'$');
    var fr = new RegExp(String.fromCharCode(8680)+'$');
    tabs.forEach(function(text, i) {
        if (text == 'Trends') {
            showTrends();
        } else if (text == 'Favorites') {
            showFavorites();
        } else if (text == 'Lists') {
            showLists();
        } else if (/^@/.test(text)) {
            showUser(text.slice(1));
        } else if (fo.test(text)) {
            showFollowers(text.slice(0, -1));
        } else if (fr.test(text)) {
            showFriends(text.slice(0, -1));
        } else if (/^li_\w+-\w+$/.test(text)) {
            var name = /^li_(\w+)-(\w+)$/.exec(text);
            if (name) {
                showList('@'+name[1]+'/'+name[2]);
            }
        } else if (/^\/.+\/$/.test(text)) {
            showSearch(text.slice(1).slice(0, -1));
        } else {
            console.info('can not create tab for', text);
        }
    });
};

var onLoginSuccess = function(screenName) {
    // create instances
    TabMgr.home = createStatusesTab('home', kt.createHomeTL()).init();
    TabMgr.mentions = createStatusesTab('mentions', kt.createMentionsTL()).init();
    TabMgr.retweets = createStatusesTab('retweets', kt.createRetweetsTL()).init();
    TabMgr.messages = createStatusesTab('messages', kt.createMessagesTL()).init();
    tweetBox = createTweetBox('update');

    // create saved tabs
    createSavedTabs();

    // update profile
    kt.user.show(screenName, function(data) {
        updateProfile('profile', data);
        $('#profile').fadeIn('slow');
    }, function(errorStatus) {
        if (errorStatus.retry) {
            errorStatus.retry();
        } else {
            errorHandler('Failed to update profile', errorStatus);
        }
    });


    // init refresh time
    loadValues(config.get().basics.refresh, 'basics.refresh');

    // init event
    initEvent();

    // GUI change
    $('#login').hide();
    $('#topbar').animate({height: '50px'}, 'fast');
    $('#logout').fadeIn('slow');
    $('#update').fadeIn('slow');
    $('#tabs').fadeIn('slow').tabs('select', 0);

    if ('Basic' == kt.getAuthMode()) {
        $('#actions .t_upmedia_icon').hide();
    }
};

var makeCompact = function() {
    $('body').css('zoom', '0.9');
    $('#holder').height(100);

    $('#topbar').after($('#update').detach());
    $('#update').css({
        width: '100%',
        position: 'fixed',
        top: '50px',
        'background-color': 'rgba(33, 33, 33, 0.8)',
        'border-bottom-left-radius': '0px',
        'border-bottom-right-radius': '0px',
    });
    $('#container').width(500);
};

var onLoginError = function(errorStatus) {
    $('#login .loader').hide();
    errorHandler('Failed to sign in', errorStatus);
};

var basicLogin = function(user, pass) {
    var bauth = kt.getBAuth();
    bauth.login(user, pass, onLoginSuccess, onLoginError);
};

var oauthLogin = function(verifier) {
    var oauth = kt.getOAuth();
    oauth.login(chrome.extension.getURL('main.html'), verifier, onLoginSuccess, onLoginError);
};

var autoLogin = function() {
    // init
    var bauth = kt.getBAuth();
    bauth.setAPIBase(config.get().basics.api.address);
    var oauth = kt.getOAuth();
    oauth.setConsumerToken(consumerKey, consumerSec);

    // try basic auth first
    if (bauth.loadConfd()) {
        basicLogin();
        return;
    }

    // continue oauth login
    var params = ut.getQueryStringParams(window.location.href);
    if (params.oauth_verifier) {
        $('#login .loader').show();
        oauthLogin(params.oauth_verifier);
        return;
    }

    // finally, try auto auth login
    if (oauth.loadToken()) {
        oauthLogin();
        return;
    }
};

var logout = function() {
    if ('Basic' == kt.getAuthMode()) {
        kt.getBAuth().logout();
    } else if ('OAuth' == kt.getAuthMode()) {
        kt.getOAuth().logout();
    } else {
        console.error('logout(): invalid auth mode');
        return;
    }

    // GUI reset
    $('#logout').hide();
    $('#tabs').hide();
    $('#update').hide();
    $('#profile').hide();
    $('#login').fadeIn('slow');

    // clear saved tabs
    localStorage.tabs = '[]'; 

    // redirect
    window.location = chrome.extension.getURL('main.html');
}

// general error handler
var errorHandler = function(info, errorStatus) {
    console.error('errorHandler():', info, errorStatus);

    var reason = '';
    if (errorStatus) {
        reason = errorStatus.textStatus;
        if (errorStatus.xmlHttpRequest && errorStatus.xmlHttpRequest.responseText) {
            try {
                var resp = JSON.parse(errorStatus.xmlHttpRequest.responseText);
                reason = resp.error;

                // find reason in errors
                if (!reason) {
                    reason = resp.errors[0].message;
                }
            } catch (e) {
                var resp = errorStatus.xmlHttpRequest.responseText.match(/"en":\s*{\n\s*"title":\s*"(.+)",/m);
                console.debug('errorHandler() responseText:', resp);
                if (resp) {
                    reason = resp[1];
                }
            }
        }
    }

    // show the error msg
    if (reason) {
        info += ': ' + reason;
    }

    showTip(info);
};

var showTip = function(info)  {
    $('#tip span').text(info);
    $('#tip').css('top', $(window).height()-50);
    $('#tip').fadeIn('slow', function() {
        setTimeout(function() {
            $('#tip').fadeOut('slow');
        }, 3000);
    });
}


// init page
$(function() {
    $('#topbar').click(function() {
        $("body").animate({scrollTop:0});
    });

    $('#update').click(function() {
        return false;
    });

    $('#tabs').tabs({
        tabTemplate: "<li><a href='#{href}'>#{label}</a><span class='ui-icon ui-icon-close'>Remove Tab</span></li>",

        add: function(event, ui) {
            //$('#tabs').tabs('select', '#'+ui.panel.id)
            //$(ui.panel).append("");
            if (/^li_\w+-\w+$/.test(ui.panel.id)) {
                savedTabs.push(ui.panel.id); // use id as key for lists
            } else {
                savedTabs.push(ui.tab.text); // use text as key
            }
            localStorage.tabs = JSON.stringify(savedTabs);
        },

        remove: function(event, ui) {
            TabMgr[ui.panel.id].destroy();
            delete TabMgr[ui.panel.id];
            $('#tabs').tabs('select', 0);
            if (/^li_\w+-\w+$/.test(ui.panel.id)) {
                savedTabs.splice(savedTabs.indexOf(ui.panel.id), 1);
            } else {
                savedTabs.splice(savedTabs.indexOf(ui.tab.text), 1);
            }
            localStorage.tabs = JSON.stringify(savedTabs);
        },

        select: function(event, ui) {
            var label = $(ui.tab).text();
            if (label.slice(-1) == '*') {
                var name = label.slice(0, label.length-1);
                $(ui.tab).text(name);
                // the 'new' button slideUp may not take effect when tab is hidden, so check it again
                TabMgr[ui.tab.hash.slice(1)].hideNewBtn && TabMgr[ui.tab.hash.slice(1)].hideNewBtn();
            }
        }
    });

    $("#tabs span.ui-icon-close").live("click", function() {
        var index = $("li", "#tabs").index($(this).parent());
        $("#tabs").tabs("remove", index);
    });

    $('#login a').click(function() {
        $('#login .loader').show();
        basicLogin($('#username').val(), $('#password').val());
    })
    $('#login img').click(function() {
        $('#login .loader').show();
        oauthLogin();
    })

    $('#logout').html(String.fromCharCode(8624));

    config.init();
    // set background image independently
    cfgUpdater.bgImgData(config.loadFromLS('bgImgData'));
    // update theme
    loadValues(config.get().gui.theme, 'gui.theme');
    // update tabwidth
    loadValues(config.get().gui.display.tabwidth, 'gui.display.tabwidth');

    chrome.windows.getCurrent(function(w) {
        console.log('window type:', w.type);
        if ((w.type == 'app' || w.type == 'popup') && config.get().gui.display.compact) {
            // cuz chrome will remember the window size
            // don't reset the size if user tune the window a little
            if (w.width > 500 || w.width < 450) {
                chrome.windows.update(w.id, {width: 480});
            }
            makeCompact();
        }
    })

    autoLogin();
})
