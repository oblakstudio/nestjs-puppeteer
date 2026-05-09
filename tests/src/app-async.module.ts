import { Module } from '@nestjs/common';
import {PuppeteerModuleOptions} from '../../lib/interfaces';
import { PuppeteerModule } from '../../lib';
import { BaseModule } from './base/base.module';


export function configurePuppeteer(): PuppeteerModuleOptions {
  return {
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
