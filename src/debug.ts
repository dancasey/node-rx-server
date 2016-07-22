import * as rxs from "./rxserver";
import * as net from "net";
import {inspect} from "util";
const insp = (obj: any) => inspect(obj, {colors: true, depth: 2});

/**
 * debug observableFromStream
 *
 */

const socketObserver = {
  next: (data: Buffer) => console.log(data.toString()),
  error: (err: any) => console.error(err),
  complete: () => console.log("observableFromStream complete"),
};

// set up server, make observable of each socket
let s = net.createServer(socket => {
  console.log(`Got connection from ${insp(socket.address())}`);
  rxs.observableFromStream<Buffer>(socket)
    .subscribe(socketObserver);
});
s.listen(1234);

// close server
setTimeout(() => {
  console.log("Closing observableFromStream");
  s.close(() => console.log("observableFromStream closed."));
}, 1000);

// push data to socket
let socketClient: net.Socket = net.connect({port: 1234}, () => {
  socketClient.write(Buffer.from("hello"));
  socketClient.write(Buffer.from("observableFromStream"));
  socketClient.end();
});

/**
 * debug createRxServer
 *
 */

const serverObserver = {
  next: (data: rxs.IRxSocket) =>
  console.log(`createRxServer: ${insp(data.socket.address())}, ${data.buffer.toString()}`),
  error: (err: any) => console.error(err),
  complete: () => console.log("createRxServer complete"),
};

let rxserver = rxs.createRxServer({port: 1235})
  .mergeAll()
  .subscribe(serverObserver);

// close server
setTimeout(() => {
  console.log("Closing createRxServer");
  rxserver.unsubscribe();
}, 1000);

// push data to server
let serverClient: net.Socket = net.connect({port: 1235}, () => {
  serverClient.write(Buffer.from("hello"));
  serverClient.write(Buffer.from("createRxServer"));
  serverClient.end();
});
