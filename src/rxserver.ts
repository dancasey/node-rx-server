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

export interface IRxSocket {
  socket: Socket;
  buffer: Buffer;
};

/**
 * Wraps Node.js net.Server in a higher-order Observable
 * Each connection will emit a new Observable which yields `{socket, buffer}`
 * @param {net.ListenOptions} options Options to pass to net_Server.listen()
 * @returns {Observable<IRxSocket>}
 */
export function createRxServer(options: ListenOptions): Observable<Observable<IRxSocket>> {
  let s = createServer();
  return Observable.create(function (observer: Observer<Observable<IRxSocket>>) {
    const connectionHandler = (socket: Socket) => {
      let os: Observable<IRxSocket>;
      os = observableFromStream<Buffer>(socket).map(obsBuf => {
        return {socket, buffer: obsBuf};
      });
      observer.next(os);
    };
    const errorHandler = (err: any) => observer.error(err);
    const endHandler = () => observer.complete();
    s.on("connection", connectionHandler);
    s.on("error", errorHandler);
    s.on("close", endHandler);
    s.listen(options);
    return function() {
      s.close();
      s.removeListener("connection", connectionHandler);
      s.removeListener("error", errorHandler);
      s.removeListener("close", endHandler);
    };
  }).share();
}
