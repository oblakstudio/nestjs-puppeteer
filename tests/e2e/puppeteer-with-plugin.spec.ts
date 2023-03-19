import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { Server } from 'http';
import { AppWithPluginModule } from '../src/app-with-plugin.module';

describe('Puppeteer with Plugin', () => {
  let server: Server;
  let app: INestApplication;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      imports: [AppWithPluginModule],
    }).compile();

    app = module.createNestApplication();
    server = app.getHttpServer();
    await app.init();
  });

  it(`should pass the stealth check`, () => {
    return request(server)
      .get('/stealth-check')
      .expect(200, 'true');
  }, 30000);

  afterEach(async () => {
    await app.close();
  });
});
