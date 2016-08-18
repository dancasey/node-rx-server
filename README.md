# node-rx-server

[![Build Status](https://travis-ci.org/dancasey/node-rx-server.svg?branch=wip-connection)](https://travis-ci.org/dancasey/node-rx-server)

:construction: This branch is a WIP! (not on npm; instructions below not updated) :construction:

Wraps Node.js net.Server in an observable with RxJS 5.


## Usage

Install with `npm install --save node-rx-server`.

Exports two functions: `observableFromStream` and `createRxServer`.


### `observableFromStream<T>(stream: Readable): Observable<T>`

- Creates an Observable from a Node.js Stream
- Maps event `data` to `observer.next`, `error` to `observer.error`, and `end` to `observer.complete`
- Observable is multicasted and hot (via `.share()`)


### `createRxServer(options: ListenOptions): Observable<Observable<IRxSocket>>`

- Wraps Node.js net.Server in an Observable
- Each connection will emit a new Observable which yields `{socket, buffer}`
- Observable is multicasted and hot (via `.share()`)


### Working examples

Please see [`src/debug.ts`](https://github.com/dancasey/node-rx-server/blob/master/src/debug.ts) for simple, working examples of both functions.


## Notes

This package uses RxJS 5.0, which (at the time of this writing) is still in beta.

If you are using RxJS 4.0, check out [rx-node](https://github.com/Reactive-Extensions/rx-node).

Feedback or contributions: please feel free to open an issue or PR!


## License

PDDL-1.0 (Public Domain)
