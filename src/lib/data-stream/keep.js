import {DataStream} from "./";
import {ReReadable} from "rereadable-stream";

/**
 * Keep a buffer of n-chunks for use with {@see DataStream..rewind}
 *
 * @chainable
 * @param {number} count Number of objects or -1 for all the stream
 *
 * @test test/methods/data-stream-keep.js
 */
DataStream.prototype.keep = function keep(count = -1) {
    if (count < 0)
        count = Infinity;

    this.pipe(this.buffer = new ReReadable({ length: count, objectMode: true }));

    return this.tap();
};
