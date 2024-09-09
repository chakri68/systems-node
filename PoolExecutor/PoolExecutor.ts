import {
  deferredAction,
  mergeOptionals,
  OptionalObjectOf,
} from "../utils/ts-utils";
import PoolThread from "./PoolThread";

type PoolExecutorOptions = {
  poolSize?: number;
  timeout?: number;
};

type PromiseState<T> = {
  promise: Promise<T>;
  resolve: (data: T) => void;
  reject: (reason: string) => void;
};

type DeferredAction<T> = ReturnType<typeof deferredAction<T>>;

const defaultOptions: OptionalObjectOf<PoolExecutorOptions> = {
  poolSize: 10,
  timeout: 10000,
};

export default class PoolExecutor {
  private options: Required<PoolExecutorOptions>;
  private threadPool: Array<PoolThread>;
  private waitingList: Array<{
    func: (...args: any[]) => any;
    action: DeferredAction<any>;
    args: any[];
  }>;

  constructor(options: PoolExecutorOptions) {
    this.options = mergeOptionals(options, defaultOptions);
    this.threadPool = Array.from(
      { length: this.options.poolSize },
      () => new PoolThread({})
    );
    this.waitingList = [];
  }

  public async execute<T extends Array<any>, U>(
    func: (...args: T) => U,
    ...args: T
  ): Promise<U> {
    const d = deferredAction<U>();
    const task = {
      action: d,
      func,
      args,
    } as (typeof this.waitingList)[number];

    const freeThreadIdx = this.threadPool.findIndex((thread) => !thread.active);
    if (freeThreadIdx == -1) {
      // Didn't find any free thread
      this.waitingList.push(task);
      setTimeout(() => {
        const idx = this.waitingList.findIndex((t) => t === task);
        if (idx == -1) return;
        if (this.waitingList[idx].action.status === "PENDING")
          this.waitingList
            .splice(idx, 1)[0]
            .action.reject("Waited too long for a thread to be assigned");
      }, this.options.timeout);
    } else {
      this.threadPool[freeThreadIdx].execute(
        (res, rej) => {
          if (rej != null) task.action.reject(rej);
          else task.action.resolve(res);
          this.assignFromWaitingList();
        },
        func,
        ...args
      );
    }

    return d.promise;
  }

  private assignFromWaitingList(): void {
    // One of the threads got free
    if (this.waitingList.length === 0) return;
    const task = this.waitingList.pop()!;
    const freeThreadIdx = this.threadPool.findIndex((thread) => !thread.active);
    if (freeThreadIdx == -1) return;
    this.threadPool[freeThreadIdx].execute(task.func, task.func, ...task.args);
  }
}
