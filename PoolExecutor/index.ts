import PoolExecutor from "./PoolExecutor";

const executor = new PoolExecutor({
  poolSize: 5,
  timeout: 2000,
});
async function run() {
  for (let i = 0; i < 5; i++) {
    const res = executor.execute(
      (a, b) => {
        while (true);
      },
      i,
      i + 1
    );
  }
}

run();
console.log("OMG");
setTimeout(() => {
  console.log("NOT BLOCKED!");
}, 700);
