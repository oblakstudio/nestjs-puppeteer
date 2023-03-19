import { ModuleMetadata, Type } from '@nestjs/common';
import { PuppeteerNodeLaunchOptions } from 'puppeteer';
import { PuppeteerExtraPlugin } from 'puppeteer-extra';

export type PuppeteerModuleOptions = {
  /**
   * Browser name
   */
  name?: string;

  /**
   * Array of puppeteer-extra plugins
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
  inject?: any[];
}
