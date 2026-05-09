import { Logger } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { PuppeteerModule } from '../../lib';
import { PuppeteerCoreModule } from '../../lib/puppeteer-core.module';

describe('PuppeteerCoreModule onApplicationShutdown', () => {
  let errorSpy: jest.SpyInstance;
  let logSpy: jest.SpyInstance;

  beforeEach(() => {
    errorSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation();
    logSpy = jest.spyOn(Logger.prototype, 'log').mockImplementation();
  });

  afterEach(() => {
    errorSpy.mockRestore();
    logSpy.mockRestore();
  });

  function buildModule(
    browser: { connected: boolean; close: () => Promise<void> },
    options: { name?: string } = {},
  ) {
    const moduleRef = { get: () => browser } as unknown as ModuleRef;
    return new PuppeteerCoreModule(options, moduleRef);
  }

  describe('error path', () => {
    it('logs message + stack when browser.close throws an Error', async () => {
      const err = new Error('boom');
      const module = buildModule({
        connected: true,
        close: jest.fn().mockRejectedValue(err),
      });

      await module.onApplicationShutdown();

      expect(errorSpy).toHaveBeenCalledTimes(1);
      expect(errorSpy).toHaveBeenCalledWith(
        'Failed to close browser: boom',
        err.stack,
      );
    });

    it('logs a stringified value when a non-Error is thrown', async () => {
      const module = buildModule({
        connected: true,
        close: jest.fn().mockRejectedValue('plain string failure'),
      });

      await module.onApplicationShutdown();

      expect(errorSpy).toHaveBeenCalledTimes(1);
      expect(errorSpy).toHaveBeenCalledWith(
        'Failed to close browser: plain string failure',
      );
    });

    it('does not log when browser is disconnected', async () => {
      const close = jest.fn();
      const module = buildModule({ connected: false, close });

      await module.onApplicationShutdown();

      expect(close).not.toHaveBeenCalled();
      expect(errorSpy).not.toHaveBeenCalled();
    });
  });

  describe('happy path', () => {
    it('logs "Closing browser..." and calls browser.close', async () => {
      const close = jest.fn().mockResolvedValue(undefined);
      const module = buildModule({ connected: true, close });

      await module.onApplicationShutdown();

      expect(close).toHaveBeenCalledTimes(1);
      expect(logSpy).toHaveBeenCalledWith('Closing browser...');
      expect(errorSpy).not.toHaveBeenCalled();
    });

    it('releases the registered name so the same name can be re-registered', async () => {
      const name = `reuse-${process.pid}-${Date.now()}`;

      // Reserve the name via the public registration path.
      expect(() => PuppeteerModule.forRoot({ name })).not.toThrow();

      // A second registration under the same name must throw — sanity check
      // that the registry is actually populated.
      expect(() => PuppeteerModule.forRoot({ name })).toThrow(
        new RegExp(`"${name}" is already registered`),
      );

      // Drive shutdown to release the name. The browser instance never got
      // built (we never init()'d a Nest app), so a stub close() is fine.
      const module = buildModule(
        {
          connected: true,
          close: jest.fn().mockResolvedValue(undefined),
        },
        { name },
      );
      await module.onApplicationShutdown();

      // Now the same name can be claimed again.
      expect(() => PuppeteerModule.forRoot({ name })).not.toThrow();
    });
  });
});
