# Change Log

### Next

### 1.2.0

* Added a keep-alive HTTP client with a short request timeout;
* Added `captureCount` and `captureValue` fire-and-forget helpers;
* Added named exports and a public `StationClient` TypeScript interface;
* Added an explicit package `exports` map and declaration maps;
* Added one retry for transient network/server failures;
* Added local backoff handling for `429` rate limit responses;
* Removed public endpoint overrides; the package always sends to production Station;
* Removed tracking options from the MVP API surface;

### 1.1.0

* Added `setApiKey` for configuring the client once per process;
* Added `trackValue` for numeric value events;
* Updated `trackCount` to use the configured API key, the `statName` payload field, and a default value of `1`;
* Migrated package management from Yarn to pnpm;
* Replaced deprecated TSLint and Prettier tooling with `oxfmt`;
* Updated install instructions for npm, Yarn, pnpm, Bun, and Deno;
* Updated package dependencies and TypeScript build configuration;
* Updated tests for the current client API;

### 1.0.0

* First stable release for alpha testing;
* Bumped modules;
