import Pool from "./ConnectionPool/Pool";

const pool = new Pool({
  poolSize: 5,
  timeout: 10000,
});

let time = 7000;
const clients = Array.from({ length: 10 }, (_, idx) => async () => {
  idx++;
  try {
    console.log(`Thread ${idx} waiting for connection`);
    const conn = await pool.connect();
    console.log(`Thread ${idx} obtained connection ${conn.id}`);
    setTimeout(() => {
      console.log(`Thread ${idx} leaving connection ${conn.id}`);
      pool.disconnect(conn.id);
    }, time + idx * 1000);
  } catch (e) {
    console.log({ e });
  }
});

for (const fun of clients) fun();
