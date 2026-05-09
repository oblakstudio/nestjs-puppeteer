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
import puppeteer, { Browser } from 'puppeteer';
import {
  PuppeteerModuleAsyncOptions,
  PuppeteerModuleOptions,
  PuppeteerOptionsFactory,
} from './interfaces';
import {
  DEFAULT_BROWSER_NAME,
  PUPPETEER_MODULE_OPTIONS,
} from './puppeteer.constants';
import { getBrowserToken } from './common';

const registeredBrowserNames = new Set<string>();

function resolveBrowserKey(name: string | undefined): string {
  return name && name !== DEFAULT_BROWSER_NAME ? name : DEFAULT_BROWSER_NAME;
}

/**
 * Reserve a browser name on the process-level registry. Two PuppeteerModule
 * registrations sharing the same `name` (or both omitting it) would otherwise
 * silently overwrite each other's DI token, leaving one Browser unreachable
 * and un-shutdown. Throw immediately so the misconfiguration is loud.
 */
function claimBrowserName(name: string | undefined): void {
  const key = resolveBrowserKey(name);
  if (registeredBrowserNames.has(key)) {
    const label = key === DEFAULT_BROWSER_NAME ? 'default (unnamed)' : `"${key}"`;
    throw new Error(
      `PuppeteerModule: a browser with name ${label} is already registered. ` +
        `Each PuppeteerModule.forRoot()/forRootAsync() call must use a unique \`name\`.`,
    );
  }
  registeredBrowserNames.add(key);
}

function releaseBrowserName(name: string | undefined): void {
  registeredBrowserNames.delete(resolveBrowserKey(name));
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
    claimBrowserName(options.name);

    const puppeteerModuleOptions = {
      provide: PUPPETEER_MODULE_OPTIONS,
      useValue: options,
    };

    const browserProvider = {
      provide: getBrowserToken(options),
      useFactory: async (options: PuppeteerModuleOptions) => {
        return await (options.launcher ?? puppeteer).launch(options);
      },
      inject: [PUPPETEER_MODULE_OPTIONS],
    };

    const providers = [puppeteerModuleOptions, browserProvider];
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

    claimBrowserName(options.name);

    const browserProvider = {
      provide: getBrowserToken(options),
      useFactory: async (options: PuppeteerModuleOptions) => {
        return await (options.launcher ?? puppeteer).launch(options);
      },
      inject: [PUPPETEER_MODULE_OPTIONS],
    };
    const asyncProviders = this.createAsyncProviders(options);

    const providers = [...asyncProviders, browserProvider];

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
    } finally {
      releaseBrowserName(this.options.name);
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
