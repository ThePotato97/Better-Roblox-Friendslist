type RequestFn<K, V> = (keys: K[]) => Promise<Map<K, V>>;

interface Deferred<V> {
  promise: Promise<V>;
  resolve: (value: V) => void;
  reject: (reason?: any) => void;
}

function createDeferred<V>(): Deferred<V> {
  let resolve!: (value: V) => void;
  let reject!: (reason?: any) => void;
  const promise = new Promise<V>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

export class InFlightBatcher<K, V> {
  private inFlight = new Map<K, Deferred<V>>();
  private pending = new Set<K>();
  private subscribers = new Map<K, Set<(value: V) => void>>();
  private queue: (() => void) | null = null;

  constructor(
    private requestFn: RequestFn<K, V>,
    private flushDelay = 10,
    private maxBatchSize = 60,
  ) {}

  fetch(key: K, onResolve?: (value: V) => void): Promise<V> {
    if (onResolve) {
      if (!this.subscribers.has(key)) this.subscribers.set(key, new Set());
      this.subscribers.get(key)!.add(onResolve);
    }

    if (this.inFlight.has(key)) {
      return this.inFlight.get(key)!.promise;
    }

    const deferred = createDeferred<V>();
    this.inFlight.set(key, deferred);
    this.pending.add(key);

    if (!this.queue) {
      this.queue = () => this.flush();
      setTimeout(this.queue, this.flushDelay);
    }

    return deferred.promise;
  }

  private async flush() {
    this.queue = null;

    const keys = Array.from(this.pending).slice(0, this.maxBatchSize);
    for (const k of keys) this.pending.delete(k);

    let result: Map<K, V>;
    try {
      result = await this.requestFn(keys);
    } catch (err) {
      for (const key of keys) {
        const deferred = this.inFlight.get(key);
        deferred?.reject(err);
        this.inFlight.delete(key);
        this.subscribers.delete(key);
      }
      return;
    }

    for (const key of keys) {
      const value = result.get(key);
      const deferred = this.inFlight.get(key);

      if (value !== undefined) {
        deferred?.resolve(value);
        const subs = this.subscribers.get(key);
        if (subs) {
          for (const cb of subs) cb(value);
        }
      } else {
        deferred?.reject(new Error(`Missing value for key ${String(key)}`));
      }

      this.inFlight.delete(key);
      this.subscribers.delete(key);
    }
  }
}
