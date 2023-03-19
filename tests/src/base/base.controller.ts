import { Body, Controller, Get, Post } from '@nestjs/common';
import { Browser, Page } from 'puppeteer';
import { InjectBrowser, InjectPage } from '../../../lib';

@Controller()
export class BaseController {
  constructor(
    @InjectBrowser() private readonly browser: Browser,
    @InjectPage('dummy') private readonly dummyPage: Page
  ) {}

  @Get('/')
  getRoot(): string {
    return 'Hello World!';
  }

  @Post('basic-page')
  async basicPage(@Body() params: { url: string }): Promise<{ html: string }> {
    const page = await this.browser.newPage();
    await page.goto(params.url);

    return { html: await page.content() };
  }

  @Get('stealth-check')
  async stealthCheck(): Promise<boolean> {
    const page = await this.browser.newPage();
    await page.goto('https://arh.antoinevastel.com/bots/areyouheadless');
    return (await page.content()).includes('You are not Chrome headless');
  }

  @Get('is-incognito')
  async isIncognito(): Promise<boolean> {
    return this.browser.browserContexts().reduce((acc, context) => acc || context.isIncognito(), true);
  }

  @Get('test-page')
  async testPage(): Promise<boolean> {
    await this.dummyPage.goto('https://arh.antoinevastel.com/bots/areyouheadless');
    return (await this.dummyPage.content()).includes('You are not Chrome headless');
  }
}
