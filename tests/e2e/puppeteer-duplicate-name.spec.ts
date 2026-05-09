import { PuppeteerModule } from '../../lib';

describe('PuppeteerModule duplicate browser-name detection', () => {
  it('forRoot throws when the same name is registered twice', () => {
    expect(() =>
      PuppeteerModule.forRoot({ name: 'dup-sync', headless: true }),
    ).not.toThrow();

    expect(() =>
      PuppeteerModule.forRoot({ name: 'dup-sync', headless: true }),
    ).toThrow(/"dup-sync" is already registered/);
  });

  it('forRootAsync throws when the same name is registered twice', () => {
    expect(() =>
      PuppeteerModule.forRootAsync({
        name: 'dup-async',
        useFactory: () => ({ headless: true }),
      }),
    ).not.toThrow();

    expect(() =>
      PuppeteerModule.forRootAsync({
        name: 'dup-async',
        useFactory: () => ({ headless: true }),
      }),
    ).toThrow(/"dup-async" is already registered/);
  });

  it('throws when the default (unnamed) browser is registered twice', () => {
    expect(() => PuppeteerModule.forRoot()).not.toThrow();
    expect(() => PuppeteerModule.forRoot()).toThrow(/default \(unnamed\) is already registered/);
  });
});
