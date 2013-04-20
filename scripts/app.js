var active = false;
var logEl = document.getElementById('log');
var commandLog = document.getElementById('commands');
var video = document.getElementById('live');
var failed = false;
window.MediaSource = window.MediaSource || window.WebKitMediaSource;
var videoSource = new MediaSource();

var interval;
var handler = "";

$(document).ready(function(){
    
    // Get handler from storage
    chrome.storage.sync.get('handler', function(result){
        handler = result.handler;
        $('#twtHandler').val(handler);
    });

    $('#saveHandler').click(function() {
        // Get the Twitter handler value
        var handlerVal = $('#twtHandler').val();
        console.log(handlerVal);
        // Check that it's not empty
        if(!handlerVal && handlerVal === ""){
            console.log("error");
            //message('Error: No handler specified');
            return;
        }
        // Save it using the Chrome storage API
        chrome.storage.sync.set({'handler': handlerVal}, function(){
            console.log("success");
            // Notify about success
            //message('Twitter handler saved!');
        })
    });
    
});


$('#toggle-settings').on('click', function(e) {

  $('#settings').toggle();


})

    
var Notifications = (function () {

        var $el = $('#notifications');

        var types = {
          error : 'error',
          success : 'success'
        }

        return {
          notify : function(type, msg) {
            $el.text(msg);
            $el.addClass(types[type]); 
          }
        }

})();



function clearLog() {
  //
}

function log(msg) {
  console.log(msg);
//  logEl.scrollTop = 10000000;
}

function message(msg){
    var msgBox = $('#message');
    msgBox.text(msg);
    msgBox.fadeOut(800);
}

function displayNavData(navdata) {
  var
    battery_state = document.getElementById("battery_state"),
    perc,
    max_altitude = document.getElementById("altitude").offsetHeight - 100,
    altitude_img = document.getElementById("drone_alt"),
    height,
    roll, tilt, rotation, style,
    orientation = document.getElementById("orientation_drone");

  if (navdata.options) {
    perc = navdata.options.batteryPercentage;
    height = Math.floor(Math.min(navdata.options.altitude / 3000, 1) * max_altitude);
    altitude_img.style.bottom = height + "px";
    battery_state.style.height = perc + "px";
    if (perc < 10) {
      battery_state.innerHTML = "";
      battery_state.style.backgroundColor = "red";
    } else {
      battery_state.innerHTML = perc + "%";
      battery_state.style.backgroundColor = "green";
    }
    tilt = Math.floor(navdata.options.theta / 1000);
    roll = Math.floor(navdata.options.phi / 1000);
    rotation = Math.floor(navdata.options.psi / 1000);
    style = "rotateX(" + tilt + "deg) rotateY(" + roll + "deg) rotateZ(" + rotation + "deg)";
    orientation.style.webkitTransform = style;
  }
}

function onDroneConnected() {
  Notifications.notify('success', 'Drone connected! Have fun!');


}

function onDroneConnectionFailed() {
  if(!failed) {
    Notifications.notify('error', "Connection failed - Are you attached to the Drone's Wifi network?");
    failed = true;
  }
}


DRONE.API.init(onDroneConnected, onDroneConnectionFailed);


