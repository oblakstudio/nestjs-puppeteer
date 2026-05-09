import { Module } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Browser } from 'puppeteer';
import rebrowserPuppeteer from 'rebrowser-puppeteer';
import {
  PuppeteerModule,
  getBrowserToken,
} from '../../lib';

describe('Puppeteer rebrowser launcher', () => {
  it('routes browser creation through the supplied launcher', async () => {
    // Spy must be attached before forRoot() — the launch happens during app.init().
    const launchSpy = jest.spyOn(rebrowserPuppeteer, 'launch');

    @Module({
      imports: [
        PuppeteerModule.forRoot({
          name: 'rebrowser',
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

    try {
      // Load-bearing assertion: the rebrowser launcher actually ran.
      // Without this, the test would still pass on a regression that fell
      // back to upstream puppeteer.
      expect(launchSpy).toHaveBeenCalledTimes(1);
      const callOptions = launchSpy.mock.calls[0][0];
      expect(callOptions).toMatchObject({
        name: 'rebrowser',
        headless: true,
      });

      const browser = app.get<Browser>(getBrowserToken('rebrowser'));
      const page = await browser.newPage();
      await page.setContent('<html><body>rebrowser</body></html>');
      expect(await page.content()).toContain('rebrowser');
      await page.close();
    } finally {
      await app.close();
      launchSpy.mockRestore();
    }
  }, 60000);
});
