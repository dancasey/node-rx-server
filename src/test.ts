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
setTimeout(runClient, 100);

/** test createRxServer() */
test.cb("createRxServer gets connections, data", t => {
  t.plan(1);
  rxs.createRxServer({port: 1234}).subscribe(c => {
    c.subscribe(d => {
      if (d.buffer) {
        t.is(d.buffer.toString(), "hello");
        t.end();
      }
    });
  });
});
