<div align="center">

# nestjs-puppeteer
Puppeteer module for Nest framework (node.js)

[![npm](https://img.shields.io/npm/v/nestjs-puppeteer?logo=npm)](https://npmjs.com/package/nestjs-puppeteer)
[![NestJS Peer Dep](https://img.shields.io/npm/dependency-version/nestjs-puppeteer/peer/@nestjs/core?logo=nestjs&logoColor=E42844)](https://www.npmjs.com/package/@nestjs/core)
[![Puppeteer Peer Dep](https://img.shields.io/npm/dependency-version/nestjs-puppeteer/peer/puppeteer?logo=puppeteer&logoColor=%23fff)](https://www.npmjs.com/package/puppeteer)  
![npm](https://img.shields.io/npm/dm/nestjs-puppeteer)
[![License](https://img.shields.io/github/license/oblakstudio/nestjs-puppeteer)](https://github.com/oblakstudio/nestjs-puppeteer/blob/master/LICENSE)
![Codecov](https://img.shields.io/codecov/c/github/oblakstudio/nestjs-puppeteer?logo=codecov&color=%23F01F7A)
[![semantic-release: angular](https://img.shields.io/badge/semantic--release-angular-e10079?logo=semantic-release)](https://github.com/semantic-release/semantic-release)


</div>

Headless Chrome provider for [NestJS](https://nestjs.com/), enabling easy integration of Puppeteer into your application.

> [!IMPORTANT]
> Since puppeteer v22, `headless: true` selects [Chrome's _"new headless"_ mode](https://developer.chrome.com/docs/chromium/new-headless) — the legacy `headless: 'new'` literal has been removed. Pass `headless: 'shell'` to opt into the separate `chrome-headless-shell` binary if you need the legacy behavior.

> [!NOTE]
> `puppeteer-extra` integration was removed in v3.0.0. The upstream project has been inactive since 2023 and its stealth plugins target the legacy headless mode that puppeteer v22 dropped as the default. Pin to the [2.x branch](https://github.com/oblakstudio/nestjs-puppeteer/tree/2.x) if you still need the plugin path, or migrate to [rebrowser-puppeteer](https://github.com/rebrowser/rebrowser-puppeteer) for active stealth support.

## Installation

To begin using it, we first install the required dependencies.

```sh
$ npm install --save nestjs-puppeteer puppeteer
```
## Usage

Once the installation process is complete we can import the ``PuppeteerModule`` into the root ``AppModule``

```ts
import { Module } from '@nestjs/common';
import { PuppeteerModule } from 'nestjs-puppeteer';

@Module({
  imports: [
    PuppeteerModule.forRoot({ headless: true }),
  ],
})
export class AppModule {}
```

The ``forRoot()`` method supports all the configuration properties exposed by the ``LaunchOptions`` object used by the ``puppeteer.launch()`` method. There are several extra configuration properties described below.


| Property  | Description |
| ------------- | ------------- |
| ``name``  | Browser name  |
| ``isGlobal`` | Should the module be registered in the global context |
| ``headless`` | `true` (default, runs in [new headless](https://developer.chrome.com/docs/chromium/new-headless) mode), `false` for headed, or `'shell'` to opt into the legacy `chrome-headless-shell` binary  |

Once this is done, the Puppeteer ``Browser`` instance will be available for injection in any of the providers in the application.

```ts
import { Browser } from 'puppeteer';

@Module({
  imports: [
    PuppeteerModule.forRoot({ headless: true }),
  ],
})
export class AppModule {
  constructor(@InjectBrowser() private readonly browser: Browser) {}
}
```

If you used the name option when registering the module, you can inject the browser by name.

### ForFeature

After module registration, we can register specific pages for injection.

```ts
import { Module } from '@nestjs/common';
import { PuppeteerModule } from 'nestjs-puppeteer';

@Module({
  imports: [
    PuppeteerModule.forRoot({ headless: true }),
    PuppeteerModule.forFeature(['page1', 'page2']),
  ],
})
export class AppModule {}
```

Once this is done the ``Page`` instance will be available for injection in any of the providers in the module.

```ts
import { Page } from 'puppeteer';

@Module({
  imports: [
    PuppeteerModule.forRoot({ headless: true }),
    PuppeteerModule.forFeature(['page1', 'page2']),
  ],
})
export class AppModule {
  constructor(@InjectPage('page1') private readonly page1: Page) {}
}
```


### Async configuration

You may want to pass your repository module options asynchronously instead of statically. In this case, use the ``forRootAsync()`` method, which provides several ways to deal with async configuration.

One approach is to use a factory function:

```ts
PuppeteerModule.forRootAsync({
  useFactory: () => ({
    headless: false,
  }),
})
```

Our factory behaves like any other asynchronous provider (e.g., it can be ``async`` and it's able to inject dependencies through ``inject``).

```ts
PuppeteerModule.forRootAsync({
  imports: [ConfigModule],
  useFactory: async (configService: ConfigService) => ({
    headless: configService.isHeadless,
  }),
  inject: [ConfigService],
})
```

Alternatively you can use the ``useClass`` syntax:

```ts
PuppeteerModule.forRootAsync({
  useClass: PuppeteerConfigService,
})
```
The construction above will instantiate ``PuppeteerConfigService`` inside ``PuppeteerModule`` and use it to provide an options object by calling ``createPuppeteerOptions()``.  
Note that this means that the ``PuppeteerConfigService`` has to implement the ``PuppeteerOptionsFactory`` interface, as shown below:

```ts
@Injectable()
class PuppeteerConfigService implements PuppeteerOptionsFactory {
  createPuppeteerOptions(): PuppeteerModuleOptions {
    return {
      headless: true,
    };
  }
}
```

### Using rebrowser-puppeteer

`PuppeteerModule` accepts a `launcher` option for swapping the bundled `puppeteer` for a drop-in alternative. The primary supported alternative is [`rebrowser-puppeteer`](https://github.com/rebrowser/rebrowser-patches), which applies anti-detection patches on top of upstream puppeteer.

```sh
$ npm install --save rebrowser-puppeteer
```

```ts
import puppeteer from 'rebrowser-puppeteer';
import { PuppeteerModule } from 'nestjs-puppeteer';

@Module({
  imports: [
    PuppeteerModule.forRoot({ launcher: puppeteer, headless: true }),
  ],
})
export class AppModule {}
```

> [!IMPORTANT]
> Always import `Browser` from `puppeteer` (not `rebrowser-puppeteer`) when using `@InjectBrowser()`. The decorator's DI token is the upstream `Browser` class identity; a class re-exported from a different package is a different token even though it is structurally compatible at runtime.

> [!NOTE]
> `rebrowser-puppeteer`'s postinstall script downloads upstream puppeteer's pinned Chromium revision rather than its own, so the first `.launch()` call fails with "Could not find Chrome (ver. \<revision>)". Trigger rebrowser's own download once after install:
>
> ```sh
> $ node -e "import('rebrowser-puppeteer/internal/node/install.js').then(m => m.downloadBrowsers())"
> ```

The `launcher` option accepts any object exposing a `launch(options)` method, so other puppeteer-compatible builds work the same way.
