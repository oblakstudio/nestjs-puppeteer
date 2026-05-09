import {
  InjectionToken,
  ModuleMetadata,
  OptionalFactoryDependency,
  Type,
} from '@nestjs/common';
import { PuppeteerNode } from 'puppeteer';
import { PuppeteerExtraPlugin } from 'puppeteer-extra';

/**
 * Launch options accepted by the installed puppeteer's `launch()`. Resolved
 * structurally so the same type works across the supported peer-dep range
 * (^22 || ^23 || ^24); v24 removed the legacy `PuppeteerLaunchOptions` /
 * `PuppeteerNodeLaunchOptions` aliases in favor of `LaunchOptions`.
 */
type LaunchOptions = NonNullable<Parameters<PuppeteerNode['launch']>[0]>;

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
   * plugin to a single browser. Most plugins (e.g. stealth) were authored
   * against the legacy headless implementation; since puppeteer v22 made
   * new-headless the default for `headless: true`, opt into the legacy
   * `chrome-headless-shell` binary via `headless: 'shell'` for plugin compat.
   */
  plugins?: PuppeteerExtraPlugin[];

  /**
   * Is the module global
   */
  isGlobal?: boolean;
} & Partial<LaunchOptions>;

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
