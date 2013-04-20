
var HEADER_SIZE = 68,
    read_more = -1,
    cur_buffer = null; 

function parseMoreData(moreBuffer){
    var payload = null;
    if (cur_buffer) {
        var new_buf = new Uint8Array(cur_buffer.byteLength + moreBuffer.byteLength);
        new_buf.set(new Uint8Array(cur_buffer));
        new_buf.set(new Uint8Array(moreBuffer), cur_buffer.byteLength);
        cur_buffer = new_buf.buffer;
    } else {
        cur_buffer = moreBuffer;
    }

    //console.log(cur_buffer.byteLength);

    if (read_more > 0) {
        if (cur_buffer.byteLength <= read_more) {
            return;
        }
        payload = cur_buffer.slice(0, read_more);
        cur_buffer = cur_buffer.slice(read_more);
        read_more = 0;
        //console.log("Out 1");
        return payload;
    }

    var header_data = parseHeader(cur_buffer);
    //console.log(header_data);
    if (!header_data.header_size) {
        return;
    }

    if (!header_data.payload_size) {
        cur_buffer = null;
        return;
    }

    var package_length = header_data.header_size + header_data.payload_size;
    if (package_length <= cur_buffer.byteLength) {
        console.log("huuuuuuuge");
        payload = cur_buffer.slice(header_data.header_size, package_length);
        cur_buffer = cur_buffer.slice(package_length);
        //console.log("Out 2");
        return payload;
    }

    payload = cur_buffer.slice(header_data.header_size);
    read_more = header_data.payload_size;
    cur_buffer = payload;
    //console.log(payload);
    return;
}

function parseHeader(buffer){
    var total = {"header_size": 0, "payload_size": buffer.byteLength};
    if (buffer.byteLength < HEADER_SIZE) return total;

    var dv = new DataView(buffer);
    var cur_pos = 0;
    var signature = String.fromCharCode.apply(null, new Uint8Array(buffer, cur_pos, 4));
    cur_pos += 4;

    //console.log(signature);
    if (signature != "PaVE") {
        throw "Not gonna happen!";
    }

    cur_pos += 2; // skip fields: version, video_codec

    var header_size = dv.getUint16(cur_pos, true);
    cur_pos += 2;

    var payload_size = dv.getUint32(cur_pos, true);

    return {"header_size": header_size, "payload_size": payload_size};
}
 
 /*   

function PaVEParser() {

    EventEmitter.call(this);
    this.writable = true;
    this.readable = true;

    this._parser = new Stream();
    this._state  = 'header';
    this._toRead = undefined;
    // TODO: search forward in buffer to last I-Frame
    this._frame_type = undefined;
}

PaVEParser.HEADER_SIZE = 68; // 64 in older firmwares, but doesn't matter.

PaVEParser.prototype.write = function (buffer) {
    var parser = this._parser
      , signature
      , header_size
      , readable
      ;

    parser.write(buffer);

    while (true) {
        switch (this._state) {
        case 'header':
            if (parser.bytesAhead() < PaVEParser.HEADER_SIZE) {
                return true;
            }
            signature = parser.ascii(4);

            if (signature !== 'PaVE') {
                // TODO: wait/look for next PaVE frame
                this.emit('error', new Error(
                    'Invalid signature: ' + JSON.stringify(signature)
                ));
                return;
            }

            parser.skip(2);
            header_size = parser.uint16LE();
            // payload_size
            this._toRead = parser.uint32LE();
            // skip 18 bytes::
            // encoded_stream_width 2
            // encoded_stream_height 2
            // display_width 2
            // display_height 2
            // frame_number 4
            // timestamp 4
            // total_chunks 1
            // chunk_index 1
            parser.skip(18);
            this._frame_type = parser.uint8();

            // bytes consumed so far: 4 + 2 + 2 + 4 + 18 + 1 = 31. Skip ahead.
            parser.skip(header_size - 31);

            this._state = 'payload';
            break;

        case 'payload':
            readable = parser.bytesAhead();
            if (readable < this._toRead) {
                return true;
            }

            // also skip first NAL-Unit boundary: (4)
            parser.skip(4);
            this._toRead -= 4;
            this.sendData(parser.buffer(this._toRead), this._frame_type);
            this._toRead = undefined;
            this._state = 'header';
            break;
        }
    }
};


PaVEParser.prototype.sendData = function (data, frametype) {
    var lastBegin = 0, i, l;
    if (frametype === 1) {
        // I-Frame, split more
        // Todo: optimize.
        for (i = 0, l = data.length - 4; i < l; i++) {
            if (
                data[i] === 0 &&
                data[i + 1] === 0 &&
                data[i + 2] === 0 &&
                data[i + 3] === 1
            ) {
                if (lastBegin < i) {
                    this.emit('data', data.slice(lastBegin, i));
                    lastBegin = i + 4;
                    i += 4;
                }
            }
        }
        this.emit('data', data.slice(lastBegin));
    } else {
        this.emit('data', data);
    }
};

PaVEParser.prototype.end = function () {
    // nothing to do, just here so pipe() does not complain
};

*/