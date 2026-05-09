import { Logger } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { PuppeteerCoreModule } from '../../lib/puppeteer-core.module';

describe('PuppeteerCoreModule onApplicationShutdown error logging', () => {
  let errorSpy: jest.SpyInstance;

  beforeEach(() => {
    errorSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation();
  });

  afterEach(() => {
    errorSpy.mockRestore();
  });

  function buildModule(browser: { connected: boolean; close: () => Promise<void> }) {
    const moduleRef = { get: () => browser } as unknown as ModuleRef;
    return new PuppeteerCoreModule({}, moduleRef);
  }

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
