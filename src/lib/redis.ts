import assert from 'node:assert';
import { once } from 'node:events';

import { Redis } from 'ioredis';
import type { ILifecycleBoot, EggCore } from '@eggjs/core';
import type {
  RedisClusterOptions,
  RedisClientOptions,
} from '../config/config.default.js';

export class RedisBoot implements ILifecycleBoot {
  constructor(private readonly app: EggCore) {
    // empty
  }
  async didLoad() {
    const app = this.app;
    if (app.type === 'application' && app.config.redis.app) {
      app.addSingleton('redis', createClient);
    } else if (app.type === 'agent' && app.config.redis.agent) {
      app.addSingleton('redis', createClient);
    }
  }
}

let count = 0;
function createClient(
  options: RedisClusterOptions | RedisClientOptions,
  app: EggCore
) {
  const RedisClass = app.config.redis.Redis ?? Redis;
  let client;

  if ('cluster' in options && options.cluster === true) {
    const config = options as RedisClusterOptions;
    assert.ok(
      config.nodes && config.nodes.length > 0,
      '[@eggjs/redis] cluster nodes configuration is required when use cluster redis'
    );

    for (const client of config.nodes) {
      assert.ok(
        client.host && client.port,
        `[@eggjs/redis] 'host: ${client.host}', 'port: ${client.port}' are required on config`
      );
    }
    app.coreLogger.info('[@eggjs/redis] cluster connecting');
    client = new RedisClass.Cluster(config.nodes, config);
  } else if ('sentinels' in options && options.sentinels) {
    const config = options as RedisClientOptions;
    assert.ok(
      config.sentinels && config.sentinels.length > 0,
      '[@eggjs/redis] sentinels configuration is required when use redis sentinel'
    );

    for (const sentinel of config.sentinels) {
      assert.ok(
        sentinel.host && sentinel.port,
        `[@eggjs/redis] 'host: ${sentinel.host}', 'port: ${sentinel.port}' are required on config`
      );
    }

    const mask = config.password ? '***' : config.password;
    assert.ok(
      config.name && config.password !== undefined && config.db !== undefined,
      `[@eggjs/redis] 'name of master: ${config.name}', 'password: ${mask}', 'db: ${config.db}' are required on config`
    );

    app.coreLogger.info('[@eggjs/redis] sentinel connecting start');
    client = new RedisClass(config);
  } else {
    const config = options as RedisClientOptions;
    const mask = config.password ? '***' : config.password;
    assert.ok(
      (config.host &&
        config.port &&
        config.password !== undefined &&
        config.db !== undefined) ||
        config.path,
      `[@eggjs/redis] 'host: ${config.host}', 'port: ${config.port}', 'password: ${mask}', 'db: ${config.db}' or 'path:${config.path}' are required on config`
    );
    if (config.host) {
      app.coreLogger.info(
        '[@eggjs/redis] server connecting redis://:***@%s:%s/%s',
        config.host,
        config.port,
        config.db
      );
    } else {
      app.coreLogger.info(
        '[@eggjs/redis] server connecting %s',
        config.path || config
      );
    }

    client = new RedisClass(config);
  }

  client.on('connect', () => {
    app.coreLogger.info('[@eggjs/redis] client connect success');
  });
  client.on('error', err => {
    app.coreLogger.error('[@eggjs/redis] client error: %s', err);
    app.coreLogger.error(err);
  });

  const index = count++;
  app.lifecycle.registerBeforeStart(async () => {
    if ('weakDependent' in options && options.weakDependent) {
      app.coreLogger.info(
        `[@eggjs/redis] instance[${index}] is weak dependent and won't block app start`
      );
      client.once('ready', () => {
        app.coreLogger.info(`[@eggjs/redis] instance[${index}] status OK`);
      });
      return;
    }

    await Promise.race([once(client, 'ready'), once(client, 'error')]);
    app.coreLogger.info(
      `[@eggjs/redis] instance[${index}] status OK, client ready`
    );
  }, `[@eggjs/redis] instance[${index}] start check`);

  return client;
}
