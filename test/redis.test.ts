import compile from 'node:child_process';
import path from 'node:path';

import { mm, type MockApplication } from '@eggjs/mock';
import snapshot from 'snap-shot-it';

describe('test/redis.test.js', () => {
  describe('default config', () => {
    let app: MockApplication;
    before(async () => {
      app = mm.app({
        baseDir: 'apps/redisapp-default',
      });
      await app.ready();
    });
    after(() => app.close());
    afterEach(mm.restore);

    it('should make default config stable', () => {
      snapshot(app.config.redis);
    });

    it('should query', () => {
      return app.httpRequest().get('/').expect(200).expect('bar');
    });
  });

  describe('single client', () => {
    let app: MockApplication;
    before(async () => {
      app = mm.app({
        baseDir: 'apps/redisapp',
      });
      await app.ready();
    });
    after(() => app.close());
    afterEach(mm.restore);

    it('should query', () => {
      return app.httpRequest().get('/').expect(200).expect('bar');
    });
  });

  describe('weak dependent', () => {
    let app: MockApplication;
    before(async () => {
      app = mm.app({
        baseDir: 'apps/redisapp-weakdependent',
      });
      await app.ready();
    });
    after(() => app.close());
    afterEach(mm.restore);

    it('should query', () => {
      return app.httpRequest().get('/').expect(200).expect('bar');
    });
  });

  describe('single client supportTimeCommand = false', () => {
    let app: MockApplication;
    before(async () => {
      app = mm.app({
        baseDir: 'apps/redisapp-supportTimeCommand-false',
      });
      await app.ready();
    });
    after(() => app.close());
    afterEach(mm.restore);

    it('should query', () => {
      return app.httpRequest().get('/').expect(200).expect('bar');
    });
  });

  describe('single client with customize ioredis', () => {
    let app: MockApplication;
    before(async () => {
      app = mm.app({
        baseDir: 'apps/redisapp-customize',
      });
      await app.ready();
    });
    after(() => app.close());
    afterEach(mm.restore);

    it('should query', () => {
      return app.httpRequest().get('/').expect(200).expect('bar');
    });
  });

  describe('single client for ts', () => {
    let app: MockApplication;
    const destPath = path.resolve('./test/fixtures/apps/ts/redisapp-ts');
    const compilerPath = path.resolve('./node_modules/typescript/bin/tsc');

    before(async () => {
      // Add new dynamic compiler to compile from ts to js
      compile.execSync(`node ${compilerPath} -p ${destPath}`, {
        cwd: destPath,
        stdio: 'inherit',
      });
      app = mm.app({
        baseDir: 'apps/ts/redisapp-ts',
      });
      await app.ready();
    });
    after(async () => {
      // cleanup
      compile.execSync(`node ${compilerPath} --build --clean`);
      await app?.close();
    });

    it('should query', () => {
      return app.httpRequest().get('/').expect(200).expect('bar');
    });
  });

  describe('multi client for ts', () => {
    let app: MockApplication;
    const destPath = path.resolve('./test/fixtures/apps/ts-multi');
    const compilerPath = path.resolve('./node_modules/typescript/bin/tsc');
    before(async () => {
      // Add new dynamic compiler to compile from ts to js
      compile.execSync(`node ${compilerPath} -p ${destPath}`);
      app = mm.app({
        baseDir: 'apps/ts-multi/redisapp-ts',
      });
      await app.ready();
    });
    after(async () => {
      // cleanup
      compile.execSync(`node ${compilerPath} --build --clean`);
      await app?.close();
    });

    it('should query', () => {
      return app.httpRequest().get('/').expect(200).expect('bar');
    });
  });

  // TODO: make github action support sentinel
  describe.skip('redis sentinel', () => {
    let app: MockApplication;
    before(async () => {
      app = mm.app({
        baseDir: 'apps/redissentinelapp',
      });
      await app.ready();
    });
    after(() => app.close());
    afterEach(mm.restore);

    it('should query', () => {
      return app.httpRequest().get('/').expect(200).expect('bar');
    });
  });

  describe('await ready event', () => {
    let app: MockApplication;
    before(async () => {
      app = mm.app({
        baseDir: 'apps/redisapp-disable-offline-queue',
      });
      await app.ready();
    });
    after(() => app.close());
    afterEach(mm.restore);

    it('should query', () => {
      return app.httpRequest().get('/').expect(200).expect('bar');
    });
  });

  // TODO: make github action support redis start with path
  describe.skip('redis path', () => {
    let app: MockApplication;
    before(async () => {
      app = mm.app({
        baseDir: 'apps/redispathapp',
      });
      await app.ready();
    });
    after(() => app.close());
    afterEach(mm.restore);

    it('should query', () => {
      return app.httpRequest().get('/').expect(200).expect('bar');
    });
  });
});
