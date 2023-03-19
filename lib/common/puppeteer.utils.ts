import { Type } from '@nestjs/common';
import { Browser, Page } from 'puppeteer';
import { PuppeteerModuleOptions } from '../interfaces';
import { DEFAULT_BROWSER_NAME } from '../puppeteer.constants';

export function getBrowserToken(
  browser: PuppeteerModuleOptions | string = DEFAULT_BROWSER_NAME,
): string | Function | Type<Browser> {
  return DEFAULT_BROWSER_NAME === browser
    ? Browser
    : 'string' === typeof browser
    ? `${browser}Browser`
    : DEFAULT_BROWSER_NAME === browser.name || !browser.name
    ? Browser
    : `${browser.name}Browser`;
}

export function getPageToken(
  page: string,
  browser: PuppeteerModuleOptions | string = DEFAULT_BROWSER_NAME,
): string | Function | Type<Page> {
  const browserPrefix = getBrowserPrefix(browser)
  return `${browserPrefix}${page}Page`;
}

export function getBrowserPrefix(browser: PuppeteerModuleOptions | string = DEFAULT_BROWSER_NAME): string {
  return DEFAULT_BROWSER_NAME === browser
    ? ''
    : 'string' === typeof browser
    ? `${browser}_`
    : DEFAULT_BROWSER_NAME === browser.name || !browser.name
    ? ''
    : `${browser.name}_`;
}
