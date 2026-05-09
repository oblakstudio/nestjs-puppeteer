import { Body, Controller, Get, Post, Query } from '@nestjs/common';
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

  @Get('test-page')
  async testPage(@Query('url') url: string): Promise<boolean> {
    await this.dummyPage.goto(url);
    return (await this.dummyPage.content()).includes('Hello World!');
  }
}
