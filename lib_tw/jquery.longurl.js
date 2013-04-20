// longurl plugin for kwitty

(function($) {

$.fn.extend({

    longurl: function() {
        var urlRe = /https?:\/\/([\w\.\_\-]+)(\/?)[\w\-\_\.\~\!\*\'\(\)\;\:\@\&\=\+\$\,\/\?\#\[\]\{\}\|\\\^\`\%]*/
        var tcoRe = /https?:\/\/t\.co\/\w+/

        var items = [];
        this.each(function() {
            if (typeof $(this).prop('href') != "undefined") {
                if (urlRe.test($(this).prop('href'))) {
                    items.push({url: $(this).prop('href'), node: $(this)});
                }
            } else {
                $(this).find('a').each(function() {
                    if (typeof $(this).prop('href') != "undefined" && urlRe.test($(this).prop('href'))) {
                        items.push({url: $(this).prop('href'), node: $(this)});
                    }
                });
            }
        });

        $.each(items, function(k, v) {
            var showEx = function(data) {
                var longUrl = data['long-url'];
                if (longUrl) {
                    //if (longUrl == v.url) {
                    //    return;
                    //}
                    var urlparts = urlRe.exec(longUrl);
                    var favicon = 'https://www.google.com/s2/favicons?domain=' + urlparts[1] // domain
                    var html = '<span class="t_expandedurl"><img src="'+favicon+'">&nbsp;<a href="'+longUrl+'" target="_blank">'+urlparts[1]+'/...</a></span>';
                    v.node.parent().after(html);
                }
            };

            if (tcoRe.test(v.node.text()) && v.url.length > 30) { // already official expanded
                showEx({'long-url': v.url});
            } else if (v.url.length <= 30) {
                $.getJSON('http://api.longurl.org/v2/expand?', {url: encodeURI(v.url), format: 'json'}, showEx);
            }
        });
    
        return this;
    }

});

})(jQuery);
