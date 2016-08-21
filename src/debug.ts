/* tslint:disable:no-console */
import * as rxs from "./rxserver";
import * as net from "net";
import {inspect} from "util";
import {Observable} from "rxjs";
const insp = (obj: any) => inspect(obj, {colors: true, depth: 2});

/**
 * debug observableFromStream
 *
 */

const socketObserver = {
  next: (data: Buffer) => console.log(insp(data.toString())),
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
  socketClient.write(Buffer.from("hello: "));
  socketClient.write(Buffer.from("observableFromStream"));
  socketClient.end();
});

/**
 * debug createRxServer
 *
 */

const connectionObserver = {
  next: (c: rxs.Connection) => {
    if (c.buffer) {
      console.log(`createRxServer received ${insp(c.buffer.toString())} from ${insp(c.socket.address())}`);
    } else {
      console.log(`createRxServer connection from ${insp(c.socket.address())}`);
    }
  },
  error: (err: any) => console.error(err),
  complete: () => console.log("createRxServer connection closed"),
};

const serverObserver = {
  next: (connection: Observable<rxs.Connection>) => connection.subscribe(connectionObserver),
  error: (err: any) => console.error(err),
  complete: () => console.log("createRxServer complete"),
};

let rxserver = rxs.createRxServer({port: 1235})
  .subscribe(serverObserver);

// close server
setTimeout(() => {
  console.log("Closing createRxServer");
  rxserver.unsubscribe();
}, 1000);

// push data to server
let serverClient: net.Socket = net.connect({port: 1235}, () => {
  serverClient.write(Buffer.from("hello: "));
  serverClient.write(Buffer.from("createRxServer"));
  serverClient.end();
});
