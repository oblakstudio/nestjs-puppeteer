import { Injectable, Module } from '@nestjs/common';
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

  it('threads `inject` dependencies into a useFactory', async () => {
    @Injectable()
    class Tag {
      readonly value = 'tagged';
    }

    @Module({
      providers: [Tag],
      exports: [Tag],
    })
    class TagModule {}

    const factory = jest.fn(
      (tag: Tag): PuppeteerModuleOptions => ({
        // Branch on the injected value to prove it actually reached the factory.
        headless: true,
        args: tag.value === 'tagged' ? [] : ['--should-not-happen'],
      }),
    );

    @Module({
      imports: [
        PuppeteerModule.forRootAsync({
          imports: [TagModule],
          inject: [Tag],
          useFactory: factory,
        }),
      ],
    })
    class InjectModule {}

    const module = await Test.createTestingModule({
      imports: [InjectModule],
    }).compile();

    const app = module.createNestApplication();
    await app.init();

    try {
      const browser = app.get<Browser>(getBrowserToken());
      expect(browser).toBeDefined();
      expect(factory).toHaveBeenCalledTimes(1);
      const arg = factory.mock.calls[0][0];
      expect(arg).toBeInstanceOf(Tag);
      expect(arg.value).toBe('tagged');
    } finally {
      await app.close();
    }
  }, 60000);
});
