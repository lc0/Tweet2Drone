var saveValue = function(elem, val) {
    if (val == undefined) {
        val = $(elem).val();
    }
    console.debug('v:', val, $(elem).val(), 't:', $(elem).text());
    var item = $(elem).prop('id').replace(/-/g, '.');
    config.saveValue(item, val);
    // notify main page
    chrome.extension.sendMessage({msg: 'update', item: item, value: val}, function(response) {
        if (response) {
            console.log('update value ok');
        } else {
            console.error('update value failed');
        }
    });
};

var loadValue = function(v, id) {
    if (typeof(v) == 'boolean') { // checkbox
        $('#'+id).prop('checked', v)
    } else if (/-imageFileName$/.test(id)) {
        $('#'+id).text(v)
    } else { // others
        $('#'+id).val(v)
    }
};

var loadValues = function(obj, id) {
    $.each(obj, function(k, v) {
        if (typeof(v) == 'object') {
            loadValues(v, id+k+'-') 
        } else {
            loadValue(v, id+k);
        } 
    })
};

var insertTownsByCountry = function(id, save) {
    $('#basics-trends-town').html('<option value="0">--</option>');
    if (save) {
        $('#basics-trends-town').change();
    }
    if (id == '1') { // worldwide
        return;
    }

    woeid.towns.forEach(function(item, i) {
        if (Number(item.parentid) == id) {
            $('#basics-trends-town').append('<option value="'+item.woeid+'">'+item.name+'</option>');
        }
    });
};

var loadConfig = function() {
    loadValues(config.get(), '');
    // after load
    insertTownsByCountry(config.get().basics.trends.country, false);
    loadValue(config.get().basics.trends.town, 'basics-trends-town');
};

// init page
$(function() {
    $('#navbar li').click(function() {
        $(this).addClass('navbar-item-selected');
        $(this).siblings().removeClass('navbar-item-selected');
        var pageID = '#' + $(this).prop('id').replace('Nav', '');
        $(pageID).siblings().hide();
        $(pageID).fadeIn();
        $('#main-content').height($(pageID).height());
    });

    $('#reset').click(function() {
        localStorage.clear();
        config.reset();
        loadConfig();

        chrome.extension.sendMessage({msg: 'reset'}, function(response) {
            if (response) {
                console.log('reset ok');
            } else {
                console.error('reset failed');
            }
        });
    });

    woeid.countries.forEach(function(item, i) {
        $('#basics-trends-country').append('<option value="'+item.woeid+'">'+item.name+'</option>');
    });


    // select
    $('#refreshSection select, #themeSection select, #displaySection select, #trendsSection select').change(function() {
        saveValue(this);
    });

    // change towns and should be saved/notified after country
    $('#basics-trends-country').change(function() {
        insertTownsByCountry(this.value, true);
    });

    // input
    $('#basics-api-address').change(function() {
        var addr = $(this).val();
        if (!/^http[s]?:\/\//.test(addr)) {
            addr = 'http://' + addr;
        }
        $(this).val(encodeURI(addr));
        saveValue(this);
    });

    $('#bgImageData').change(function() {
        var file = this.files[0];
        if (!file) {
            return;
        }
        if(!/image\/\w+/.test(file.type)){
            alert('Not image file!');
            return;
        }

        $('#gui-background-imageFileName').text(file.name);
        saveValue('#gui-background-imageFileName', file.name);

        var reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = function(e) {
            config.saveToLS('bgImgData', this.result);
            chrome.extension.sendMessage({msg: 'update', item: 'bgImgData', value: this.result}, function(response) {
                if (response) {
                    console.log('update bgImgData ok');
                } else {
                    console.error('update bgImgData failed');
                }
            });
        };
    });

    $('#bgImageBrowse').click(function() {
        $('#bgImageData').click();
    });

    // checkbox
    $('#basics-refresh-autoload, #basics-refresh-disreadingload, #gui-display-compact, #gui-display-expandurl, #gui-display-rich').change(function() {
        saveValue(this, $(this).prop('checked'));
    });

    config.init();
    loadConfig(); 
});
