<div align="center">

# nestjs-puppeteer
Puppeteer module for Nest framework (node.js)

[![npm](https://img.shields.io/npm/v/nestjs-puppeteer?logo=npm)](https://npmjs/package/nestjs-puppeteer)
![npm](https://img.shields.io/npm/dm/nestjs-puppeteer)
![GitHub](https://img.shields.io/github/license/oblakstudio/nestjs-puppeteer)
[![semantic-release: angular](https://img.shields.io/badge/semantic--release-angular-e10079?logo=semantic-release)](https://github.com/semantic-release/semantic-release)  
![Puppeter Peer Dep](https://img.shields.io/npm/dependency-version/nestjs-puppeteer/peer/@nestjs/core?logo=nestjs&logoColor=E42844)
![NestJS Peer Dep](https://img.shields.io/npm/dependency-version/nestjs-puppeteer/peer/puppeteer?logo=puppeteer&logoColor=%23fff)

</div>

Headless Chrome provider for [NestJS](https://nestjs.com/), enabling easy integration of Puppeteer into your application.

> [!IMPORTANT]
> Chrome introduces the _"New Headless"_ mode in version 112. Most of `puppeteer-extra` plugins are **NOT COMPATIBLE** with this mode. If you want to use `puppeteer-extra` plugins, you need to define `headless: true` in the module configuration.
>
> You can read more about the new headless mode [here](https://developer.chrome.com/docs/chromium/new-headless).

## Installation

To begin using it, we first install the required dependencies.

```sh
$ npm install --save nestjs-puppeteer puppeteer-extra puppeteer
```
## Usage

Once the installation process is complete we can import the ``PuppeteerModule`` into the root ``AppModule``

```ts
import { Module } from '@nestjs/common';
import { PuppeteerModule } from 'nestjs-puppeteer';

@Module({
  imports: [
    PuppeteerModule.forRoot({ headless: 'new' }),
  ],
})
export class AppModule {}
```

The ``forRoot()`` method supports all the configuration properties exposed by the ``PuppeteerNodeLaunchOptions`` object used by the ``puppeteer.launch()`` method. There are several extra configuration properties described below.


| Property  | Description |
| ------------- | ------------- |
| ``name``  | Browser name  |
| ``plugins``  | An array of ``puppeteer-extra`` plugins  |
| ``isGlobal`` | Should the module be registered in the global context |
| ``headless`` | `new` for the [New Headless](https://developer.chrome.com/docs/chromium/new-headless) mode, or `true`/`false`  |

Once this is done, the Puppeteer ``Browser`` instance will be available for injection in any of the providers in the application.

```ts
import { Browser } from 'puppeteer';

@Module({
  imports: [
    PuppeteerModule.forRoot({ headless: 'new' }),
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
    PuppeteerModule.forRoot({ headless: 'new' }),
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
    PuppeteerModule.forRoot({ headless: 'new' }),
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
  createPuppeteerOptions(): PuppeteerNodeLaunchOptions {
    return {
      headless: 'new',
    };
  }
}
```
