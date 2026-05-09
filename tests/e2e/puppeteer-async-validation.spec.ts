import { PuppeteerModule } from '../../lib';

describe('PuppeteerModule.forRootAsync validation', () => {
  it('throws when none of useFactory/useClass/useExisting is provided', () => {
    expect(() => PuppeteerModule.forRootAsync({})).toThrow(
      'PuppeteerModule.forRootAsync requires one of useFactory, useClass, or useExisting',
    );
  });

  it('throws when only unrelated options are provided', () => {
    expect(() => PuppeteerModule.forRootAsync({ name: 'foo' })).toThrow(
      /requires one of useFactory, useClass, or useExisting/,
    );
  });

  it('does not throw when useFactory is provided', () => {
    expect(() =>
      PuppeteerModule.forRootAsync({ useFactory: () => ({}) }),
    ).not.toThrow();
  });
});
