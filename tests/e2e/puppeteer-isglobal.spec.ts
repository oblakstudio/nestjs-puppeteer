import { PuppeteerModule } from '../../lib';

// `claimBrowserName` is process-global and only released on shutdown. These
// tests construct DynamicModules but never boot them, so they leak names —
// each test must use a unique one.
let counter = 0;
function uniqueName(prefix: string): string {
  counter += 1;
  return `${prefix}-${process.pid}-${counter}`;
}

describe('PuppeteerModule isGlobal flag', () => {
  it('forwards isGlobal: true onto the forRoot DynamicModule', () => {
    const dynamic = PuppeteerModule.forRoot({
      name: uniqueName('isglobal-sync-true'),
      isGlobal: true,
      headless: true,
    });

    expect(dynamic.global).toBe(true);
  });

  it('leaves DynamicModule.global undefined when isGlobal is omitted', () => {
    const dynamic = PuppeteerModule.forRoot({
      name: uniqueName('isglobal-sync-omit'),
      headless: true,
    });

    expect(dynamic.global).toBeUndefined();
  });

  it('forwards isGlobal: true onto the forRootAsync DynamicModule', () => {
    const dynamic = PuppeteerModule.forRootAsync({
      name: uniqueName('isglobal-async-true'),
      isGlobal: true,
      useFactory: () => ({ headless: true }),
    });

    expect(dynamic.global).toBe(true);
  });

  it('leaves DynamicModule.global undefined when isGlobal is omitted (async)', () => {
    const dynamic = PuppeteerModule.forRootAsync({
      name: uniqueName('isglobal-async-omit'),
      useFactory: () => ({ headless: true }),
    });

    expect(dynamic.global).toBeUndefined();
  });
});
