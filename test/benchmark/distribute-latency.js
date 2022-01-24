const {DataStream} = require("../..");

const defer = (ms) => ms
    ? new Promise(res => setTimeout(res, ms))
    : new Promise(res => process.nextTick(res));

DataStream
    .from(async function *() {
        let x = 0;
        while (x++ < 10000) {
            await defer(100/x);
            yield ({
                x, i: process.hrtime()
            });
        }
    })
    .separate(({x}) => "____" + (x % 24))
    .cluster(stream => {
        const hrtime = (last) => {
            const cur = process.hrtime();
            return (cur[0] - last[0]) * 1e6 + (cur[1] - last[1]) / 1e3;
        };

        return stream
            .map(({x, i}) => ({x, init: hrtime(i), ts: process.hrtime()}))
            .map(({x, init, ts}) => ({x, init, latency: hrtime(ts)}))
        ;
    })
    .mux()
    .filter(({x}) => x > 1000)
    .reduce(([initSum, sum, cnt], {latency, init}) => ([
        initSum + init,
        sum + latency,
        cnt + 1
    ]), [0,0,0])
    .then(([init, sum, cnt]) => console.log(`init latency = ${init/cnt}µs, step2step latency = ${sum/cnt}µs`));
