import { Module } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Browser } from 'puppeteer';
import {
  PuppeteerModule,
  PuppeteerModuleOptions,
  getBrowserToken,
} from '../../lib';

describe('Puppeteer multi-browser shutdown', () => {
  it('closes every browser instance on app shutdown (forRoot)', async () => {
    @Module({
      imports: [
        PuppeteerModule.forRoot({ headless: true }),
        PuppeteerModule.forRoot({ name: 'secondary', headless: true }),
      ],
    })
    class MultiBrowserModule {}

    const module = await Test.createTestingModule({
      imports: [MultiBrowserModule],
    }).compile();

    const app = module.createNestApplication();
    await app.init();

    const defaultBrowser = app.get<Browser>(getBrowserToken());
    const secondaryBrowser = app.get<Browser>(getBrowserToken('secondary'));

    expect(defaultBrowser).not.toBe(secondaryBrowser);
    expect(defaultBrowser.connected).toBe(true);
    expect(secondaryBrowser.connected).toBe(true);
    // Each browser must own a distinct chromium process.
    const defaultPid = defaultBrowser.process()?.pid;
    const secondaryPid = secondaryBrowser.process()?.pid;
    expect(defaultPid).toBeDefined();
    expect(secondaryPid).toBeDefined();
    expect(defaultPid).not.toBe(secondaryPid);

    await app.close();

    expect(defaultBrowser.connected).toBe(false);
    expect(secondaryBrowser.connected).toBe(false);
  }, 60000);

  it('closes every browser instance on app shutdown (forRootAsync)', async () => {
    @Module({
      imports: [
        PuppeteerModule.forRootAsync({
          useFactory: (): PuppeteerModuleOptions => ({ headless: true }),
        }),
        PuppeteerModule.forRootAsync({
          name: 'secondary',
          useFactory: (): PuppeteerModuleOptions => ({
            name: 'secondary',
            headless: true,
          }),
        }),
      ],
    })
    class MultiBrowserAsyncModule {}

    const module = await Test.createTestingModule({
      imports: [MultiBrowserAsyncModule],
    }).compile();

    const app = module.createNestApplication();
    await app.init();

    const defaultBrowser = app.get<Browser>(getBrowserToken());
    const secondaryBrowser = app.get<Browser>(getBrowserToken('secondary'));

    expect(defaultBrowser).not.toBe(secondaryBrowser);
    expect(defaultBrowser.connected).toBe(true);
    expect(secondaryBrowser.connected).toBe(true);

    await app.close();

    expect(defaultBrowser.connected).toBe(false);
    expect(secondaryBrowser.connected).toBe(false);
  }, 60000);
});
