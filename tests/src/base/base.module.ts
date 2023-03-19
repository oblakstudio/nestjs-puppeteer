import { Module } from '@nestjs/common';
import { PuppeteerModule } from '../../../lib';
import { BaseController } from './base.controller';

@Module({
  imports: [PuppeteerModule.forFeature(['dummy'])],
  controllers:[BaseController],
})
export class BaseModule {}
