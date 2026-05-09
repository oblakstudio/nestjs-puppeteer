import {
  InjectionToken,
  ModuleMetadata,
  OptionalFactoryDependency,
  Type,
} from '@nestjs/common';
import { PuppeteerNode } from 'puppeteer';

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
