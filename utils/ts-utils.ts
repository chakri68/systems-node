export type OptionalPropertiesOf<T extends Object> = {
  [K in keyof T]: T[K] extends Record<K, T[K]> ? never : K;
}[keyof T];

export type OptionalObjectOf<T extends Object> = {
  [k in OptionalPropertiesOf<T>]: Exclude<T[k], undefined>;
};

export function mergeOptionals<T extends Object>(
  object: T,
  defaultOptions: OptionalObjectOf<T>
): Required<T> {
  return { ...defaultOptions, ...object } as Required<T>;
}

export function assertNonNull<T>(value: T): value is NonNullable<T> {
  return value !== undefined && value !== null;
}

export function deferredAction<T>(): {
  resolve: (value: T) => void;
  reject: (reason?: any) => void;
  promise: Promise<T>;
  status: "PENDING" | "RESOLVED" | "REJECTED";
} {
  let status: "PENDING" | "RESOLVED" | "REJECTED" = "PENDING";

  let resolve!: (value: T) => void;
  let reject!: (reason?: any) => void;

  const promise = new Promise<T>((res, rej) => {
    resolve = (value: T) => {
      status = "RESOLVED";
      res(value);
    };
    reject = (reason?: any) => {
      status = "REJECTED";
      rej(reason);
    };
  });

  // Return the promise and its associated resolve/reject methods
  return { resolve, reject, promise, status };
}
