import { Module } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Browser } from 'puppeteer';
import rebrowserPuppeteer from 'rebrowser-puppeteer';
import {
  PuppeteerModule,
  PuppeteerModuleOptions,
  getBrowserToken,
} from '../../lib';

describe('Puppeteer rebrowser launcher', () => {
  it('boots a real Browser via rebrowser-puppeteer (forRoot)', async () => {
    @Module({
      imports: [
        PuppeteerModule.forRoot({
          name: 'rebrowser-sync',
          launcher: rebrowserPuppeteer,
          headless: true,
        }),
      ],
    })
    class RebrowserAppModule {}

    const module = await Test.createTestingModule({
      imports: [RebrowserAppModule],
    }).compile();

    const app = module.createNestApplication();
    await app.init();

    const browser = app.get<Browser>(getBrowserToken('rebrowser-sync'));

    expect(browser).toBeDefined();
    expect(browser.connected).toBe(true);
    expect(browser.process()?.pid).toBeDefined();

    const page = await browser.newPage();
    await page.setContent('<html><body>rebrowser</body></html>');
    expect(await page.content()).toContain('rebrowser');
    await page.close();

    await app.close();

    expect(browser.connected).toBe(false);
  }, 60000);

  it('threads launcher through forRootAsync', async () => {
    @Module({
      imports: [
        PuppeteerModule.forRootAsync({
          name: 'rebrowser-async',
          useFactory: (): PuppeteerModuleOptions => ({
            name: 'rebrowser-async',
            launcher: rebrowserPuppeteer,
            headless: true,
          }),
        }),
      ],
    })
    class RebrowserAsyncModule {}

    const module = await Test.createTestingModule({
      imports: [RebrowserAsyncModule],
    }).compile();

    const app = module.createNestApplication();
    await app.init();

    const browser = app.get<Browser>(getBrowserToken('rebrowser-async'));

    expect(browser).toBeDefined();
    expect(browser.connected).toBe(true);

    await app.close();

    expect(browser.connected).toBe(false);
  }, 60000);
});
