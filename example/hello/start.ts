import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { startEgg } from 'egg';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = await startEgg({
  baseDir: __dirname,
});

// oxlint-disable-next-line no-console
console.log(
  `Server started at http://localhost:${app.config.cluster.listen.port}`
);
