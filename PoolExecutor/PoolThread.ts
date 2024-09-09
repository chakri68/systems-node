import { mergeOptionals, OptionalObjectOf } from "../utils/ts-utils";
import { Worker, isMainThread } from "worker_threads";

type PoolThreadState = {
  active: boolean;
  lifePromise: {
    promise: Promise<void>;
    resolve: () => void;
    reject: (err: string) => void;
  };
  staleTimeout: ReturnType<typeof setTimeout> | null;
  currentTask: {
    callback: (res: any, rej: any) => void;
    func: (...args: any) => any;
    args: any[];
  } | null;
  worker: Worker;
};

type PoolThreadOptions = {
  timeout?: number;
};

const defaultOptions: OptionalObjectOf<PoolThreadOptions> = {
  timeout: 10000,
};

export default class PoolThread {
  private state: PoolThreadState;
  private options: Required<PoolThreadOptions>;

  constructor(options: PoolThreadOptions) {
    this.state = {
      active: false,
      lifePromise: this.generateLifePromise(),
      staleTimeout: null,
      currentTask: null,
      worker: new Worker("./PoolExecutor/TemplateWorker.js"),
    };
    this.options = mergeOptionals(options, defaultOptions);
    this.state.worker.on("message", this.onMessageFromThread.bind(this));
  }

  public execute<T extends Array<any>, U>(
    callback: (res: U | null, rej: string | null) => void,
    func: (...args: T) => U,
    ...args: T
  ) {
    this.state.currentTask = {
      callback,
      func,
      args: [...args],
    };
    this.markActive();
  }

  public get active(): boolean {
    return this.state.active;
  }

  private markActive() {
    this.state.active = true;
    // this.state.staleTimeout = setTimeout(() => {
    //   const currentTask = this.state.currentTask;
    //   if (!currentTask) throw new Error("No task to execute!");
    //   // this.terminateWorker();
    //   currentTask.callback(null, "Timeout running the task");
    //   this.markInactive();
    // }, this.options.timeout);
    this.startWorker();
  }

  private markInactive() {
    this.state.active = false;
    this.state.currentTask = null;
    this.state.staleTimeout = null;
  }

  private startWorker() {
    const currentTask = this.state.currentTask;
    if (!currentTask) throw new Error("No task to execute!");
    this.state.worker.postMessage(
      `function RUN() {return (${currentTask.func.toString()})(${currentTask.args.join(
        ", "
      )})}`
    );
  }

  private endWorker() {
    this.state.currentTask = null;
  }

  private onMessageFromThread(data) {
    const currentTask = this.state.currentTask;
    if (!currentTask) throw new Error("Demon Spawn");
    currentTask.callback(data, null);
    this.markInactive();
  }

  private onErrorFromThread(data) {
    const currentTask = this.state.currentTask;
    if (!currentTask) throw new Error("Demon Spawn");
    currentTask.callback(null, data);
  }

  private generateLifePromise(): PoolThreadState["lifePromise"] {
    let resolve!: PoolThreadState["lifePromise"]["resolve"],
      reject!: PoolThreadState["lifePromise"]["reject"];
    const promise = new Promise<void>((res, rej) => {
      resolve = () => {
        res();
      };
      reject = (err) => {
        reject(err);
      };
    });

    return { promise, reject, resolve };
  }
}
