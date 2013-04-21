var active = false;
var failed = false;

var interval;
var handler = "";
var searchInterval;

$(document).ready(function(){

    $('#start').click(function() {
        DRONE.API.init(onDroneConnected, onDroneConnectionFailed);
        clearTimeout(searchInterval);
        DRONE.TweetQueue.clear();

        searchTwitter(handler.replace('#', '%23'), 0);
    });

    // Emergency stop button
    $('#cancel').click(function() {
        active = false;
        DRONE.API.land();
        setTimeout(function(){DRONE.API.shutdown();}, 1000);
        DRONE.TweetQueue.cancel();

        Notifications.notify('error','Killed connection to Drone!');
        clearTimeout(searchInterval);
    });


    // Get handler from storage
    chrome.storage.sync.get('handler', function(result){
        handler = result.handler;
        $('#twtHandler').val(handler);
    });

    $('#saveHandler').click(function() {
        // Get the Twitter handler value
        var handlerVal = $('#twtHandler').val();
        //console.log(handlerVal);
        // Check that it's not empty
        if(!handlerVal && handlerVal === ""){
            Notifications.notify('error','Whoopsie!');
            return;
        }
        // Save it using the Chrome storage API
        chrome.storage.sync.set({'handler': handlerVal}, function(){
            // Notify about success
            Notifications.notify('success','Twitter handle saved successfully!');
        });
    });

});


$('#toggle-settings').on('click', function(e) {
  $('#settings').toggle();
});

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
  DRONE.TweetQueue.main(onDroneConnected, onDroneConnectionFailed);

}

function onDroneConnectionFailed() {
  if(!failed) {
    Notifications.notify('error', "Connection failed - Are you attached to the Drone's Wifi network?");
    failed = true;
  }
}

function extractCommand(msg) {
    //drop the first part of message
    msg = msg.replace(/[^\s]+\s/,"");
    arr = msg.match(/([^\s]+)\s?(.*)/);
    if (arr.length == 1) {
        return {'cmd':arr[1]};
    }
    else {
        return {'cmd':arr[1], 'args': arr[2]};
    }

}

function searchTwitter(query, lastId) {
    var batchId = 0;
    $.ajax({
        url: 'http://search.twitter.com/search.json?q=' + query,
        //dataType: 'jsonp',
        success: function(data) {
            for (var i = 0; i < data['results'].length; i++) {
                //DRONE.TweetQueue.push(data['results'][i]['text']);
                if (data['results'][i]['id'] > batchId) {
                    batchId = parseInt(data['results'][i]['id'], 10);

                }
                if (parseInt(data['results'][i]['id'], 10) > lastId) {
                    console.log('addind some items' + batchId + " > " + lastId);
                    console.log(batchId - lastId);
                    DRONE.TweetQueue.push({'msg': data['results'][i]['text'], 'cmd': extractCommand(data['results'][i]['text']), 'meta': data['results'][i]});
                    console.log(data['results'][i]);
                }
            }
            setTimeout(function() {
                searchInterval = searchTwitter(query, batchId);
            }, 1000);
        }
    });

}
