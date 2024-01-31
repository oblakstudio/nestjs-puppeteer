import {
  DynamicModule,
  Global,
  Inject,
  Logger,
  Module,
  OnApplicationShutdown,
  Provider,
  Type,
} from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import puppeteer from 'puppeteer-extra';
import { Browser } from 'puppeteer';
import {
  PuppeteerModuleAsyncOptions,
  PuppeteerModuleOptions,
  PuppeteerOptionsFactory,
} from './interfaces';
import {
  PUPPETEER_BROWSER_PLUGINS,
  PUPPETEER_MODULE_OPTIONS,
} from './puppeteer.constants';
import { getBrowserToken } from './common';

@Global()
@Module({})
export class PuppeteerCoreModule implements OnApplicationShutdown {
  private readonly logger = new Logger('PuppeteerModule');
  constructor(
    @Inject(PUPPETEER_MODULE_OPTIONS)
    private readonly options: PuppeteerModuleOptions,
    private readonly moduleRef: ModuleRef,
  ) {}

  static forRoot(options: any = {}): DynamicModule {
    const puppeteerModuleOptions = {
      provide: PUPPETEER_MODULE_OPTIONS,
      useValue: options,
    };

    const pluginProvider = {
      provide: PUPPETEER_BROWSER_PLUGINS,
      useFactory: async (options: PuppeteerModuleOptions) => {
        if (options.plugins) {
          options.plugins.forEach((plugin) => puppeteer.use(plugin));
          return options.plugins;
        }
        return [];
      },
      inject: [PUPPETEER_MODULE_OPTIONS],
    };

    const browserProvider = {
      provide: getBrowserToken(options),
      useFactory: async (options: PuppeteerModuleOptions) => {
        return await puppeteer.launch(options);
      },
      inject: [PUPPETEER_MODULE_OPTIONS],
    };

    const providers = [puppeteerModuleOptions, pluginProvider, browserProvider];
    const exports = [browserProvider];

    return {
      module: PuppeteerCoreModule,
      providers,
      exports,
    };
  }

  static forRootAsync(options: PuppeteerModuleAsyncOptions): DynamicModule {
    const pluginProvider = {
      provide: PUPPETEER_BROWSER_PLUGINS,
      useFactory: async (options: PuppeteerModuleOptions) => {
        if (options.plugins) {
          options.plugins.forEach((plugin) => puppeteer.use(plugin));
          return options.plugins;
        }
        return [];
      },
      inject: [PUPPETEER_MODULE_OPTIONS],
    };
    const browserProvider = {
      provide: getBrowserToken(options),
      useFactory: async (options: PuppeteerModuleOptions) => {
        return await puppeteer.launch(options);
      },
      inject: [PUPPETEER_MODULE_OPTIONS],
    };
    const asyncProviders = this.createAsyncProviders(options);

    const providers = [...asyncProviders, pluginProvider, browserProvider];

    const exports = [browserProvider];

    return {
      module: PuppeteerCoreModule,
      providers,
      exports,
    };
  }

  async onApplicationShutdown(): Promise<void> {
    const browser = this.moduleRef.get<Browser>(getBrowserToken(this.options));

    try {
      if (browser && browser.connected) {
        this.logger.log('Closing browser...');
        await browser.close();
      }
    } catch (e) {
      this.logger.error(e?.message);
    }
  }

  private static createAsyncProviders(
    options: PuppeteerModuleAsyncOptions,
  ): Provider[] {
    if (options.useExisting || options.useFactory) {
      return [this.createAsyncOptionsProvider(options)];
    }

    const useClass = options.useClass as Type<PuppeteerOptionsFactory>;

    return [
      this.createAsyncOptionsProvider(options),
      {
        provide: useClass,
        useClass,
      },
    ];
  }

  private static createAsyncOptionsProvider(
    options: PuppeteerModuleAsyncOptions,
  ): Provider {
    if (options.useFactory) {
      return {
        provide: PUPPETEER_MODULE_OPTIONS,
        useFactory: options.useFactory,
        inject: options.inject || [],
      };
    }

    const inject = [
      (options.useClass ||
        options.useExisting) as Type<PuppeteerOptionsFactory>,
    ];

    return {
      provide: PUPPETEER_MODULE_OPTIONS,
      useFactory: async (optionsFactory: PuppeteerOptionsFactory) =>
        await optionsFactory.createPuppeteerOptions(options.name),
      inject,
    };
  }
}
