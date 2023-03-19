import { DynamicModule, Module } from '@nestjs/common';
import {
  PuppeteerModuleAsyncOptions,
  PuppeteerModuleOptions,
} from './interfaces';
import { PuppeteerCoreModule } from './puppeteer-core.module';
import { DEFAULT_BROWSER_NAME } from './puppeteer.constants';
import { createPuppeteerProviders } from './puppeteer.providers';

@Module({})
export class PuppeteerModule {
  static forRoot(options?: PuppeteerModuleOptions): DynamicModule {
    return {
      module: PuppeteerModule,
      global: options?.isGlobal,
      imports: [PuppeteerCoreModule.forRoot(options)],
    };
  }

  static forFeature(
    pages: string[],
    browser: PuppeteerModuleOptions | string = DEFAULT_BROWSER_NAME,
  ): DynamicModule {
    const providers = createPuppeteerProviders(pages, browser);

    return {
      module: PuppeteerModule,
      providers: providers,
      exports: providers,
    }
  }

  static forRootAsync(options: PuppeteerModuleAsyncOptions): DynamicModule {
    return {
      module: PuppeteerModule,
      global: options?.isGlobal,
      imports: [PuppeteerCoreModule.forRootAsync(options)],
    };
  }
}
