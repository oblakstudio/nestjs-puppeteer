import { Provider } from '@nestjs/common';
import { Browser } from 'puppeteer';
import { getBrowserToken, getPageToken } from './common';
import { PuppeteerModuleOptions } from './interfaces';

export function createPuppeteerProviders(
  pages?: string[],
  browser?: PuppeteerModuleOptions | string,
): Provider[] {
  return (pages || []).map((page) => ({
    provide: getPageToken(page, browser),
    useFactory: async(browser:Browser) => {
      return await browser.newPage();
    },
    inject: [getBrowserToken(browser)]
  }));
}
