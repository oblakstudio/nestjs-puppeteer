import { Type } from '@nestjs/common';
// `Browser` is intentionally a value import (not `import type`): it is the
// runtime DI token returned by `getBrowserToken` for the default unnamed
// browser/context. Flipping them to type-only imports would erase the tokens at
// compile time and break `@InjectBrowser()` / `@InjectContext()` resolution.
// `Page` is types-only.
import { Browser, BrowserContext } from 'puppeteer';
import type { Page } from 'puppeteer';
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

export function getContextToken(
  browser: PuppeteerModuleOptions | string = DEFAULT_BROWSER_NAME,
): string | Function | Type<BrowserContext> {
  return DEFAULT_BROWSER_NAME === browser
    ? BrowserContext
    : 'string' === typeof browser
    ? `${browser}BrowserContext`
    : DEFAULT_BROWSER_NAME === browser.name || !browser.name
    ? BrowserContext
    : `${browser.name}BrowserContext`;
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
