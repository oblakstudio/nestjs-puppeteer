import { Browser, BrowserContext } from 'puppeteer';
import {
  DEFAULT_BROWSER_NAME,
  getBrowserPrefix,
  getBrowserToken,
  getContextToken,
  getPageToken,
} from '../../lib';

describe('puppeteer.utils token helpers', () => {
  describe('getBrowserToken', () => {
    it('returns Browser class for the default (no-arg) case', () => {
      expect(getBrowserToken()).toBe(Browser);
    });

    it('returns Browser class when DEFAULT_BROWSER_NAME is passed as a string', () => {
      expect(getBrowserToken(DEFAULT_BROWSER_NAME)).toBe(Browser);
    });

    it('returns `${name}Browser` for a string name', () => {
      expect(getBrowserToken('foo')).toBe('fooBrowser');
    });

    it('returns `${name}Browser` for an options object with a name', () => {
      expect(getBrowserToken({ name: 'foo' })).toBe('fooBrowser');
    });

    it('returns Browser class for an empty options object (no name)', () => {
      expect(getBrowserToken({})).toBe(Browser);
    });

    it('returns Browser class for an options object whose name is the default', () => {
      expect(getBrowserToken({ name: DEFAULT_BROWSER_NAME })).toBe(Browser);
    });
  });

  describe('getPageToken', () => {
    it('returns `${page}Page` for the default browser (no-arg)', () => {
      expect(getPageToken('home')).toBe('homePage');
    });

    it('returns `${page}Page` when default name is passed as a string', () => {
      expect(getPageToken('home', DEFAULT_BROWSER_NAME)).toBe('homePage');
    });

    it('prefixes with `${browser}_` for a string browser name', () => {
      expect(getPageToken('home', 'foo')).toBe('foo_homePage');
    });

    it('prefixes with `${browser.name}_` for an options object', () => {
      expect(getPageToken('home', { name: 'foo' })).toBe('foo_homePage');
    });

    it('returns the unprefixed token for an empty options object', () => {
      expect(getPageToken('home', {})).toBe('homePage');
    });
  });

  describe('getContextToken', () => {
    it('returns BrowserContext class for the default (no-arg) case', () => {
      expect(getContextToken()).toBe(BrowserContext);
    });

    it('returns BrowserContext class when DEFAULT_BROWSER_NAME is passed as a string', () => {
      expect(getContextToken(DEFAULT_BROWSER_NAME)).toBe(BrowserContext);
    });

    it('returns `${name}BrowserContext` for a string name', () => {
      expect(getContextToken('foo')).toBe('fooBrowserContext');
    });

    it('returns `${name}BrowserContext` for an options object with a name', () => {
      expect(getContextToken({ name: 'foo' })).toBe('fooBrowserContext');
    });

    it('returns BrowserContext class for an empty options object', () => {
      expect(getContextToken({})).toBe(BrowserContext);
    });
  });

  describe('getBrowserPrefix', () => {
    it('returns empty string for the default (no-arg) case', () => {
      expect(getBrowserPrefix()).toBe('');
    });

    it('returns empty string when default name is passed as a string', () => {
      expect(getBrowserPrefix(DEFAULT_BROWSER_NAME)).toBe('');
    });

    it('returns `${name}_` for a string name', () => {
      expect(getBrowserPrefix('foo')).toBe('foo_');
    });

    it('returns `${name}_` for an options object', () => {
      expect(getBrowserPrefix({ name: 'foo' })).toBe('foo_');
    });

    it('returns empty string for an options object with no name', () => {
      expect(getBrowserPrefix({})).toBe('');
    });
  });
});
