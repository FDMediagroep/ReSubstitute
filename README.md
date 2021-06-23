[![Node.js CI](https://github.com/FDMediagroep/ReSubstitute/actions/workflows/node.js.yml/badge.svg)](https://github.com/FDMediagroep/ReSubstitute/actions/workflows/node.js.yml)
[![Coverage Status](https://coveralls.io/repos/github/FDMediagroep/ReSubstitute/badge.svg?branch=main)](https://coveralls.io/github/FDMediagroep/ReSubstitute?branch=main)
[![CodeQL](https://github.com/FDMediagroep/ReSubstitute/actions/workflows/codeql-analysis.yml/badge.svg)](https://github.com/FDMediagroep/ReSubstitute/actions/workflows/codeql-analysis.yml)
[![Node.js Package](https://github.com/FDMediagroep/ReSubstitute/actions/workflows/npm-publish.yml/badge.svg)](https://github.com/FDMediagroep/ReSubstitute/actions/workflows/npm-publish.yml)
[![Bundle-size minified+gzip](https://img.shields.io/bundlephobia/minzip/@fdmg/resubstitute)](https://bundlephobia.com/result?p=@fdmg/resubstitute)

# ReSubstitute

React State manager drop-in replacement for Microsoft/ReSub

## Usage

1. `npm i -D @fdmg/resubstitute`

### Creating Stores

A `store` extends the `ReSubstitute` class. It is a class in which you can store whatever values you want.
Typically you'll implement `setters` and `getters` to set or get some value from the `store`.
In the setter-function you'll end by calling `this.trigger()`. This will notify all subscribers to the change.

`ThemeStore.ts`

```javascript
import { ReSubstitute } from '@fdmg/resubstitute';

export enum Theme {
    SYSTEM = 'system',
    DARK = 'dark',
    LIGHT = 'light',
}

class ThemeStore extends ReSubstitute {
    private _theme: Theme = Theme.SYSTEM;

    setTheme(theme: Theme) {
        this._theme = theme;
        this.trigger();
    }

    getTheme() {
        return this._theme;
    }
}

export default new ThemeStore();
```

### Subscribe

```javascript
const subscriptionId = ThemeStore.subscribe(() => {
    // Called whenever `this.trigger()` is called within ThemeStore.
});

// Unsubscribe from the ThemeStore
ThemeStore.unsubscribe(subscriptionId);
```

### Trigger blocks

Sometimes you may want to do lot of consecutive updates but you don't necessarily need to notify all subscribers for each of those updates. Then you can use the static function `ReSubstitute.pushTriggerBlock()` to push a block onto the stack. As long as there is a block on the stack, triggers will not cause subscribers to be notified.

```javascript
const resub = new ReSubstitute();
resub.subscribe(() => {
    console.log('triggered');
});

// Add global trigger block to the stack
ReSubstitute.pushTriggerBlock();
// Add global trigger block to the stack
ReSubstitute.pushTriggerBlock();
resub.trigger(); // Nothing happens

ReSubstitute.popTriggerBlock();
resub.trigger(); // Nothing happens

ReSubstitute.popTriggerBlock();
resub.trigger(); // console.log('triggered');
```

#### Bypass trigger blocks

```javascript
const resub = new ReSubstitute();
const resubBypass = new ReSubstitute(0, true);

resub.subscribe(() => {
    console.log('triggered');
});
resubBypass.subscribe(() => {
    console.log('bypass triggered');
});

// Add global trigger block to the stack
ReSubstitute.pushTriggerBlock();
resub.trigger(); // nothing happens
resubBypass.trigger(); // console.log('bypass triggered');
```

### Subscribe to specific keys

```javascript
const resub = new ReSubstitute();
// Subscribe to global events
resub.subscribe(() => {
    console.log('triggered');
});
// Subscribe only to key
resub.subscribe(() => {
    console.log('only triggered by testKey');
}, 'testKey');

resub.trigger(); // console.log('triggered');
resub.trigger('testKey'); // console.log('only triggered by testKey');

// console.log('triggered');
// console.log('only triggered by testKey');
resub.trigger(['testKey', ReSubstitute.Key_All]);
```

### Throttled events

```javascript
const resubThrottled = new ReSubstitute(500);
resubThrottled.subscribe(() => {
    console.log('triggered');
});
resubThrottled.trigger(); // console.log('triggered'); after 500ms
```
