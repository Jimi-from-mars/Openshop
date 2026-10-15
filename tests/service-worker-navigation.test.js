import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { expect, test } from 'vitest';

const worker = readFileSync('sw.js', 'utf8');
const scope = 'https://example.test/openshop/';

function cachedNavigation(entries) {
  const context = {
    URL, Request, Response, Set, console,
    self: { registration: { scope }, location: { href: scope, origin: new URL(scope).origin }, addEventListener() {} },
    caches: { open: async () => ({ match: async key => entries.get(key) }) }
  };
  return runInNewContext(worker + '\n cachedShellResponse;', context)(
    { url: scope, mode: 'navigate', redirect: 'manual' }, '0.31.0-r9', true
  );
}

test('removes redirect history from cached navigation responses without changing content or headers', async () => {
  const response = new Response('<html>editor</html>', {
    headers: { 'content-type': 'text/html', 'content-security-policy': "default-src 'self'" }
  });
  Object.defineProperty(response, 'redirected', { value: true });
  const result = await cachedNavigation(new Map([[scope + 'index.html', response]]));
  expect(result.redirected).toBe(false);
  expect(result.status).toBe(200);
  expect(result.headers.get('content-security-policy')).toBe("default-src 'self'");
  expect(await result.text()).toBe('<html>editor</html>');
});

test('keeps an ordinary cached response intact', async () => {
  const response = new Response('editor');
  expect(await cachedNavigation(new Map([[scope + 'index.html', response]]))).toBe(response);
});

test('also normalizes the directory fallback and preserves cache misses', async () => {
  const response = new Response('fallback');
  Object.defineProperty(response, 'redirected', { value: true });
  const result = await cachedNavigation(new Map([[scope, response]]));
  expect(result.redirected).toBe(false);
  expect(await result.text()).toBe('fallback');
  expect(await cachedNavigation(new Map())).toBeUndefined();
});
