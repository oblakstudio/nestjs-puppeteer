import { PuppeteerModule } from '../../lib';

// `claimBrowserName` is process-global and only released on
// `onApplicationShutdown`. These tests register names without booting an app,
// so reuse across tests would leak. Use a unique suffix per test.
let counter = 0;
function uniqueName(prefix: string): string {
  counter += 1;
  return `${prefix}-${process.pid}-${counter}`;
}

describe('PuppeteerModule duplicate browser-name detection', () => {
  it('forRoot throws when the same name is registered twice', () => {
    const name = uniqueName('dup-sync');

    expect(() =>
      PuppeteerModule.forRoot({ name, headless: true }),
    ).not.toThrow();

    expect(() =>
      PuppeteerModule.forRoot({ name, headless: true }),
    ).toThrow(new RegExp(`"${name}" is already registered`));
  });

  it('forRootAsync throws when the same name is registered twice', () => {
    const name = uniqueName('dup-async');

    expect(() =>
      PuppeteerModule.forRootAsync({
        name,
        useFactory: () => ({ headless: true }),
      }),
    ).not.toThrow();

    expect(() =>
      PuppeteerModule.forRootAsync({
        name,
        useFactory: () => ({ headless: true }),
      }),
    ).toThrow(new RegExp(`"${name}" is already registered`));
  });

  it('throws when the default (unnamed) browser is registered twice', () => {
    expect(() => PuppeteerModule.forRoot()).not.toThrow();
    expect(() => PuppeteerModule.forRoot()).toThrow(/default \(unnamed\) is already registered/);
  });
});
