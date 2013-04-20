(function() {

    var oauth = null;
    var bauth = null;
    var authMode = null;

    // REST API Resources
    var api = {
        bauthBase: '',
        oauthBase: 'https://api.twitter.com',

        buildUrl: function(rest) {
            var base = '';
            if (authMode == 'Basic' && bauth) {
                base = api.bauthBase.replace(/(https?:\/\/[\w\.\_\-]+)\/?.*/, '$1');
                if (rest.domain == 'search') {
                    base += '/search';
                } else if (rest.domain == 'upload') {
                    base += '/upload/1'
                } else {
                    base += '/api/1';
                }
            } else if (authMode == 'OAuth' && oauth) {
                if (rest.domain == 'search') {
                    base = 'https://search.twitter.com';
                } else if (rest.domain == 'upload') {
                    base = 'https://upload.twitter.com/1';
                } else if (rest.domain == 'oauth') {
                    base = api.oauthBase;
                } else {
                    base = api.oauthBase + '/1';
                }
            }

            var url = rest.url;
            if (rest.id) {
                url = rest.url.format(rest.id);
            }
            return base + url;
        },

        statuses: {
            // Returns the 20 most recent statuses, including retweets if they exist, posted by the authenticating user and the user's they follow. This is the same timeline seen by a user when they login to twitter.com. This method is identical to statuses/friends_timeline, except that this method always...
            home_timeline: {method: 'GET', url: '/statuses/home_timeline.json'},
            // Returns the 20 most recent mentions (status containing @username) for the authenticating user. The timeline returned is the equivalent of the one seen when you view your mentions on twitter.com. This method can only return up to 800 statuses. If include_rts is set only 800 statuses, including...
            mentions: {method: 'GET', url: '/statuses/mentions.json'},
            // Returns the 20 most recent statuses, including retweets if they exist, from non-protected users. The public timeline is cached for 60 seconds. Requesting more frequently than that will not return any more data, and will count against your rate limit usage. Consider using the Streaming API's...
            //public_timeline: {method: 'GET', url: '/statuses/public_timeline.json'},
            // Returns the 20 most recent retweets posted by the authenticating user.
            //retweeted_by_me: {method: 'GET', url: '/statuses/retweeted_by_me.json'},
            // Returns the 20 most recent retweets posted by users the authenticating user follow.
            //retweeted_to_me: {method: 'GET', url: '/statuses/retweeted_to_me.json'},
            // Returns the 20 most recent tweets of the authenticated user that have been retweeted by others.
            retweets_of_me: {method: 'GET', url: '/statuses/retweets_of_me.json'},
            // Returns the 20 most recent statuses posted by the authenticating user. It is also possible to request another user's timeline by using the screen_name or user_id parameter. The other users timeline will only be visible if they are not protected, or if the authenticating user's follow request was...
            user_timeline: {method: 'GET', url: '/statuses/user_timeline.json'},
            // Returns the 20 most recent retweets posted by users the specified user follows. The user is specified using the user_id or screen_name parameters. This method is identical to statuses/retweeted_to_me except you can choose the user to view.
            //retweeted_to_user: {method: 'GET', url: '/statuses/retweeted_to_user.json'},
            // Returns the 20 most recent retweets posted by the specified user. The user is specified using the user_id or screen_name parameters. This method is identical to statuses/retweeted_by_me except you can choose the user to view. Does not require authentication, unless the user is protected.
            //retweeted_by_user: {method: 'GET', url: '/statuses/retweeted_by_user.json'},
            // Show user objects of up to 100 members who retweeted the status.
            retweeted_by: {method: 'GET', url: '/statuses/{0}/retweeted_by.json'},
            // Show user ids of up to 100 users who retweeted the status.
            //ids: {method: 'GET', url: '/statuses/:id/retweeted_by/ids.json'},
            // Returns up to 100 of the first retweets of a given tweet.
            //retweets: {method: 'GET', url: '/statuses/retweets/{0}.json'},
            // Returns a single status, specified by the id parameter below. The status's author will be returned inline.
            show: {method: 'GET', url: '/statuses/show/{0}.json', id: 0},
            // Destroys the status specified by the required ID parameter. The authenticating user must be the author of the specified status. Returns the destroyed status if successful.
            destroy: {method: 'POST', url: '/statuses/destroy/{0}.json', id: 0},
            // Retweets a tweet. Returns the original tweet with retweet details embedded.
            retweet: {method: 'POST', url: '/statuses/retweet/{0}.json', id: 0},
            // Updates the authenticating user's status, also known as tweeting. To upload an image to accompany the tweet, use POST statuses/update_with_media. For each update attempt, the update text is compared with the authenticating user's recent tweets. Any attempt that would result in duplication will be...
            update: {method: 'POST', url: '/statuses/update.json'},
            // Updates the authenticating user's status and attaches media for upload. Unlike POST statuses/update, this method expects raw multipart data. Your POST request's Content-Type should be set to multipart/form-data with the media[] parameter The Tweet text will be rewritten to include the media...
            update_with_media: {method: 'POST', url: '/statuses/update_with_media.json', domain: 'upload'},
        },

        search: {
            // Returns tweets that match a specified query. To best learn how to use Twitter Search effectively, consult our guide to Using the Twitter Search API Notice: As of April 1st 2010, the Search API provides an option to retrieve "popular tweets" in addition to real-time search results. In an upcoming...
            search: {method: 'GET', url: '/search.json', domain: 'search'},
        },

        direct_messages: {
            // Returns the 20 most recent direct messages sent to the authenticating user. The XML and JSON versions include detailed information about the sender and recipient user. Important: This method requires an access token with RWD (read, write...
            direct_messages: {method: 'GET', url: '/direct_messages.json'},
            // Returns the 20 most recent direct messages sent by the authenticating user. The XML and JSON versions include detailed information about the sender and recipient user. Important: This method requires an access token with RWD (read, write...
            sent: {method: 'GET', url: '/direct_messages/sent.json'},
            // Important: This method requires an access token with RWD (read, write...
            destroy: {method: 'POST', url: '/direct_messages/destroy/{0}.json', id: 0},
            // Sends a new direct message to the specified user from the authenticating user. Requires both the user and text parameters and must be a POST. Returns the sent message in the requested format if successful.
            'new': {method: 'POST', url: '/direct_messages/new.json'},
            // Returns a single direct message, specified by an id parameter. Like the /1/direct_messages.format request, this method will include the user objects of the sender and recipient. Important: This method requires an access token with RWD (read, write...
            //direct_message: {method: 'GET', url: '/direct_messages/{0}.json'},
        },

        friendships: {
            // Returns an array of numeric IDs for every user following the specified user. This method is powerful when used in conjunction with users/lookup.
            followers: {method: 'GET', url: '/followers/ids.json'},
            // Returns an array of numeric IDs for every user the specified user is following. This method is powerful when used in conjunction with users/lookup.
            friends: {method: 'GET', url: '/friends/ids.json'},
            // Test for the existence of friendship between two users. Will return true if user_a follows user_b, otherwise will return false. Authentication is required if either user A or user B are protected. Additionally the authenticating user must be a follower of the protected user. Consider using...
            //exists: {method: 'GET', url: '/friendships/exists.json'},
            // Returns an array of numeric IDs for every user who has a pending request to follow the authenticating user.
            //incoming: {method: 'GET', url: '/friendships/incoming.json'},
            // Returns an array of numeric IDs for every protected user for whom the authenticating user has a pending follow request.
            //outgoing: {method: 'GET', url: '/friendships/outgoing.json'},
            // Returns detailed information about the relationship between two users.
            show: {method: 'GET', url: '/friendships/show.json'},
            // Allows the authenticating users to follow the user specified in the ID parameter. Returns the befriended user in the requested format when successful. Returns a string describing the failure condition when unsuccessful. If you are already friends with the user a HTTP 403 may be returned, though for...
            create: {method: 'POST', url: '/friendships/create.json'},
            // Allows the authenticating users to unfollow the user specified in the ID parameter. Returns the unfollowed user in the requested format when successful. Returns a string describing the failure condition when unsuccessful.
            destroy: {method: 'POST', url: '/friendships/destroy.json'},
            // Returns the relationship of the authenticating user to the comma separated list of up to 100 screen_names or user_ids provided. Values for connections can be: following, following_requested, followed_by, none.
            //lookup: {method: 'GET', url: '/friendships/lookup.json'},
            // Allows one to enable or disable retweets and device notifications from the specified user.
            //update: {method: 'POST', url: '/friendships/update.json'},
            // Returns an array of user_ids that the currently authenticated user does not want to see retweets from.
            //no_retweet_ids: {method: 'GET', url: '/friendships/no_retweet_ids.json'},
        },

        users: {
            // Return up to 100 users worth of extended information, specified by either ID, screen name, or combination of the two. The author's most recent status (if the authenticating user has permission) will be returned inline. This method is crucial for consumers of the Streaming API. It's also well suited...
            lookup: {method: 'GET', url: '/users/lookup.json'},
            // Access the profile image in various sizes for the user with the indicated screen_name. If no size is provided the normal image is returned. This resource does not return JSON or XML, but instead returns a 302 redirect to the actual image resource. This method should only be used by application...
            //{method: 'GET', url: '/users/profile_image/:screen_name.json'},
            // Runs a search for users similar to Find People button on Twitter.com. The results returned by people search on Twitter.com are the same as those returned by this API request. Note that unlike GET search, this method does not support any operators. Only the first 1000 matches are available.
            //search: {method: 'GET', url: '/users/search.json'},
            // Returns extended information of a given user, specified by ID or screen name as per the required id parameter. The author's most recent status will be returned inline.
            show: {method: 'GET', url: '/users/show.json'},
            // Returns an array of users that the specified user can contribute to.
            //contributees: {method: 'GET', url: '/users/contributees.json'},
            // Returns an array of users who can contribute to the specified account.
            //contributors: {method: 'GET', url: '/users/contributors.json'},
            // Access to Twitter's suggested user list. This returns the list of suggested user categories. The category can be used in GET users/suggestions/:slug to get the users in that category.
            //suggestions: {method: 'GET', url: '/users/suggestions.json'},
            // Access the users in a given category of the Twitter suggested user list. It is recommended that end clients cache this data for no more than one hour.
            //{method: 'GET', url: '/users/suggestions/:slug.json'},
            // Access the users in a given category of the Twitter suggested user list and return their most recent status if they are not a protected user.
            //{method: 'GET', url: '/users/suggestions/:slug/members.format.json'},
        },

        favorites: {
            // Returns the 20 most recent favorite statuses for the authenticating user or user specified by the ID parameter in the requested format.
            favorites: {method: 'GET', url: '/favorites.json'},
            // Favorites the status specified in the ID parameter as the authenticating user. Returns the favorite status when successful.
            create: {method: 'POST', url: '/favorites/create/{0}.json', id: 0},
            // Un-favorites the status specified in the ID parameter as the authenticating user. Returns the un-favorited status in the requested format when successful.
            destroy: {method: 'POST', url: '/favorites/destroy/{0}.json', id: 0},
        },

        lists: {
            // Returns all lists the authenticating or specified user subscribes to, including their own. The user is specified using the user_id or screen_name parameters. If no user is given, the authenticating user is used.
            all: {method: 'GET', url: '/lists/all.json'},
            // Returns tweet timeline for members of the specified list. Historically, retweets were not available in list timeline responses but you can now use the include_rts=true parameter to additionally receive retweet objects.
            statuses: {method: 'GET', url: '/lists/statuses.json'},
            // Removes the specified member from the list. The authenticated user must be the list's owner to remove members from the list.
            //destroy: {method: 'POST', url: '/lists/members/destroy.json'},
            // Returns the lists the specified user has been added to. If user_id or screen_name are not provided the memberships for the authenticating user are returned.
            //memberships: {method: 'GET', url: '/lists/memberships.json'},
            // Returns the subscribers of the specified list. Private list subscribers will only be shown if the authenticated user owns the specified list.
            //subscribers: {method: 'GET', url: '/lists/subscribers.json'},
            // Subscribes the authenticated user to the specified list.
            //create: {method: 'POST', url: '/lists/subscribers/create.json'},
            // Check if the specified user is a subscriber of the specified list. Returns the user if they are subscriber.
            //show: {method: 'GET', url: '/lists/subscribers/show.json'},
            // Unsubscribes the authenticated user from the specified list.
            //destroy: {method: 'POST', url: '/lists/subscribers/destroy.json'},
            // Adds multiple members to a list, by specifying a comma-separated list of member ids or screen names. The authenticated user must own the list to be able to add members to it. Note that lists can't have more than 500 members, and you are limited to adding up to 100 members to a list at a time with...
            //create_all: {method: 'POST', url: '/lists/members/create_all.json'},
            // Check if the specified user is a member of the specified list.
            //show: {method: 'GET', url: '/lists/members/show.json'},
            // Returns the members of the specified list. Private list members will only be shown if the authenticated user owns the specified list.
            //members: {method: 'GET', url: '/lists/members.json'},
            // Add a member to a list. The authenticated user must own the list to be able to add members to it. Note that lists can't have more than 500 members.
            //create: {method: 'POST', url: '/lists/members/create.json'},
            // Deletes the specified list. The authenticated user must own the list to be able to destroy it.
            //destroy: {method: 'POST', url: '/lists/destroy.json'},
            // Updates the specified list. The authenticated user must own the list to be able to update it.
            //update: {method: 'POST', url: '/lists/update.json'},
            // Creates a new list for the authenticated user. Note that you can't create more than 20 lists per account.
            //create: {method: 'POST', url: '/lists/create.json'},
            // Returns the lists of the specified (or authenticated) user. Private lists will be included if the authenticated user is the same as the user whose lists are being returned.
            //lists: {method: 'GET', url: '/lists.json'},
            // Returns the specified list. Private lists will only be shown if the authenticated user owns the specified list.
            //show: {method: 'GET', url: '/lists/show.json'},
        },

        account: {
            // Returns the remaining number of API requests available to the requesting user before the API limit is reached for the current hour. Calls to rate_limit_status do not count against the rate limit. If authentication credentials are provided, the rate limit status for the authenticating user is...
            rate_limit_status: {method: 'GET', url: '/account/rate_limit_status.json'},
            // Returns an HTTP 200 OK response code and a representation of the requesting user if authentication was successful; returns a 401 status code and an error message if not. Use this method to test if supplied user credentials are valid.
            verify_credentials: {method: 'GET', url: '/account/verify_credentials.json'},
            // Ends the session of the authenticating user, returning a null cookie. Use this method to sign users out of client-facing applications like widgets.
            //end_session: {method: 'POST', url: '/account/end_session.json'},
            // Sets which device Twitter delivers updates to for the authenticating user. Sending none as the device parameter will disable SMS updates.
            //update_delivery_device: {method: 'POST', url: '/account/update_delivery_device.json'},
            // Sets values that users are able to set under the "Account" tab of their settings page. Only the parameters specified will be updated.
            //update_profile: {method: 'POST', url: '/account/update_profile.json'},
            // Updates the authenticating user's profile background image. This method can also be used to enable or disable the profile background image. Although each parameter is marked as optional, at least one of image, tile or use must be provided when making this request.
            //update_profile_background_image: {method: 'POST', url: '/account/update_profile_background_image.json'},
            // Sets one or more hex values that control the color scheme of the authenticating user's profile page on twitter.com. Each parameter's value must be a valid hexidecimal value, and may be either three or six characters (ex: #fff or #ffffff).
            //update_profile_colors: {method: 'POST', url: '/account/update_profile_colors.json'},
            // Updates the authenticating user's profile image. Note that this method expects raw multipart data, not a URL to an image. This method asynchronously processes the uploaded file before updating the user's profile image URL. You can either update your local cache the next time you request the user's...
            //update_profile_image: {method: 'POST', url: '/account/update_profile_image.json'},
            // Returns the current count of friends, followers, updates (statuses) and favorites of the authenticating user.
            //totals: {method: 'GET', url: '/account/totals.json'},
            // Returns settings (including current trend, geo and sleep time information) for the authenticating user.
            //settings: {method: 'GET', url: '/account/settings.json'},
            // Updates the authenticating user's settings.
            //settings: {method: 'POST', url: '/account/settings.json'},
        },

        /*
        notifications: {
            // Enables device notifications for updates from the specified user. Returns the specified user when successful.
            follow: {method: 'POST', url: '/notifications/follow.json'},
            // Disables notifications for updates from the specified user to the authenticating user. Returns the specified user when successful.
            leave: {method: 'POST', url: '/notifications/leave.json'},
        },

        saved_searches: {
            // Returns the authenticated user's saved search queries.
            saved_searches: {method: 'GET', url: '/saved_searches.json'},
            // Retrieve the information for the saved search represented by the given id. The authenticating user must be the owner of saved search ID being requested.
            {method: 'GET', url: '/saved_searches/show/:id.json'},
            // Create a new saved search for the authenticated user. A user may only have 25 saved searches.
            create: {method: 'POST', url: '/saved_searches/create.json'},
            // Destroys a saved search for the authenticating user. The authenticating user must be the owner of saved search id being destroyed.
            {method: 'POST', url: '/saved_searches/destroy/:id.json'},
        },


        geo: {
            // Returns all the information about a known place.
            {method: 'GET', url: '/geo/id/:place_id.json'},
            // This method is deprecated and has been replaced by geo/search. Please update your applications with the new endpoint.
            nearby_places: {method: 'GET', url: '/geo/nearby_places.json'},
            // Given a latitude and a longitude, searches for up to 20 places that can be used as a place_id when updating a status. This request is an informative call and will deliver generalized results about geography.
            reverse_geocode: {method: 'GET', url: '/geo/reverse_geocode.json'},
            // Search for places that can be attached to a statuses/update. Given a latitude and a longitude pair, an IP address, or a name, this request will return a list of all the valid places that can be used as the place_id when updating a status. Conceptually, a query can be made from the user's location...
            search: {method: 'GET', url: '/geo/search.json'},
            // Locates places near the given coordinates which are similar in name. Conceptually you would use this method to get a list of known places to choose from first. Then, if the desired place doesn't exist, make a request to post/geo/place to create a new one. The token contained in the response is the...
            similar_places: {method: 'GET', url: '/geo/similar_places.json'},
            // Creates a new place object at the given latitude and longitude. Before creating a place you need to query GET geo/similar_places with the latitude, longitude and name of the place you wish to create. The query will return an array of places which are similar to the one you wish to create, and a...
            place: {method: 'POST', url: '/geo/place.json'},
        },
        */

        trends: {
            // Returns the top 10 trending topics for a specific WOEID, if trending information is available for it. The response is an array of "trend" objects that encode the name of the trending topic, the query parameter that can be used to search for the topic on Twitter Search, and the Twitter Search URL....
            trends: {method: 'GET', url: '/trends/{0}.json', id: 0},
            // Returns the locations that Twitter has trending topic information for. The response is an array of "locations" that encode the location's WOEID and some other human-readable information such as a canonical name and country the location belongs in. A WOEID is a Yahoo! Where On Earth ID.
            //available: {method: 'GET', url: '/trends/available.json'},
            // Returns the top 20 trending topics for each hour in a given day.
            //daily: {method: 'GET', url: '/trends/daily.json'},
            // Returns the top 30 trending topics for each day in a given week.
            //weekly: {method: 'GET', url: '/trends/weekly.json'},
        },

        /*
        blocks: {
            // Returns an array of user objects that the authenticating user is blocking. Consider using GET blocks/blocking/ids with GET users/lookup instead of this method.
            blocking: {method: 'GET', url: '/blocks/blocking.json'},
            // Returns an array of numeric user ids the authenticating user is blocking.
            ids: {method: 'GET', url: '/blocks/blocking/ids.json'},
            // Returns if the authenticating user is blocking a target user. Will return the blocked user's object if a block exists, and error with a HTTP 404 response code otherwise.
            exists: {method: 'GET', url: '/blocks/exists.json'},
            // Blocks the specified user from following the authenticating user. In addition the blocked user will not show in the authenticating users mentions or timeline (unless retweeted by another user). If a follow or friend relationship exists it is destroyed.
            create: {method: 'POST', url: '/blocks/create.json'},
            // Un-blocks the user specified in the ID parameter for the authenticating user. Returns the un-blocked user in the requested format when successful. If relationships existed before the block was instated, they will not be restored.
            destroy: {method: 'POST', url: '/blocks/destroy.json'},
            // The user specified in the id is blocked by the authenticated user and reported as a spammer.
            report_spam: {method: 'POST', url: '/report_spam.json'},
        },
        */

        oauth: {
            // Allows a Consumer application to use an OAuth request_token to request user authorization. This method is a replacement of Section 6.2 of the OAuth 1.0 authentication flow for applications using the Sign in with Twitter authentication flow. The method will use the currently logged in user as the...
            authenticate: {method: 'GET', url: '/oauth/authenticate', domain: 'oauth'},
            // Allows a Consumer application to use an OAuth Request Token to request user authorization. This method fulfills Section 6.2 of the OAuth 1.0 authentication flow. Desktop applications must use this method (and cannot use GET oauth/authenticate). Please use HTTPS for this method, and all other OAuth...
            authorize: {method: 'GET', url: '/oauth/authorize', domain: 'oauth'},
            // Allows a Consumer application to exchange the OAuth Request Token for an OAuth Access Token. This method fulfills Section 6.3 of the OAuth 1.0 authentication flow. The OAuth access token may also be used for xAuth operations. Please use HTTPS for this method, and all other OAuth token negotiation...
            access_token: {method: 'POST', url: '/oauth/access_token', domain: 'oauth', format: 'text'},
            // Allows a Consumer application to obtain an OAuth Request Token to request user authorization. This method fulfills Section 6.1 of the OAuth 1.0 authentication flow. It is strongly recommended you use HTTPS for all OAuth authorization steps. Usage Note: Only ASCII values are accepted for the...
            request_token: {method: 'POST', url: '/oauth/request_token', domain: 'oauth', format: 'text'},
        },

        /*
        help: {
            // Returns the string "ok" in the requested format with a 200 OK HTTP status code. This method is great for sending a HEAD request to determine our servers current time.
            test: {method: 'GET', url: '/help/test.json'},
            // Returns the current configuration used by Twitter including twitter.com slugs which are not usernames, maximum photo resolutions, and t.co URL lengths. It is recommended applications request this endpoint when they are loaded, but no more than once a day.
            configuration: {method: 'GET', url: '/help/configuration.json'},
            // Returns the list of languages supported by Twitter along with their ISO 639-1 code. The ISO 639-1 code is the two letter value to use if you include lang with any of your requests.
            languages: {method: 'GET', url: '/help/languages.json'},
        },

        legal: {
            // Returns Twitter's Privacy Policy in the requested format.
            privacy: {method: 'GET', url: '/legal/privacy.json'},
            // Returns the Twitter Terms of Service in the requested format. These are not the same as the Developer Rules of the Road.
            tos: {method: 'GET', url: '/legal/tos.json'},
        },
        */

        // ex
        urls: {
            resolve: {method: 'GET', url: '/urls/resolve.json'},
        },
    };

    var createRequest = function(rest, data, success, error) {
        var url = api.buildUrl(rest);

        var request = {};
        request.sign = function() {
            // sign the request
            if (authMode == 'OAuth') {
                console.log('OAuth Signed Request');

                // compute hash of all base string
                var hash = null;
                if (rest.domain == 'upload') { // not sign params
                    hash = oauth.sign(rest.method, url);
                } else {
                    hash = oauth.sign(rest.method, url, data);
                }

                // filter non-oauth data out
                var nonOAuthData = {}
                $.each(data, function(k, v) {
                    if (k.indexOf('oauth_') == -1) {
                        nonOAuthData[k] = v;
                    }
                });
                data = nonOAuthData;

                setAuthorizationHeader(hash.header);

            } else if (authMode == 'Basic') {
                setAuthorizationHeader('Basic ' + bauth.getConfd().x);
            }
        };

        request.send = function() {
            console.log('Request.send():', url, data);
            this.sign();

            var options = {
                type: rest.method || 'GET',
                url: url,
                data: data,
                success: success,
                error: error,
                dataType: rest.format || 'json',
                timeout: 10*1000,
            };

            if (rest.domain == 'upload') { // media upload
                options.contentType = false; // should set false while not 'multipart/form-data' (missing boundary)
                options.processData = false;
                options.data = data.formData; // only include form data
            }

            $.ajax(options);
        }
        return request;
    };

    var createAPI = function(rest) {
        var defaultParam = {};
        var retryInterval = 30*1000;

        var api = {};
        api.addDefaultParam = function(p) {
            $.each(p, function(k, v) {
                defaultParam[k] = v;
            });
        };

        api.sendRequest = function(param, success, error) {
            param = param || {};
            $.each(defaultParam, function(k, v) {
                param[k] = v;
            });

            var req = createRequest(rest, param, function(data) {
                if (data.error) { // handle non-transmission errors
                    error({textStatus: data.error});
                    return;
                } else if (data.errors) {
                    error({textStatus: data.errors[0].message});
                    return;
                } else {
                    success(data);
                }
            }, function(xmlHttpRequest, textStatus, errorThrown) {
                console.log('API.sendRequest() - error'/*, xmlHttpRequest, textStatus, errorThrown*/);
                /*
200 OK: Success!
304 Not Modified: There was no new data to return.
400 Bad Request: The request was invalid. An accompanying error message will explain why. This is the status code will be returned during rate limiting.
401 Unauthorized: Authentication credentials were missing or incorrect.
403 Forbidden: The request is understood, but it has been refused. An accompanying error message will explain why. This code is used when requests are being denied due to update limits.
404 Not Found: The URI requested is invalid or the resource requested, such as a user, does not exists.
406 Not Acceptable: Returned by the Search API when an invalid format is specified in the request.
420 Enhance Your Calm: Returned by the Search and Trends API when you are being rate limited.
500 Internal Server Error: Something is broken. Please post to the group so the Twitter team can investigate.
502 Bad Gateway: Twitter is down or being upgraded.
503 Service Unavailable: The Twitter servers are up, but overloaded with requests. Try again later.
                */

                var errorStatus = {
                    xmlHttpRequest: xmlHttpRequest,
                    textStatus: textStatus,
                    errorThrown: errorThrown,
                    retry: function() {
                        setTimeout(function() {
                            console.warn('API.sendRequest(): retry for ', xmlHttpRequest, textStatus)
                            req.send();
                        }, retryInterval);
                    }
                };
                if (textStatus != 'timeout' && (xmlHttpRequest.status == 401 ||
                    xmlHttpRequest.status == 404 ||
                    xmlHttpRequest.status == 406)) {
                    delete errorStatus.retry // do not retry for these errors
                }
                error(errorStatus);
            });
            req.send();
        };

        return api;
    };

    var setAuthorizationHeader = function(header) {
        $.ajaxSetup({
            beforeSend: function(xhr) {
                xhr.setRequestHeader('Authorization', header);
            }
        });
    };

    var kt = {};
    kt.getAuthMode = function() {
        return authMode;
    };

    kt.getCurrentUserName = function() {
        if (authMode == 'Basic' && bauth) {
            return bauth.getScreenName();
        } else if (authMode == 'OAuth' && oauth) {
            return oauth.getScreenName();
        } else {
            console.error('getCurrentUserName(): Not login.');
        }
    };

    kt.getBAuth = function() {
        if (bauth) {
            return bauth;
        }

        var confd = {};

        var ba = {};
        ba.saveConfd = function() {
            //localStorage.x_x = JSON.stringify(confd);
            chrome.storage.local.set({'x_x': JSON.stringify(confd)});
        };

        ba.loadConfd = function() {
            /*
            if (localStorage.x_x) {
                confd = JSON.parse(localStorage.x_x);
                return true;
            }
            */
            chrome.storage.local.get('x_x', function(result){
                confd = result.x_x;
                return true;
            });
            return false;
        };

        ba.getConfd = function() {
            return confd;
        };

        ba.removeConfd = function() {
            confd = {};
            //delete localStorage.x_x;
        };

        ba.setAPIBase = function(url) {
            api.bauthBase = url;
        };

        ba.getScreenName = function() {
            return confd.screen_name;
        };

        ba.login = function(user, pass, success, error) {
            console.log('BAuth.login()');

            authMode = 'Basic';

            if (user && pass) {
                confd.screen_name = user;
                confd.x = btoa(user + ':' + pass);

                setAuthorizationHeader('Basic ' + confd.x);

                var vc = createAPI(api.account.verify_credentials);
                vc.sendRequest({}, function(ret) {
                    console.log('BAuth.login() - result:', ret);
                    ba.saveConfd();
                    success(user);
                }, error);

            } else if (user == '' || pass == '') {
                error({textStatus: 'empty username or password'});
            } else {
                this.loadConfd();
                if (confd) {
                    console.log('BAuth.login(): already login, user: ', confd.screen_name)

                    // just set auth header
                    //setAuthorizationHeader('Basic ' + confd.x);

                    success(confd.screen_name);
                } else {
                    error({textStatus: 'empty username or password'});
                }
            }
        };

        ba.logout = function() {
            console.log('BAuth.logout()');
            this.removeConfd();
            authMode = null;
        };

        bauth = ba;
        return ba;
    };

    kt.getOAuth = function() {
        if (oauth) {
            return oauth;
        }

        var consumerKey = null;
        var consumerSec = null;

        var token = {};

        var oa = {};

        oa.getScreenName = function() {
            return token.screen_name;
        };

        oa.setConsumerToken = function(key, secret) {
            consumerKey = key;
            consumerSec = secret;
        };

        oa.requestToken = function(callbackURL, success, error) {
            console.log('OAuth.requestToken()');

            var rt = createAPI(api.oauth.request_token);
            rt.sendRequest({oauth_callback: callbackURL}, success, error);
        };

        oa.authorize = function() {
            console.log('OAuth.authorize()', token);
            window.location = ut.addURLParam(api.oauthBase+api.oauth.authorize.url, 'oauth_token', token.oauth_token);
        };

        oa.authenticate = function() {
            console.log('OAuth.authenticate()', token);
            window.location = ut.addURLParam(api.oauthBase+api.oauth.authenticate.url, 'oauth_token', token.oauth_token);
        };

        oa.access = function(verifier, success, error) {
            console.log('OAuth.access()', token);

            var at = createAPI(api.oauth.access_token);
            at.sendRequest({oauth_verifier: verifier}, success, error);
        };

        oa.saveToken = function() {
            //localStorage.token = JSON.stringify(token);
            chrome.storage.local.set({'token': JSON.stringify(token)});
        };

        oa.loadToken = function() {
            /*
            if (localStorage.token) {
                token = JSON.parse(localStorage.token);
                return true;
            }
            */
            chrome.storage.local.get('token', function(result){
                token = result.token;
                return true;
            });
            return false;
        };

        oa.removeToken = function() {
            token = {};
            //delete localStorage.token;
        };

        oa.sign = function(type, url, data) {
            var sig = {
                //consumer_key: consumerKey,
                //shared_secret: consumerSec,
                consumer_key: 'XYW1D90IPRNnw5LN99InQ',
                shared_secret: 'UqRqzmXAHab4DBq8kekZfSy6I5jXAPkDuvlwhktz8'
            }

            if (token.oauth_token && token.oauth_token_secret) {
                sig.oauth_token = token.oauth_token;
                sig.oauth_secret = token.oauth_token_secret;
            }

            return OAuthSimple().sign({
                path: url,
                action: type,
                parameters: data,
                signatures: sig
            });
        };

        oa.login = function(callbackURL, verifier, success, error) {
            console.log('OAuth.login()');

            authMode = 'OAuth';
            this.loadToken();

            if (token && token.screen_name) {
                console.log('OAuth.login(): already login, user: ', token.screen_name)
                success(token.screen_name);
            } else if (verifier) {
                console.log('OAuth.login(): already verified');
                this.access(verifier, function(ret) {
                    console.log('access() - result:', ret);

                    // update token
                    token = ut.getQueryStringParams(ret);
                    oa.saveToken();

                    success(token.screen_name);

                }, error);
            } else {
                console.log('OAuth.login(): init oauth process');

                // reset token first
                token = {}
                this.requestToken(callbackURL, function(ret) {
                    console.log('requestToken() - result:', ret);

                    token = ut.getQueryStringParams(ret);
                    oa.saveToken();

                    // redirect
                    oa.authorize(); // use the original(previous) URL for the callbackURL
                    //oa.authenticate()  // there's a bug of API that it can not redirect to 'chrome-extension://*' when it is set to the twitter app's callbackURL

                }, error);
            }
        };

        oa.logout = function() {
            console.log('OAuth.logout()');
            this.removeToken();
            authMode = null;
        }

        oauth = oa;
        return oa;
    };


    kt.user = {
        show: function(screenName, success, error) {
            console.log('User.show()');
            var s = createAPI(api.users.show);
            s.sendRequest({screen_name: screenName,
                             include_entities: true}, success, error);
        },

        rateLimit: function(success, error) {
            console.log('User.rateLimit()');
            var rls = createAPI(api.account.rate_limit_status);
            rls.sendRequest(null, success, error);
        }
    };

    kt.tweet = {
        show: function(id, success, error) {
            console.log('Tweet.show()');
            var rest = api.statuses.show;
            rest.id = id;
            var s = createAPI(rest);
            s.sendRequest({include_entities: true}, success, error);
        },

        update: function(msg, to, success, error) {
            console.log('Tweet.update()');
            var u = createAPI(api.statuses.update);
            var params = {status: msg, include_entities: true};
            if (to) {
                params.in_reply_to_status_id = to;
            }
            u.sendRequest(params, success, error);
        },

        updateMedia: function(msg, to, file, success, error) {
            console.log('Tweet.updateMedia()');
            var u = createAPI(api.statuses.update_with_media);

            // build form data
            var formData = new FormData();
            if (msg) { // msg could be null
                formData.append('status', msg);
            }
            //formData.append('include_entities', true);
            if (to) {
                formData.append('in_reply_to_status_id', to);
            }
            formData.append('media[]', file);

            u.sendRequest({formData: formData}, success, error);
        },

        retweet: function(id, success, error) {
            console.log('Tweet.retweet()');
            var rest = api.statuses.retweet;
            rest.id = id;
            var r = createAPI(rest);
            r.sendRequest({include_entities: true}, success, error);
        },

        destroy: function(id, success, error) {
            console.log('Tweet.destroy()');
            var rest = api.statuses.destroy;
            rest.id = id;
            var d = createAPI(rest);
            d.sendRequest(null, success, error);
        },

        directMsg: function(screenName, msg, success, error) {
            console.log('Tweet.directMsg()');
            var n = createAPI(api.direct_messages.new);
            n.sendRequest({screen_name: screenName, text: msg, include_entities: true}, success, error);
        },

        destroyMsg: function(id, success, error) {
            console.log('Tweet.destroyMsg()');
            var rest = api.direct_messages.destroy;
            rest.id = id;
            var d = createAPI(rest);
            d.sendRequest(null, success, error);
        },

        retweetedBy: function(id, success, error) {
            console.log('Tweet.retweetedBy()');
            var rest = api.statuses.retweeted_by;
            rest.id = id;
            var rb = createAPI(rest);
            rb.sendRequest({include_entities: true}, success, error);
        },
    };

    kt.fav = {
        create: function(id, success, error) {
            console.log('Fav.create()');
            var rest = api.favorites.create;
            rest.id = id;
            var c = createAPI(rest);
            c.sendRequest(null, success, error);
        },

        destroy: function(id, success, error) {
            console.log('Fav.destroy()');
            var rest = api.favorites.destroy;
            rest.id = id;
            var d = createAPI(rest);
            d.sendRequest(null, success, error);
        },

    };

    kt.urls = {
        resolve: function(urls, success, error) {
            console.log('Url.resolve()');
            var rest = api.urls.resolve;
            var r = createAPI(rest);
            r.sendRequest(urls, success, error);
        }
    };


    kt.friendship = {
        show: function(target, success, error) {
            console.log('Friendship.show()');
            var s = createAPI(api.friendships.show);
            s.sendRequest({target_screen_name: target}, success, error);
        },

        create: function(target, success, error) {
            console.log('Friendship.create()');
            var c = createAPI(api.friendships.create);
            c.sendRequest({screen_name: target}, success, error);
        },

        destroy: function(target, success, error) {
            console.log('Friendship.destroy()');
            var d = createAPI(api.friendships.destroy);
            d.sendRequest({screen_name: target}, success, error);
        }
    };

    var createStatuses = function(rest) {
        var sinceID = null;
        var maxID = null;
        var maxIDForAll = null;
        var newTweets = [];
        var allTweets = [];
        var refreshData = {};
        var exportTimer = null;

        var isSearch = function() {
            return api.search.search == rest;
        }

        var statuses = createAPI(rest);
        statuses.addDefaultParam({
            include_entities: true,
        });

        statuses.setRefreshTime = function(s) { // in min, set 0 to stop
            var interval = s*60*1000;
            if (refreshData.interval == interval) {
                console.warn('Statuses.setRefreshTime(): ignore time interval');
                return;
            }
            console.log('Statuses.setRefreshTime(): ', s);
            refreshData.interval = interval;

            if (refreshData.id) {
                clearInterval(refreshData.id);
            }

            if (refreshData.interval && refreshData.success && refreshData.error) {
                refreshData.id = setInterval(function() {
                    statuses.getNew(refreshData.success, refreshData.error);
                }, refreshData.interval);
            } else {
                console.warn('Statuses.setRefreshTime(): stop or invalid handlers');
            }
        };

        statuses.getCachedTweets = function() {
            return newTweets;
        };

        statuses.clearCachedTweets = function() {
            newTweets = [];
        };

        statuses.get = function(success, error) {
            this.sendRequest(null, function(data) {
                console.log('Statuses.get.sendRequest() - success');

                if (isSearch()) {
                    data = data.results;
                }

                if (data.length) {
                    // update IDs
                    sinceID = data[0].id_str;
                    maxID = data[data.length-1].id_str;

                    // the latest is the last
                    data = data.reverse();
                }

                // start refresh interval if not started already
                if (refreshData.interval && !refreshData.id) {
                    refreshData.id = setInterval(function() {
                        statuses.getNew(success, error);
                    }, refreshData.interval);
                }
                refreshData.success = success;
                refreshData.error = error;

                success(data);

            }, error);
        };

        statuses.getMore = function(success, error) {
            if (!maxID) {
                console.warn('Statuses.getMore(): max_id is null');
                return;
            }

            this.sendRequest({max_id: maxID}, function(data) {
                console.log('Statuses.getMore.sendRequest() - success');

                if (isSearch()) {
                    data = data.results;
                }

                if (data.length) {
                    // update maxID
                    maxID = data[data.length-1].id_str;

                    // the latest is the first (first is duplicated);
                    data = data.slice(1);
                }

                success(data);

            }, error);
        };

        statuses.getAll = function(success, error) {
            if (!maxIDForAll) {
                maxIDForAll = sinceID;
            }

            if (!maxIDForAll) {
                console.warn('Statuses.getAll(): maxIDForAll is null');
                return;
            }

            if (isSearch()) {
                console.warn('Statuses.getAll(): not support search');
                return;
            }

            statuses.sendRequest({max_id: maxIDForAll, count: 200}, function(data) {
                console.log('Statuses.getAll.sendRequest() - success');

                if (data.length > 1) {
                    // update maxIDForAll
                    maxIDForAll = data[data.length-1].id_str;

                    // the latest is the first (first is duplicated);
                    if (allTweets.length) {
                        data = data.slice(1);
                    }

                    allTweets = allTweets.concat(data);
                    console.debug('allTweets len:', allTweets.length);

                    success(allTweets.length); // indicate progress

                    exportTimer = setTimeout(function() {
                        statuses.getAll(success, error);
                    }, 5000);
                } else {
                    success(allTweets);
                }

            }, function(errorStatus) {
                if (errorStatus.retry) {
                    errorStatus.retry();
                } else {
                    error(errorStatus);
                }
            });
        };

        statuses.getNew = function(success, error) {
            if (!sinceID) {
                console.warn('Statuses.getNew(): since_id is null');
                return;
            }

            // should catch new tweets as much as possible
            var param = {since_id: sinceID};
            if (isSearch()) {
                param.rpp = 100;
            } else {
                param.count = 200;
            }
            this.sendRequest(param, function(data) {
                console.log('Statuses.getNew.sendRequest() - success');

                if (isSearch()) {
                    data = data.results;
                }

                if (data.length) {
                    // update sinceID
                    sinceID = data[0].id_str;
                    // the latest is the last
                    data = data.reverse();
                    newTweets = newTweets.concat(data);
                }

                success(data);

            }, function(errorStatus) {
                if (errorStatus.retry) {
                    // overwrite and do nothing,
                    // getNew() do not need to retry for any errors, since the refresh will do for this.
                    errorStatus.retry = function() {}
                }
                error(errorStatus);
            });
        };

        statuses.destroy = function() {
            console.log('Statuses.destroy()');

            if (refreshData.id) {
                clearInterval(refreshData.id);
            }

            if (exportTimer) {
                clearTimeout(exportTimer);
            }
        };

        return statuses;
    }

    kt.createHomeTL = function() {
        console.log('createHomeTL()');
        var homeTL = createStatuses(api.statuses.home_timeline);
        return homeTL;
    };

    kt.createUserTL = function(screenName) {
        console.log('createUserTL()');
        var userTL = createStatuses(api.statuses.user_timeline);
        if (screenName) {
            userTL.addDefaultParam({
                screen_name: screenName,
            });
        }
        userTL.addDefaultParam({include_rts: true});

        return userTL;
    };

    kt.createMentionsTL = function() {
        console.log('createMentionsTL()');
        var mentionsTL = createStatuses(api.statuses.mentions);
        return mentionsTL;
    };

    kt.createRetweetsTL = function() {
        console.log('createRetweetsTL()');
        var retweetsTL = createStatuses(api.statuses.retweets_of_me);
        return retweetsTL;
    };

    kt.createMessagesTL = function() {
        console.log('createMessagesTL()');

        var messagesTL = {};
        var receivedTL = createStatuses(api.direct_messages.direct_messages);
        var sentTL = createStatuses(api.direct_messages.sent);
        var initalRecved = [];
        var initalSent = [];

        messagesTL.setRefreshTime = function(s) {
            receivedTL.setRefreshTime(s);
            sentTL.setRefreshTime(s);
        };

        messagesTL.sortByDate = function(data) {
            data.sort(function(a, b) {
                //return (new Date(a.created_at)) > (new Date(b.created_at));
                return Number(a.id_str) > Number(b.id_str);
            });
        };

        messagesTL.getCachedTweets = function() {
            var cached = receivedTL.getCachedTweets();
            cached = cached.concat(sentTL.getCachedTweets());

            messagesTL.sortByDate(cached);
            return cached;
        };

        messagesTL.clearCachedTweets = function() {
            receivedTL.clearCachedTweets();
            sentTL.clearCachedTweets();
        };

        messagesTL.onTweetsData = function(success) {
            if (!initalSent && !initalRecved) {
                success();
            } else if (initalSent.length != 0 && initalRecved.length != 0) {
                var initialTweets = initalRecved.concat(initalSent)
                messagesTL.sortByDate(initialTweets);
                success(initialTweets);
                initalRecved = null;
                initalSent = null;
            }
        };

        messagesTL.get = function(success, error)  {
            receivedTL.get(function(recvedData) {
                if (initalRecved) {
                    initalRecved = recvedData;
                }
                messagesTL.onTweetsData(success);
            }, error);

            sentTL.get(function(sentData) {
                if (initalSent) {
                    initalSent = sentData;
                }
                messagesTL.onTweetsData(success);
            }, error);
        };

        messagesTL.getMore = function(success, error) {
            receivedTL.getMore(function(recvedData) {
                sentTL.getMore(function(sentData) {
                    var more = recvedData.concat(sentData);
                    messagesTL.sortByDate(more);
                    more.reverse() // more is the reverse to new
                    success(more);
                }, error);
            }, error);
        };

        return messagesTL;
    };

    kt.createFavoritesTL = function() {
        console.log('createFavoritesTL()');
        var favoritesTL = createStatuses(api.favorites.favorites);
        return favoritesTL;
    };

    var createFriendship = function(rest) {
        var cursor = -1;
        var ids = [];

        var friendship = createAPI(rest);
        friendship.getDirect = function(success, error) {
            if (ids.length == 0) {
                success([]); // pass empty users
                return;
            }

            var userids = ids.splice(0, 100); // max 100 users
            var lookup = createAPI(api.users.lookup);
            lookup.sendRequest({include_entities: true, user_id: userids.join()}, function(data) {
                console.log('Friendship.getDirect.sendRequest() - success');

                // sort
                var sorted = [];
                $.each(userids, function(i, id) {
                    for (j in data) {
                        if (data[j].id == id) {
                            sorted.push(data[j]);
                            break;
                        }
                    }

                })
                success(sorted);
            }, error);
        };

        friendship.get = function(success, error) {

            if (ids.length) {
                friendship.getDirect(success, error);
            } else {
                this.sendRequest({cursor: cursor}, function(data) {
                    console.log('Friendship.get.sendRequest() - success');

                    // update cursor
                    cursor = data.next_cursor_str;
                    ids = data.ids;

                    friendship.getDirect(success, error);
                }, error);
            }
        };

        return friendship;
    };

    kt.createFollowers = function(screenName) {
        console.log('createFollowers()');
        var followers = createFriendship(api.friendships.followers);
        if (screenName) {
            followers.addDefaultParam({
                screen_name: screenName,
            });
        }
        return followers;
    };

    kt.createFriends = function(screenName) {
        console.log('createFriends()');
        var friends = createFriendship(api.friendships.friends);
        if (screenName) {
            friends.addDefaultParam({
                screen_name: screenName,
            });
        }
        return friends;
    };

    kt.createSearchTL = function(q) {
        console.log('createSearchTL()');
        var searchTL = createStatuses(api.search.search);
        searchTL.addDefaultParam({
            q: q,
            //show_user: true,
        });
        return searchTL;
    };

    kt.createTrends = function(woeid) {
        console.log('createTrends()');
        var cache = [];
        var refreshData = {};

        var rest = api.trends.trends;
        rest.id = woeid;
        var trends = createAPI(rest);

        trends.setRefreshTime = function(s) { // in min, set 0 to stop
            var interval = s*60*1000;
            if (refreshData.interval == interval) {
                console.warn('Trends.setRefreshTime(): ignore time interval');
                return;
            }
            console.log('Trends.setRefreshTime(): ', s);
            refreshData.interval = interval;

            if (refreshData.id) {
                clearInterval(refreshData.id);
            }

            if (refreshData.interval && refreshData.success && refreshData.error) {
                refreshData.id = setInterval(function() {
                    trends.get(refreshData.success, refreshData.error);
                }, refreshData.interval);
            } else {
                console.warn('Trends.setRefreshTime(): stop or invalid handlers');
            }
        };

        trends.get = function(success, error) {
            trends.sendRequest(null, function(data) {
                $.each(data[0].trends, function(i, t) {
                    var found =  -1;
                    for (var j = 0; j != cache.length; ++j) {
                        if (cache[j].name == t.name) {
                            found = j;
                            break;
                        }
                    }

                    if (found == -1) {
                        t.state = 'new';
                    } else {
                        if (found < i) {
                            t.state = 'down';
                        } else if (found > i) {
                            t.state = 'up';
                        } else {
                            t.state = 'level';
                        }
                        //cache.splice(found, 1); // remove in cache
                    }
                });
                // insert top of cache
                cache = data[0].trends.concat(cache);

                // start refresh interval if not started already
                if (refreshData.interval && !refreshData.id) {
                    refreshData.id = setInterval(function() {
                        trends.get(success, error);
                    }, refreshData.interval);
                }
                refreshData.success = success;
                refreshData.error = error;

                success(data[0].trends);
            }, error);
        };


        trends.destroy = function() {
            console.log('Trends.destroy()');
            if (refreshData.id) {
                clearInterval(refreshData.id);
            }
        };

        return trends;
    };

    kt.createLists = function() {
        console.log('createLists()');
        var lists = createAPI(api.lists.all);
        lists.get = function(success, error) {
            lists.sendRequest(null, function(data) {
                // sort by list full name
                data.sort(function(a, b) {
                    if (a.full_name > b.full_name) {
                        return 1;
                    } else if (a.full_name < b.full_name) {
                        return -1;
                    } else {
                        return 0;
                    }
                });
                success(data);
            }, error);
        };
        return lists;
    };

    kt.createListTL = function(screenName, slug) {
        console.log('createListTL()');
        var listTL = createStatuses(api.lists.statuses);
        listTL.addDefaultParam({include_rts: true, owner_screen_name: screenName, slug: slug});
        return listTL;
    };

    kt.util = {
        // should return a new regexp every time
        pat: {
            // except " < > space
            url: function() { return /https?:\/\/([\w\.\_\-]+)(\/?)[\w\-\_\.\~\!\*\'\(\)\;\:\@\&\=\+\$\,\/\?\#\[\]\{\}\|\\\^\`\%]*/g },
            name: function() { return /(^@| @)[\w\_]+/g },
            tag: function() { return /(^#| #)([\w\_]+)/g },
        },

        computeFreq: function(created, count) {
            return (count/((new Date() - new Date(created))/(1000*60*60*24))).toFixed(1);
        },

        buildEntities: function(text) {
            return text.replace(kt.util.pat.url(), '<a href="$&" target="_blank">$&</a>')
                       .replace(kt.util.pat.name(), '<a href="#" class="t_userlink">$&</a>')
                       .replace(kt.util.pat.tag(), '<a href="https://encrypted.google.com/search?q=%23$2&tbs=mbl:1" target="_blank">$&</a>');
        },

        makeEntities: function(text, entities, ex) {
            // NOTE: text is already HTML escaped by Twitter

            if (!entities) {
                return twttr.txt.autoLink(text, {target: '_blank', usernameClass: 't_userlink', usernameUrlBase: '#'});
            }

            var all = [];
            if (entities.urls) {
                all = all.concat(entities.urls);
            }
            if (entities.hashtags) {
                all = all.concat(entities.hashtags);
            }
            if (entities.user_mentions) {
                all = all.concat(entities.user_mentions);
            }
            if (entities.media) {
                all = all.concat(entities.media);
            }
            all.sort(function(x, y) {
                return x.indices[0] - y.indices[0];
            });

            var retStr = '';
            if (all.length == 0) {
                retStr = text;
            } else {
                var last = 0;
                $.each(all, function(k, v) {
                    retStr += text.slice(last, v.indices[0]);
                    if (v.url) { // url or media
                        var realurl = v.expanded_url ? v.expanded_url : v.url;
                        if (!/^https?:\/\//.test(realurl)) {
                            realurl = 'http://' + realurl;
                        }
                        retStr += '<a href="'+realurl+'" target="_blank">'+v.url+'</a>';
                    } else if (v.text) { // hashtag
                        //var ggSearch = 'https://encrypted.google.com/search?q=' + hashtag.text + '&tbs=mbl:1';
                        if (ex) {
                            retStr += '<a href="https://twitter.com/search/%23'+v.text+'" target="_blank">#'+v.text+'</a>';
                        } else {
                            retStr += '<a href="#" class="t_hashtag">#'+v.text+'</a>';
                        }
                    } else if (v.screen_name) { // user_mention
                        if (ex) {
                            retStr += '<a href="https://twitter.com/'+v.screen_name+'" target="_blank">@'+v.screen_name+'</a>';
                        } else {
                            retStr += '<a href="#" class="t_userlink">@'+v.screen_name+'</a>';
                        }
                    }

                    last = v.indices[1];
                });
                retStr += text.slice(last);
            }

            return retStr;
        },

        makeTime: function(time) {
            var d = new Date(time);
            return d.toLocaleTimeString() + ", " + (d.getMonth()+1) + "-" + d.getDate() + ", " + d.getFullYear();
        },
    };


    // exports
    var root = this;
    if (typeof module !== 'undefined'  && module.exports) {
        module.exports = kt;
    } else if (!root.kt) {
        root.kt = kt;
    }

})();

