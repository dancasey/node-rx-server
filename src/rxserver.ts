import {Observable, Observer} from "rxjs";
import {ListenOptions, createServer, Socket} from "net";
import {Readable} from "stream";

/**
 * Create an Observable from a Node.js Stream
 * Assumes relevant events are `data`, `error`, and `end`.
 * @param {stream.Readable} stream Stream to use
 * @returns {Observable<T>}
 */
export function observableFromStream<T>(stream: Readable): Observable<T> {
  // helpful hints: https://github.com/Reactive-Extensions/rx-node/blob/master/index.js#L52
  stream.pause();
  return Observable.create(function (observer: Observer<T>) {
    const dataHandler = (data: T) => observer.next(data);
    const errorHandler = (err: any) => observer.error(err);
    const endHandler = () => observer.complete();
    stream.on("data", dataHandler);
    stream.on("error", errorHandler);
    stream.on("end", endHandler);
    stream.resume();
    return function() {
      stream.removeListener("data", dataHandler);
      stream.removeListener("error", errorHandler);
      stream.removeListener("end", endHandler);
    };
  }).share();
}

export interface Connection {
  socket: Socket;
  data: Observable<Buffer>;
};

/**
 * Wraps Node.js net.Server in a higher-order Observable
 * Each connection will emit a new Observable of `{socket, data}`,
 * where `socket` is the Socket of the connection `data` is an Observable of the Buffer
 * @param {net.ListenOptions} options Options to pass to net_Server.listen()
 * @returns {Observable<Connection>}
 */
export function createRxServer(options: ListenOptions): Observable<Connection> {
  let server = createServer();
  return Observable.create((observer: Observer<Connection>) => {
    const connectionHandler = (socket: Socket) => {
      const data = observableFromStream<Buffer>(socket);
      observer.next({socket, data});
    };
    const errorHandler = (err: any) => observer.error(err);
    const endHandler = () => observer.complete();
    server.on("connection", connectionHandler);
    server.on("error", errorHandler);
    server.on("close", endHandler);
    server.listen(options);
    return function() {
      server.close();
      server.removeListener("connection", connectionHandler);
      server.removeListener("error", errorHandler);
      server.removeListener("close", endHandler);
    };
  }).share();
}
