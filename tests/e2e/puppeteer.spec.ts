import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { ApplicationModule } from '../src/app.module';
import { Server } from 'http';

describe('Puppeteer', () => {
  let server: Server;
  let app: INestApplication;
  process.env.PUPPETEER_DISABLE_HEADLESS_WARNING = 'true';

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      imports: [ApplicationModule],
    }).compile();

    app = module.createNestApplication();
    server = app.getHttpServer();
    await app.init();
  });

  it(`should get hello world`, () => {
    return request(server)
      .post('/basic-page' )
      .send({ url: `http://localhost:${app.getHttpServer().address().port}/` })
      .expect(201, {html: '<html><head></head><body>Hello World!</body></html>'});
  }, 30000);

  it(`should fail the stealth check`, () => {
    return request(server)
      .get('/stealth-check')
      .expect(200, 'false');
  }, 30000);

  it(`should should work with a feature page`, () => {
    return request(server)
      .get('/test-page')
      .expect(200, 'false');
  }, 30000);


  afterEach(async () => {
    await app.close();
  });
});
