import { loadEnv } from './scripts/env.mjs';

const { apiUrl } = loadEnv();
const { origin, pathname } = new URL(apiUrl);

export default {
  [pathname]: {
    target: origin,
    secure: true,
    changeOrigin: true,
  },
};
