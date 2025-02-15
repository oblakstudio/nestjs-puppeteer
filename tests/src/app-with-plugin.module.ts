import { Module } from '@nestjs/common';
import { PuppeteerModule } from '../../lib';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { BaseModule } from './base/base.module';

@Module({
  imports: [
    PuppeteerModule.forRoot({
      plugins:[
        StealthPlugin()
      ],
      headless: true,
    }),
    BaseModule
  ]
})
export class AppWithPluginModule {}
