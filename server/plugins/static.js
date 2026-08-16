import fastifyStatic from '@fastify/static';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const PROJECT_ROOT = fileURLToPath(new URL('../..', import.meta.url));

const OPTIONAL_ASSET_DIRECTORIES = new Set(['images', 'icons', 'fonts']);

function hasLiteralTraversal(pathName) {
  let decodedPath;
  try {
    decodedPath = decodeURIComponent(pathName.split('?', 1)[0]);
  } catch {
    return false;
  }

  return decodedPath.split('/').some(segment => segment === '.' || segment === '..');
}

function isAllowedPath(pathName) {
  let decodedPath;
  try {
    decodedPath = decodeURIComponent(pathName);
  } catch {
    return false;
  }

  if (decodedPath.includes('\0') || decodedPath.includes('\\')) return false;

  const relativePath = decodedPath.replace(/^\/+/, '');
  const segments = relativePath.split('/');
  if (segments.some(segment => !segment || segment === '.' || segment === '..' || segment.startsWith('.'))) {
    return false;
  }

  if (/^[^/]+\.html$/i.test(relativePath)) return true;
  if (relativePath === 'js/bundle.js' || relativePath === 'css/output.css') return true;
  return segments.length > 1 && OPTIONAL_ASSET_DIRECTORIES.has(segments[0]);
}

export async function staticPlugin(app, { root = PROJECT_ROOT } = {}) {
  app.addHook('onRequest', async (request, reply) => {
    if (hasLiteralTraversal(request.raw.url ?? '')) return reply.callNotFound();
  });

  await app.register(fastifyStatic, {
    root: path.resolve(root),
    index: false,
    allowedPath: isAllowedPath
  });

  app.get('/', (_request, reply) => reply.sendFile('index.html'));
}
