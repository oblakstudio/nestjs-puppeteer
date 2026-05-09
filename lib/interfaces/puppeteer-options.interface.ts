import {
  InjectionToken,
  ModuleMetadata,
  OptionalFactoryDependency,
  Type,
} from '@nestjs/common';
import { Browser, PuppeteerNode } from 'puppeteer';

/**
 * Launch options accepted by the installed puppeteer's `launch()`. Resolved
 * structurally so the same type works across the supported peer-dep range
 * (^22 || ^23 || ^24); v24 removed the legacy `PuppeteerLaunchOptions` /
 * `PuppeteerNodeLaunchOptions` aliases in favor of `LaunchOptions`.
 */
type LaunchOptions = NonNullable<Parameters<PuppeteerNode['launch']>[0]>;

/**
 * Minimal contract for a puppeteer-compatible launcher. Any object exposing
 * a `launch(options)` method that returns a `Promise<Browser>` will satisfy
 * it — the returned `Browser` is treated structurally and only needs to
 * support the surface the rest of the library relies on (`connected`,
 * `close()`, `newPage()`).
 *
 * Both the input and the returned browser are intentionally untyped here:
 * puppeteer's `Browser` is an abstract class with private fields, and so are
 * many of its callback parameters (`TargetFilterCallback` etc.). Drop-in
 * forks like `rebrowser-puppeteer` ship their own structurally-identical
 * but nominally distinct copies of these types, so a strictly-typed
 * `LaunchOptions` parameter would refuse rebrowser at every call site for
 * no runtime benefit. The library casts the result to upstream `Browser`
 * internally; structural compatibility is the only real contract.
 */
export interface PuppeteerLauncher<B = Browser> {
  launch(options?: any): Promise<B>;
}

export type PuppeteerModuleOptions = {
  /**
   * Browser name
   */
  name?: string;

  /**
   * Is the module global
   */
  isGlobal?: boolean;

  /**
   * Optional launcher used in place of the bundled `puppeteer` import.
   * Pass any object exposing a `launch(options)` method — for example
   * `rebrowser-puppeteer` for anti-detection patches. Defaults to the
   * upstream `puppeteer` package.
   */
  launcher?: PuppeteerLauncher<any>;
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
