import { parentPort } from "node:worker_threads";

parentPort.on("message", (data) => {
  eval(data);
  parentPort.postMessage(RUN());
});
