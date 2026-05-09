import {
  InjectionToken,
  ModuleMetadata,
  OptionalFactoryDependency,
  Type,
} from '@nestjs/common';
import { PuppeteerNodeLaunchOptions } from 'puppeteer';
import { PuppeteerExtraPlugin } from 'puppeteer-extra';

export type PuppeteerModuleOptions = {
  /**
   * Browser name
   */
  name?: string;

  /**
   * Array of puppeteer-extra plugins.
   *
   * NOTE: puppeteer-extra registers plugins on a process-global singleton, so
   * any plugin you list here affects every subsequent `puppeteer.launch()` in
   * the same process — including launches by other PuppeteerModule instances
   * that did not opt into the plugin. The module dedupes by plugin name to
   * avoid stacking on repeated module re-registration, but it cannot scope a
   * plugin to a single browser. Most plugins (e.g. stealth) are also
   * incompatible with Chrome's "new headless" mode; pass `headless: true`.
   */
  plugins?: PuppeteerExtraPlugin[];

  /**
   * Is the module global
   */
  isGlobal?: boolean;
} & Partial<PuppeteerNodeLaunchOptions>;

export interface PuppeteerOptionsFactory {
  createPuppeteerOptions(
    browserName?: string,
  ): Promise<PuppeteerModuleOptions> | PuppeteerModuleOptions;
}

export interface PuppeteerModuleAsyncOptions extends Pick<ModuleMetadata, 'imports'> {
  name?: string;
  isGlobal?: boolean;
  useExisting?: Type<PuppeteerOptionsFactory>;
  useClass?: Type<PuppeteerOptionsFactory>;
  useFactory?: (...args: any[]) => Promise<PuppeteerModuleOptions> | PuppeteerModuleOptions;
  inject?: Array<InjectionToken | OptionalFactoryDependency>;
}
