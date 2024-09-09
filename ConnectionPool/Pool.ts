import {
  assertNonNull,
  deferredAction,
  mergeOptionals,
  OptionalObjectOf,
} from "../utils/ts-utils";
import Connection from "./Connection";

type PoolOptions = {
  poolSize?: number;
  timeout?: number;
};

const defaultOptions: OptionalObjectOf<PoolOptions> = {
  poolSize: 10,
  timeout: 10000,
};

type PooledConnection = {
  connection: Connection;
  isFree: boolean;
};

export default class Pool {
  private options: Required<PoolOptions>;
  private connections: Array<PooledConnection>;
  private waitingPromises: Array<(value: Connection) => void>;

  constructor(options: PoolOptions) {
    this.options = mergeOptionals(options, defaultOptions);
    this.connections = Array.from(
      { length: this.options.poolSize },
      (_, idx) =>
        ({
          connection: new Connection({
            onStale: () => {
              this.disconnect(idx.toString());
            },
            id: idx.toString(),
          }),
          isFree: true,
        } as PooledConnection)
    );
    this.waitingPromises = [];
  }

  public async connect(): Promise<Connection> {
    const idx = this.connections.findIndex((pc) => pc.isFree === true);
    if (idx === -1) {
      const { promise, reject, resolve, status } = deferredAction<Connection>();
      this.waitingPromises.push(resolve);
      setTimeout(() => {
        if (status === "PENDING") {
          reject("Timeout while trying to get a connection!");
          const idx = this.waitingPromises.findIndex((r) => r === resolve);
          if (idx != -1) this.waitingPromises.splice(idx, 1);
        }
      }, this.options.timeout);
      return await promise;
    } else {
      this.connections[idx].isFree = false;
      return this.connections[idx].connection;
    }
  }

  public disconnect(connectionId: string) {
    const idx = this.connections.findIndex(
      (pc) => pc.connection.id === connectionId
    );
    if (idx === -1) throw new Error("Invalid connection");
    this.connections[idx].isFree = true;
    if (this.waitingPromises.length > 0) {
      const resolve = this.waitingPromises.shift();
      if (!assertNonNull(resolve)) throw new Error("Assertion error");
      resolve(this.connections[idx].connection);
      this.connections[idx].isFree = false;
    }
  }
}
