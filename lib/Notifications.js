var Notifications = (function () {

        var $el = $('#notifications');
        var $droneAction = $('#drone-action');

        var types = {
          error : 'error',
          success : 'success'
        }

        return {
          notify : function(type, msg) {
            $el.text(msg);
            $el.addClass(types[type]); 
          },
          droneAction : function(type, msg) {
            $droneAction.prepend("<div class='drone-action " + types[type] + "'>" + msg + "</div>");
          }
        }

})();