var tweetsHtml;

window.onload = function() {
    if (tweetsHtml) {
        document.getElementById("tweets").innerHTML = tweetsHtml;
    } else {
        console.debug('tweets not ready, wait 1s');
        setTimeout(window.onload, 1000);
    }
};

chrome.extension.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.msg == 'export') {
        tweetsHtml = request.html;
        sendResponse({});
    }
});


