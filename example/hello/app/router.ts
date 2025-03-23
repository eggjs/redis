import type { Application } from 'egg';

export default (app: Application) => {
  const { router } = app;

  router.get('/', async ctx => {
    const redis = app.redis;
    await redis.set('foo', 'bar');
    const cacheValue = await redis.get('foo');
    ctx.body = cacheValue;
  });
};
