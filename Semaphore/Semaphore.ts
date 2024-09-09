export default class Semaphore {
  private intBuffer: Int32Array;

  constructor(private count: number = 1) {
    const buffer = new SharedArrayBuffer(4);
    this.intBuffer = new Int32Array(buffer);
    Atomics.add(this.intBuffer, 0, count);
  }

  public acquire() {
    // Has to decrement the thing in one operation
    // Wait when the number is zero
    Atomics.wait(this.intBuffer, 0, 0);
    Atomics.sub(this.intBuffer, 0, 1);
  }

  public release() {
    // Increment the counter
    Atomics.add(this.intBuffer, 0, 1);
    Atomics.notify(this.intBuffer, 0, 1);
  }
}
