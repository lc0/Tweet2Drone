var active = false;
var logEl = document.getElementById('log');
var commandLog = document.getElementById('commands');
var video = document.getElementById('live');
var failed = false;
window.MediaSource = window.MediaSource || window.WebKitMediaSource;
var videoSource = new MediaSource();




var interval;

$(document).ready(function(){
    console.log($('#twtHandler').text());
    getHandler();

    $('#saveHandler').click(saveHandler);
    
});

    
var Notifications = (function () {

        var el = document.getElementById('notifications');

        var types = {
          error : 'error',
          success : 'success'
        }

        return {
          notify : function(type, msg) {
            el.textContent = msg;
            el.className = types[type]; 
          }
        }

})();



function clearLog() {
  logEl.textContent = "";
}

function log(msg) {
  logEl.textContent = msg;
//  logEl.scrollTop = 10000000;
}


function setHandler() {
    // Get the Twitter handler value
    var handlerVal = $('#twtHandler').value;
    // Check that it's not empty
    if(!handlerVal && handlerVal === ""){
        message('Error: No handler specified');
        return;
    }
    // Save it using the Chrome storage API
    chrome.storage.sync.set({'handler': handlerVal}, function(){
        // Notify about success
        message('Twitter handler saved!');
    })
}

function getHandler() {
    var handlerVal = "";
    chrome.storage.sync.get('handler', function(result){
        hanlderVal = result.handler;
        console.log(handlerVal);
    })
    $('#twtHandler').text(handlerVal)
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
  Notifications.notify('success', 'Drone connected');


}

function onDroneConnectionFailed() {
  if(!failed) {
    Notifications.notify('error', "Connectioned failed - Are you attached to the Drone's Wifi network?");
    failed = true;
  }
}


DRONE.API.init(onDroneConnected, onDroneConnectionFailed);


