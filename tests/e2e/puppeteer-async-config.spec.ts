import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { Server } from 'http';
import { AppAsyncModule } from '../src/app-async.module';

describe('Puppeteer async config', () => {
  let server: Server;
  let app: INestApplication;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      imports: [AppAsyncModule],
    }).compile();

    app = module.createNestApplication();
    server = app.getHttpServer();
    await app.init();
  });

  it(`should get hello world`, async () => {
    return request(server)
      .post('/basic-page' )
      .send({ url: `http://localhost:${app.getHttpServer().address().port}/` })
      .expect(201, {html: '<html><head></head><body>Hello World!</body></html>'});
  }, 90000);

  it(`should work in icognito mode`, () => {
    return request(server)
      .get('/is-incognito')
      .expect(200, 'true');
  }, 90000);

  afterEach(async () => {
    await app.close();
  });
});
