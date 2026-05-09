import { Injectable, Module } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Browser } from 'puppeteer';
import {
  PuppeteerModule,
  PuppeteerModuleOptions,
  PuppeteerOptionsFactory,
  getBrowserToken,
} from '../../lib';

@Injectable()
class PuppeteerConfig implements PuppeteerOptionsFactory {
  createPuppeteerOptions(browserName?: string): PuppeteerModuleOptions {
    return {
      name: browserName,
      headless: true,
      args: browserName === 'secondary' ? ['--no-sandbox'] : [],
    };
  }
}

@Module({
  providers: [PuppeteerConfig],
  exports: [PuppeteerConfig],
})
class ConfigModule {}

describe('PuppeteerModule.forRootAsync with useExisting', () => {
  it('reuses an existing factory instance for default and named registrations', async () => {
    const createSpy = jest.spyOn(
      PuppeteerConfig.prototype,
      'createPuppeteerOptions',
    );

    @Module({
      imports: [
        ConfigModule,
        PuppeteerModule.forRootAsync({
          imports: [ConfigModule],
          useExisting: PuppeteerConfig,
        }),
        PuppeteerModule.forRootAsync({
          name: 'secondary',
          imports: [ConfigModule],
          useExisting: PuppeteerConfig,
        }),
      ],
    })
    class UseExistingModule {}

    const module = await Test.createTestingModule({
      imports: [UseExistingModule],
    }).compile();

    const app = module.createNestApplication();
    await app.init();

    try {
      const defaultBrowser = app.get<Browser>(getBrowserToken());
      const secondaryBrowser = app.get<Browser>(getBrowserToken('secondary'));
      expect(defaultBrowser).not.toBe(secondaryBrowser);

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
