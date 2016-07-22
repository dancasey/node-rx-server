/**
 * Test createRxServer
 * Run with `npm test`
 */
import * as rxs from "./rxserver";
import test from "ava";
import * as net from "net";

function runClient() {
  let client = net.connect({port: 1234}, () => {
    client.write(Buffer.from("hello"));
    client.end();
  });
}
setTimeout(runClient, 300);

/** test createRxServer() */
test.cb(function testRxServer(t) {
  t.plan(1);
  rxs.createRxServer({port: 1234})
    .mergeAll()
    .pluck("buffer")
    .map(b => b.toString())
    .subscribe(str => {
      t.is(str, "hello");
      t.end();
    });
});
