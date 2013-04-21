var Notifications = (function () {

        var $el = $('#notifications');
        var $droneAction = $('#drone-action');

        var types = {
          error : 'error',
          success : 'success'
        };

        getDetails = function(item) {
            text = "<div>Message from <a href='http://twitter.com/" + item['from_user'] + "'>@";
            text += item['from_user'] + "<img src=" + item['profile_image_url'] + "></a><br /><quote>";
            text += item['text'] + "</quote></div>";

            return text;
        };

        return {
          notify : function(type, msg) {
            $el.text(msg);
            $el.addClass(types[type]);
          },
          droneAction : function(type, msg, item) {
            var message = "<div class='drone-action " + types[type] + "'>" + msg + getDetails(item) + "</div>";
            $droneAction.prepend(message);
          }
        };

})();