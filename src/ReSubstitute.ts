type KeyOrKeys = string | string[];

type Callback = (keys: KeyOrKeys) => void;

interface Subscription {
    id: number;
    callback: Callback;
    key: string;
}

interface SubscriptionOptions {
    keys: KeyOrKeys;
    throttledUntil: number;
    bypassBlock: boolean;
}

/**
 * Drop-in minimal replacement for microsoft/ReSub.
 * Only implements the Pub/Sub functionality of ReSub.
 * Disregarded the framework specific implementations.
 */
export class ReSubstitute {
    private subscriptions: Subscription[] = [];
    private static pendingCallbacks: Map<Callback, SubscriptionOptions> =
        new Map();
    private static scheduledCallbacks: Map<Callback, number> = new Map();
    private throttleMs = 0;
    private bypassTriggerBlocks = false;
    static Key_All = 'SUBSCRIBE_TO_ALL';
    private static triggerBlockCount = 0;

    constructor(throttleMs = 0, bypassTriggerBlocks = false) {
        this.throttleMs = throttleMs;
        this.bypassTriggerBlocks = bypassTriggerBlocks;
    }

    private static resolveCallbacks() {
        for (const [callback, options] of ReSubstitute.pendingCallbacks) {
            if (ReSubstitute.triggerBlockCount && !options.bypassBlock) {
                // The callback does not bypass the block so we continue to the next callback.
                continue;
            } else if (options.bypassBlock) {
                callback(options.keys);
                ReSubstitute.pendingCallbacks.delete(callback);
            } else if (+new Date() >= options.throttledUntil) {
                callback(options.keys);
                ReSubstitute.pendingCallbacks.delete(callback);
            } else {
                if (this.scheduledCallbacks.has(callback)) {
                    const to = this.scheduledCallbacks.get(callback);
                    if (to) {
                        clearTimeout(to);
                    }
                    this.scheduledCallbacks.delete(callback);
                }

                this.scheduledCallbacks.set(
                    callback,
                    setTimeout(() => {
                        callback(options.keys);
                        ReSubstitute.pendingCallbacks.delete(callback);
                    }, +new Date() - options.throttledUntil) as any
                );
            }
        }
    }

    /**
     * Subscribe to store triggers.
     * @param callback
     * @param key limit only to events for this key
     */
    subscribe(callback: Callback, key: string = ReSubstitute.Key_All): number {
        const id = +new Date() + Math.round(Math.random() * 1000);
        this.subscriptions.push({ id, callback, key });
        return id;
    }

    /**
     * Unsubscribe from the store so future triggers will not trigger the callback anymore.
     * @param subToken
     */
    unsubscribe(subToken: number) {
        this.subscriptions = [
            ...this.subscriptions.filter(
                (subscription) => subscription.id !== subToken
            ),
        ];
    }

    protected _getSubscriptionKeys(): KeyOrKeys[] {
        return this.subscriptions.map((subscription) => {
            return subscription.key;
        });
    }

    protected _isTrackingKey(key: string) {
        const results = this.subscriptions.find(
            (subscription) => subscription.key === key
        );
        return !!results;
    }

    /**
     * Set trigger when conditions are met.
     * @param keys
     * @param subscription
     */
    private setTrigger(keys: string[], subscription: Subscription) {
        if (!ReSubstitute.pendingCallbacks.has(subscription.callback)) {
            ReSubstitute.pendingCallbacks.set(subscription.callback, {
                bypassBlock: this.bypassTriggerBlocks,
                keys,
                throttledUntil: +new Date() + this.throttleMs,
            });
        }
    }

    /**
     * Trigger callbacks of subscriptions.
     * @param keyOrKeys trigger callback if subscription matches given key or keys.
     */
    trigger(keyOrKeys: KeyOrKeys = ReSubstitute.Key_All) {
        if (typeof keyOrKeys === 'string') {
            this.subscriptions.forEach((subscription) => {
                if (subscription.key === keyOrKeys) {
                    const keys = [ReSubstitute.Key_All];
                    if (keys.indexOf(keyOrKeys) === -1) {
                        keys.push(keyOrKeys);
                    }
                    this.setTrigger(keys, subscription);
                }
            });
        } else if (Array.isArray(keyOrKeys)) {
            this.subscriptions.forEach((subscription) => {
                if (keyOrKeys.indexOf(subscription.key) !== -1) {
                    this.setTrigger(
                        [
                            ReSubstitute.Key_All,
                            ...keyOrKeys.filter(
                                (key) => key !== ReSubstitute.Key_All
                            ),
                        ],
                        subscription
                    );
                }
            });
        } else {
            // Notify all listeners
            this.subscriptions.forEach((subscription) => {
                this.setTrigger(keyOrKeys, subscription);
            });
        }

        ReSubstitute.resolveCallbacks();
    }

    /**
     * Block callback triggers globally.
     */
    static pushTriggerBlock() {
        this.triggerBlockCount++;
    }

    /**
     * Pop trigger block. When no trigger blocks are left. The callback triggering will resume.
     * If no trigger blocks are set then this function does nothing.
     */
    static popTriggerBlock() {
        if (this.triggerBlockCount) {
            this.triggerBlockCount--;
            if (this.triggerBlockCount === 0) {
                ReSubstitute.resolveCallbacks();
            }
        }
    }
}
