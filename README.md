# Station API module for Node.js

This is a module to make interacting with the
[station.guide](https://station.guide) API easy.

## Install

```sh
npm install station-node
yarn add station-node
pnpm add station-node
bun add station-node
deno add npm:station-node
```

## Usage

```ts
import Station from 'station-node';

Station.setApiKey('your-api-key');
Station.setDebug(true);

await Station.trackCount('page_view');
await Station.trackCount('signup', 3);
await Station.trackValue('checkout_total', 24.95);
```

Instead of calling `setApiKey`, you can set the `STATION_API_KEY` environment
variable before starting your app:

```sh
STATION_API_KEY=your-api-key node app.js
```

CommonJS users can import the default export:

```js
const Station = require('station-node').default;
```

## API

### `setApiKey(apiKey)`

Sets the Station API key used by subsequent events.

### `setDebug(enabled)`

Enables or disables debug logging. Debug mode is disabled by default. When it is
enabled, request failures are logged with `console.warn`.

### `trackCount(statName, value = 1)`

Sends a count event to Station. Use it for incrementing counters such as page
views, clicks, signups, or other discrete events.

### `trackValue(statName, value)`

Sends a numeric value event to Station. Use it for measurements such as totals,
durations, scores, or other numeric observations.

Network errors do not interrupt your application flow. Enable debug mode if you
want failed event submissions to be logged during development or diagnostics.
