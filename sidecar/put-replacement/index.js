module.exports = Put;

function Put() {
    if (!(this instanceof Put)) return new Put();

    const words = [];
    let len = 0;

    this.put = function (buf) {
        words.push({ type: 'buffer', buffer: buf });
        len += buf.length;
        return this;
    };

    this.word8 = function (x) {
        words.push({ type: 'uint', bytes: 1, endian: 'le', value: x });
        len += 1;
        return this;
    };

    this.word8le = this.word8;
    this.word8be = this.word8;

    this.word16le = function (x) {
        words.push({ type: 'uint', bytes: 2, endian: 'le', value: x });
        len += 2;
        return this;
    };

    this.word16be = function (x) {
        words.push({ type: 'uint', bytes: 2, endian: 'be', value: x });
        len += 2;
        return this;
    };

    this.word32le = function (x) {
        words.push({ type: 'uint', bytes: 4, endian: 'le', value: x });
        len += 4;
        return this;
    };

    this.word32be = function (x) {
        words.push({ type: 'uint', bytes: 4, endian: 'be', value: x });
        len += 4;
        return this;
    };

    this.word64le = function (x) {
        words.push({ type: 'uint64', endian: 'le', value: x });
        len += 8;
        return this;
    };

    this.word64be = function (x) {
        words.push({ type: 'uint64', endian: 'be', value: x });
        len += 8;
        return this;
    };

    this.floatle = function (x) {
        words.push({ type: 'float', endian: 'le', value: x });
        len += 4;
        return this;
    };

    this.pad = function (bytes) {
        words.push({ type: 'uint', bytes: bytes, endian: 'be', value: 0 });
        len += bytes;
        return this;
    };

    this.length = function () {
        return len;
    };

    this.buffer = function () {
        // DEVIATION: Use zero-initialized buffers to avoid leaking host memory.
        const buf = Buffer.alloc(len);
        let offset = 0;

        words.forEach(function (word) {
            if (word.type === 'buffer') {
                word.buffer.copy(buf, offset, 0);
                offset += word.buffer.length;
            } else if (word.type === 'uint') {
                for (let i = 0; i < word.bytes; i++) {
                    const shift = word.endian === 'be' ? (word.bytes - 1 - i) * 8 : i * 8;
                    buf[offset++] = (word.value >> shift) & 0xff;
                }
            } else if (word.type === 'uint64') {
                const big = BigInt.asUintN(64, BigInt(word.value));
                const low = Number(big & BigInt(0xffffffff));
                const high = Number(big >> BigInt(32));
                if (word.endian === 'le') {
                    buf.writeUInt32LE(low, offset);
                    buf.writeUInt32LE(high, offset + 4);
                } else {
                    buf.writeUInt32BE(high, offset);
                    buf.writeUInt32BE(low, offset + 4);
                }
                offset += 8;
            } else if (word.type === 'float') {
                buf.writeFloatLE(word.value, offset);
                offset += 4;
            }
        });

        return buf;
    };

    this.write = function (stream) {
        stream.write(this.buffer());
    };
}
