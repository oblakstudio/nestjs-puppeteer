import { Provider } from '@nestjs/common';
import type { BrowserContext } from 'puppeteer';
import { getContextToken, getPageToken } from './common';
import { PuppeteerModuleOptions } from './interfaces';

export function createPuppeteerProviders(
  pages?: string[],
  browser?: PuppeteerModuleOptions | string,
): Provider[] {
  return (pages || []).map((page) => ({
    provide: getPageToken(page, browser),
    useFactory: async(context: BrowserContext) => {
      return await context.newPage();
    },
    inject: [getContextToken(browser)]
  }));
}
