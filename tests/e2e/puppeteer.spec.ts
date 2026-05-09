import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { ApplicationModule } from '../src/app.module';
import { Server } from 'http';

describe('Puppeteer', () => {
  let server: Server;
  let app: INestApplication;
  let baseUrl: string;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      imports: [ApplicationModule],
    }).compile();

    app = module.createNestApplication();
    await app.listen(0);
    server = app.getHttpServer();
    const address = server.address();
    if (address === null || typeof address === 'string') {
      throw new Error('Test server is not listening on a TCP port');
    }
    baseUrl = `http://localhost:${address.port}/`;
  });

  it('serves a page through an ad-hoc Browser.newPage()', () => {
    return request(server)
      .post('/basic-page')
      .send({ url: baseUrl })
      .expect(201, { html: '<html><head></head><body>Hello World!</body></html>' });
  }, 30000);

  it('resolves a forFeature-registered Page via @InjectPage', () => {
    return request(server)
      .get('/test-page')
      .query({ url: baseUrl })
      .expect(200, 'true');
  }, 30000);

  afterEach(async () => {
    await app.close();
  });
});
