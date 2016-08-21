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

/**
 * @typedef {Object} Connection
 * @property {Socket} socket
 * @property {Buffer} [buffer] `undefined` upon new connection
 */
export interface Connection {
  socket: Socket;
  buffer?: Buffer;
};

/**
 * Wraps Node.js net.Server in a higher-order Observable
 * Each connection will emit a new Observable of `{socket, buffer?}`,
 * where `socket` is the Socket of the connection `buffer` is the Buffer
 *
 * Notes:
 * - `buffer` is not present if it is a new connection (no data received yet)
 * - Inner Observable will `complete` when connection is ended
 * - Unsubscribing all from outer Observable will stop server (it is refcounted via `share`)
 * - Outer Observable error will `error` the Observable (and therefore end it)
 * - Inner Observable error will `error` the Observable (and therefore end it; outer will continue)
 *
 * Therefore, be careful if you `mergeAll()` the outer (server) Observable, as any error or
 * disconnect on an inner (Connection) Observable will shut down the server and all its connections.
 *
 * @param {net.ListenOptions} options Options to pass to net_Server.listen()
 * @returns {Observable<Connection>}
 */
export function createRxServer(options: ListenOptions): Observable<Observable<Connection>> {
  let server = createServer();
  return Observable.create((observer: Observer<Observable<Connection>>) => {
    const connectionHandler = (socket: Socket) => {
      const newConnection: Connection = {socket, buffer: undefined};
      const newData: Observable<Connection> = observableFromStream<Buffer>(socket)
        .map(buffer => ({socket, buffer}));
      const connection: Observable<Connection> = newData.startWith(newConnection);
      observer.next(connection);
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
