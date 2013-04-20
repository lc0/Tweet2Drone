(function() {

var ut = {};

ut.StringBuilder = function() {
    this.strs_ = [];
};
ut.StringBuilder.prototype.push = function(s) {
    this.strs_.push(s);
};
ut.StringBuilder.prototype.toString = function() {
    return this.strs_.join('');
};
ut.StringBuilder.prototype.clear = function() {
    this.strs_ = [];
};

// dup strings
String.prototype.dup = function(n) {
    var sb = new ut.StringBuilder();
    while (n--) {
        sb.push(this);
    }
    return sb.toString();
};

// paramilized string using {num}
String.prototype.format = function() {
    var args = arguments;
    return this.replace(/\{(\d+)\}/g, function(m, i) {
        return args[i];
    });
};

// paramilized string using {word}
String.prototype.template = function(t) {
    return this.replace(/{(\w+)}/g, function(s, w) {
        return t[w];
    });
}

// multi-line string using function definition + comment
Function.prototype.mlstr = function() {  
    var lines = new String(this);
    return lines.substring(lines.indexOf("/*") + 2, lines.lastIndexOf("*/"));
};

// delete specific values
Array.prototype.clean = function(deleteValue) {
    for (var i = 0; i < this.length; i++) {
        if (this[i] == deleteValue) {         
            this.splice(i, 1);
            i--;
        }
    }
    return this;
};

// class inherit
ut.inherits = function(ctor, superCtor) {
    ctor.super_ = superCtor;
    ctor.prototype = Object.create(superCtor.prototype, {
        constructor: {
            value: ctor,
            enumerable: false,
            writable: true,
            configurable: true
        }
    });
};

// Decodes a URL-encoded string into key/value pairs.
ut.formDecode = function(encoded) {
    var params = encoded.split('&');
    var decoded = {};
    for (var i = 0, param; param = params[i]; i++) {
        var keyval = param.split('=');
        if (keyval.length == 2) {
            var key = ut.fromRfc3986(keyval[0]);
            var val = ut.fromRfc3986(keyval[1]);
            decoded[key] = val;
        }
    }
    return decoded;
};

// Returns the querystring decoded into key/value pairs.
ut.getQueryStringParams = function(s) {
    var urlparts = s.split('?');
    if (urlparts.length == 2) {
        return ut.formDecode(urlparts[1]);
    } else {
        return ut.formDecode(s);
    }
};


// Encodes a value according to the RFC3986 specification.
ut.toRfc3986 = function(val) {
    return encodeURIComponent(val).replace(/\!/g, '%21')
                                  .replace(/\*/g, '%2A')
                                  .replace(/'/g, '%27')
                                  .replace(/\(/g, '%28')
                                  .replace(/\)/g, '%29');
};

// Decodes a string that has been encoded according to RFC3986.
ut.fromRfc3986 = function(val) {
    var tmp = val.replace(/%21/g, '!')
                 .replace(/%2A/g, '*')
                 .replace(/%27/g, "'")
                 .replace(/%28/g, '(')
                 .replace(/%29/g, ')');
    return decodeURIComponent(tmp);
};

// Adds a key/value parameter to the supplied URL.
ut.addURLParam = function(url, key, value) {
    var sep = (url.indexOf('?') >= 0) ? '&' : '?';
    return url + sep + ut.toRfc3986(key) + '=' + ut.toRfc3986(value);
};

var HTML_ENTITIES = {
    '&': '&amp;',
    '>': '&gt;',
    '<': '&lt;',
    '"': '&quot;',
    "'": '&#39;'
};

// HTML escaping
ut.escapeHtml = function(text) {
    return text && text.replace(/[&"'><]/g, function(character) {
        return HTML_ENTITIES[character];
    });
};

ut.unescapeHtml = function(text) {
    return text.replace(/&gt;/g, '>')
               .replace(/&lt;/g, '<')
               .replace(/&quot;/g, '"');
               //.replace(/ /g, '&nbsp;');
};

// Regex escaping
ut.escapeRegex = function(re) {
    return re.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
}

ut.addBlankTarget = function(a) {
    return a.replace(/^<a /, '<a target="_blank" ');
};


// exports
var root = this;
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ut;
} else if (!root.ut) {
    root.ut = ut;
}

})();
