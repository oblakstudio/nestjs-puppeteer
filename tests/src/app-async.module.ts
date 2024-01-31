import { Module } from '@nestjs/common';
import {PuppeteerModuleOptions} from '../../lib/interfaces';
import { PuppeteerModule } from '../../lib';
import { BaseModule } from './base/base.module';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';


export function configurePuppeteer(): PuppeteerModuleOptions {
  return {
    plugins: [StealthPlugin()],
    headless: true,
  };
}

@Module({
  imports: [
    PuppeteerModule.forRootAsync({
      useFactory: configurePuppeteer,
    }),
    BaseModule,
  ],
})
export class AppAsyncModule {}
