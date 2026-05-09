import { Module } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Browser } from 'puppeteer';
import {
  PuppeteerModule,
  PuppeteerModuleOptions,
  PuppeteerOptionsFactory,
  getBrowserToken,
} from '../../lib';

class PuppeteerConfig implements PuppeteerOptionsFactory {
  createPuppeteerOptions(browserName?: string): PuppeteerModuleOptions {
    return {
      // `name` must be echoed back so onApplicationShutdown's
      // `getBrowserToken(this.options)` lookup matches the registration token.
      // Tracked as a library quirk in beads nestjs-puppeteer-69x.
      name: browserName,
      headless: true,
      // Branch on the name so we can prove the right value was threaded in.
      args: browserName === 'secondary' ? ['--no-sandbox'] : [],
    };
  }
}

describe('PuppeteerModule.forRootAsync with useClass', () => {
  it('threads the configured `name` into PuppeteerOptionsFactory.createPuppeteerOptions', async () => {
    const createSpy = jest.spyOn(
      PuppeteerConfig.prototype,
      'createPuppeteerOptions',
    );

    @Module({
      imports: [
        PuppeteerModule.forRootAsync({ useClass: PuppeteerConfig }),
        PuppeteerModule.forRootAsync({
          name: 'secondary',
          useClass: PuppeteerConfig,
        }),
      ],
    })
    class UseClassModule {}

    const module = await Test.createTestingModule({
      imports: [UseClassModule],
    }).compile();

    const app = module.createNestApplication();
    await app.init();

    try {
      // Both browsers booted via the useClass factory.
      const defaultBrowser = app.get<Browser>(getBrowserToken());
      const secondaryBrowser = app.get<Browser>(getBrowserToken('secondary'));
      expect(defaultBrowser).not.toBe(secondaryBrowser);

      // Factory was invoked once per registration with the documented `name`
      // argument (line 182 of puppeteer-core.module.ts).
      expect(createSpy).toHaveBeenCalledTimes(2);
      const calledWith = createSpy.mock.calls.map((call) => call[0]);
      expect(calledWith).toEqual(
        expect.arrayContaining([undefined, 'secondary']),
      );
    } finally {
      await app.close();
      createSpy.mockRestore();
    }
  }, 60000);
});
