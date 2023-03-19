import { Module } from '@nestjs/common';
import {PuppeteerModule} from '../../lib';
import { BaseModule } from './base/base.module';
@Module({
  imports: [
    PuppeteerModule.forRoot(),
    BaseModule,
  ],
})
export class ApplicationModule {}
