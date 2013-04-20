var active = false;
var logEl = document.getElementById('log');
var commandLog = document.getElementById('commands');
var message = document.getElementById('message');
var video = document.getElementById('live');
var failed = false;
window.MediaSource = window.MediaSource || window.WebKitMediaSource;
var videoSource = new MediaSource();

var interval;



function clearLog() {
  logEl.textContent = "";
}

function log(msg) {
  logEl.textContent = msg;
//  logEl.scrollTop = 10000000;
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
  console.log('Drone connected');


}

function onDroneConnectionFailed() {
  if(!failed) {
    log("Connectioned failed - Are you attached to the Drone's Wifi network?");
    failed = true;
  }
}


DRONE.API.init(onDroneConnected, onDroneConnectionFailed);


