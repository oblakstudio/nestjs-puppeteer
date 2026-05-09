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
import { PuppeteerExtraPlugin } from 'puppeteer-extra';
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

const pluginRegistrationLogger = new Logger('PuppeteerModule');

/**
 * Register plugins on the global puppeteer-extra singleton, skipping any whose
 * name is already registered. puppeteer-extra holds plugin state in module
 * scope, so naive re-registration (e.g. multiple forRoot calls in tests) would
 * stack duplicate plugins on every subsequent launch.
 */
function registerPlugins(
  plugins: PuppeteerExtraPlugin[] | undefined,
): PuppeteerExtraPlugin[] {
  if (!plugins?.length) {
    return [];
  }

  const registered = new Set<string>(puppeteer.pluginNames);

  for (const plugin of plugins) {
    const name = plugin?.name;
    if (typeof name === 'string' && registered.has(name)) {
      pluginRegistrationLogger.warn(
        `Skipping duplicate puppeteer-extra plugin "${name}" — already registered on the global instance.`,
      );
      continue;
    }
    puppeteer.use(plugin);
    if (typeof name === 'string') {
      registered.add(name);
    }
  }

  return plugins;
}

@Global()
@Module({})
export class PuppeteerCoreModule implements OnApplicationShutdown {
  private readonly logger = new Logger('PuppeteerModule');
  constructor(
    @Inject(PUPPETEER_MODULE_OPTIONS)
    private readonly options: PuppeteerModuleOptions,
    private readonly moduleRef: ModuleRef,
  ) {}

  static forRoot(options: PuppeteerModuleOptions = {}): DynamicModule {
    const puppeteerModuleOptions = {
      provide: PUPPETEER_MODULE_OPTIONS,
      useValue: options,
    };

    const pluginProvider = {
      provide: PUPPETEER_BROWSER_PLUGINS,
      useFactory: async (options: PuppeteerModuleOptions) =>
        registerPlugins(options.plugins),
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
    if (!options.useFactory && !options.useClass && !options.useExisting) {
      throw new Error(
        'PuppeteerModule.forRootAsync requires one of useFactory, useClass, or useExisting',
      );
    }

    const pluginProvider = {
      provide: PUPPETEER_BROWSER_PLUGINS,
      useFactory: async (options: PuppeteerModuleOptions) =>
        registerPlugins(options.plugins),
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
      if (e instanceof Error) {
        this.logger.error(`Failed to close browser: ${e.message}`, e.stack);
      } else {
        this.logger.error(`Failed to close browser: ${String(e)}`);
      }
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

    const factory = (options.useClass ?? options.useExisting) as Type<PuppeteerOptionsFactory>;
    const inject = [factory];

    return {
      provide: PUPPETEER_MODULE_OPTIONS,
      useFactory: async (optionsFactory: PuppeteerOptionsFactory) =>
        await optionsFactory.createPuppeteerOptions(options.name),
      inject,
    };
  }
}
