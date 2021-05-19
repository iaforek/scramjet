#!/usr/bin/env node
// module: data-stream, method: filter

const {DataStream, StringStream} = require("../../");
exports.log = process.env.TEST_VERBOSE === 1 ? console.log.bind(console) : () => 0;

exports.test = {
    async simple(test) {
        test.expect(2);
        const stream = DataStream.fromArray([1,2,3,4])
            .map(a => ({a}))
            .toJSONArray()
        ;

        test.ok(stream instanceof StringStream, "Returns a StringStream");

        const stringRep = (await stream.toArray()).join("");
        const arr = JSON.parse(stringRep);

        test.deepEqual([{"a":1},{"a":2},{"a":3},{"a":4}], arr, "Returns the full JSON array");
        test.done();
    },
    async withNoData(test) {
        test.expect(2);
        const stream = DataStream.fromArray([])
            .map(a => ({a}))
            .toJSONArray(["{\"abc\":[\n","\n]}"])
        ;

        test.ok(stream instanceof StringStream, "Returns a StringStream");

        const stringRep = (await stream.toArray()).join("");
        const arr = JSON.parse(stringRep);

        test.deepEqual({abc:[]}, arr, "Returns the full JSON array");
        test.done();
    },
    async withData(test) {
        test.expect(2);
        const stream = DataStream.fromArray([1,2,3,4])
            .map(a => ({a}))
            .toJSONArray(["{\"abc\":[\n","\n]}"])
        ;

        test.ok(stream instanceof StringStream, "Returns a StringStream");

        const stringRep = (await stream.toArray()).join("");
        const arr = JSON.parse(stringRep);

        test.deepEqual({abc:[{"a":1},{"a":2},{"a":3},{"a":4}]}, arr, "Returns the full JSON array");
        test.done();
    }
};
