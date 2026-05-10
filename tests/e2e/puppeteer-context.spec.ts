import { Injectable, Module } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Browser, BrowserContext, Page } from 'puppeteer';
import {
  InjectContext,
  PuppeteerLauncher,
  PuppeteerModule,
  PuppeteerModuleOptions,
  getBrowserToken,
  getContextToken,
  getPageToken,
} from '../../lib';

function createFakePuppeteer(): {
  browser: Browser;
  context: BrowserContext;
  defaultContext: BrowserContext;
  launcher: PuppeteerLauncher<Browser>;
} {
  let browser: Browser;

  const createPage = (context: BrowserContext) =>
    ({
      browserContext: () => context,
    }) as Page;

  const defaultContext = {
    browser: () => browser,
    newPage: async () => createPage(defaultContext),
  } as BrowserContext;

  const context = {
    browser: () => browser,
    newPage: async () => createPage(context),
  } as BrowserContext;

  const contexts = [defaultContext];

  browser = {
    connected: true,
    close: jest.fn(async () => {
      (browser as { connected: boolean }).connected = false;
    }),
    createBrowserContext: jest.fn(async () => {
      contexts.push(context);
      return context;
    }),
    defaultBrowserContext: jest.fn(() => defaultContext),
    browserContexts: jest.fn(() => contexts),
  } as unknown as Browser;

  return {
    browser,
    context,
    defaultContext,
    launcher: {
      launch: jest.fn(async () => browser),
    },
  };
}

describe('Puppeteer browser context injection', () => {
  it('registers an isolated BrowserContext for the default browser', async () => {
    const fake = createFakePuppeteer();

    @Module({
      imports: [PuppeteerModule.forRoot({ launcher: fake.launcher })],
    })
    class ContextModule {}

    const module = await Test.createTestingModule({
      imports: [ContextModule],
    }).compile();
    const app = module.createNestApplication();
    await app.init();

    const browser = app.get<Browser>(getBrowserToken());
    const context = app.get<BrowserContext>(getContextToken());

    expect(browser).toBe(fake.browser);
    expect(context).toBe(fake.context);
    expect(browser.browserContexts()).toContain(context);
    expect(context.browser()).toBe(browser);
    expect(context).not.toBe(browser.defaultBrowserContext());

    await app.close();
  }, 30000);

  it('supports InjectContext for named browser registrations', async () => {
    const fake = createFakePuppeteer();

    @Injectable()
    class ContextConsumer {
      constructor(
        @InjectContext('secondary')
        readonly context: BrowserContext,
      ) {}
    }

    @Module({
      imports: [
        PuppeteerModule.forRoot({
          name: 'secondary',
          launcher: fake.launcher,
        }),
      ],
      providers: [ContextConsumer],
    })
    class NamedContextModule {}

    const module = await Test.createTestingModule({
      imports: [NamedContextModule],
    }).compile();
    const app = module.createNestApplication();
    await app.init();

    const browser = app.get<Browser>(getBrowserToken('secondary'));
    const context = app.get<BrowserContext>(getContextToken('secondary'));
    const consumer = app.get(ContextConsumer);

    expect(consumer.context).toBe(context);
    expect(browser).toBe(fake.browser);
    expect(context).toBe(fake.context);
    expect(context.browser()).toBe(browser);
    expect(context).not.toBe(browser.defaultBrowserContext());

    await app.close();
  }, 30000);

  it('registers a BrowserContext for async browser registrations', async () => {
    const fake = createFakePuppeteer();

    @Module({
      imports: [
        PuppeteerModule.forRootAsync({
          name: 'async-secondary',
          useFactory: (): PuppeteerModuleOptions => ({
            name: 'async-secondary',
            launcher: fake.launcher,
          }),
        }),
      ],
    })
    class AsyncContextModule {}

    const module = await Test.createTestingModule({
      imports: [AsyncContextModule],
    }).compile();
    const app = module.createNestApplication();
    await app.init();

    const browser = app.get<Browser>(getBrowserToken('async-secondary'));
    const context = app.get<BrowserContext>(getContextToken('async-secondary'));

    expect(browser).toBe(fake.browser);
    expect(context).toBe(fake.context);
    expect(context.browser()).toBe(browser);
    expect(browser.browserContexts()).toContain(context);

    await app.close();
  }, 30000);

  it('creates forFeature pages from the registered BrowserContext', async () => {
    const fake = createFakePuppeteer();

    @Module({
      imports: [
        PuppeteerModule.forRoot({
          name: 'feature-context',
          launcher: fake.launcher,
        }),
        PuppeteerModule.forFeature(['scratch'], 'feature-context'),
      ],
    })
    class FeatureContextModule {}

    const module = await Test.createTestingModule({
      imports: [FeatureContextModule],
    }).compile();
    const app = module.createNestApplication();
    await app.init();

    const context = app.get<BrowserContext>(getContextToken('feature-context'));
    const page = app.get<Page>(getPageToken('scratch', 'feature-context'));

    expect(page.browserContext()).toBe(context);

    await app.close();
  }, 30000);
});
