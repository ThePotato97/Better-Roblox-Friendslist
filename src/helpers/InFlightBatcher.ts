type RequestFn<K, V> = (keys: K[]) => Promise<Map<K, V>>;

export class InFlightBatcher<K, V> {
	private inFlight = new Map<K, Promise<V>>();
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
			return this.inFlight.get(key)!;
		}

		this.pending.add(key);

		const promise = new Promise<V>((resolve, reject) => {
			this.inFlight.set(key, promise);
			if (!this.queue) {
				this.queue = () => this.flush();
				setTimeout(this.queue, this.flushDelay);
			}
		});

		this.inFlight.set(key, promise);
		return promise;
	}

	private async flush() {
		this.queue = null;

		const keys = Array.from(this.pending).slice(0, this.maxBatchSize);
		for (const k of keys) {
			this.pending.delete(k);
		}

		let result: Map<K, V>;
		try {
			result = await this.requestFn(keys);
		} catch (err) {
			for (const key of keys) {
				const promise = this.inFlight.get(key);
				(promise as any)?.reject?.(err);
				this.inFlight.delete(key);
			}
			return;
		}

		for (const key of keys) {
			const value = result.get(key);
			if (value !== undefined) {
				const resolve = (this.inFlight.get(key) as any)?.resolve;
				resolve?.(value);
				const subs = this.subscribers.get(key);
				if (subs) {
					for (const cb of subs) {
						cb(value);
					}
				}
			}
			this.inFlight.delete(key);
			this.subscribers.delete(key);
		}
	}
}
