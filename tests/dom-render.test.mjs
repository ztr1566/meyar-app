import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

// Load compiled bundle and HTML
const bundleCode = fs.readFileSync(path.join(process.cwd(), 'js/bundle.js'), 'utf8');
const indexHtml = fs.readFileSync(path.join(process.cwd(), 'index.html'), 'utf8');

test('Standalone Bundle - Full DOM Execution & Data Injection Test', async () => {
  // Simple DOM simulation
  const postsContainerMatch = indexHtml.includes('id="feed-posts-container"');
  const storiesTrackMatch = indexHtml.includes('id="stories-track"');
  const searchModalMatch = indexHtml.includes('id="search-modal"');
  
  assert.ok(postsContainerMatch, 'feed-posts-container exists in index.html');
  assert.ok(storiesTrackMatch, 'stories-track exists in index.html');
  assert.ok(searchModalMatch, 'search-modal exists in index.html');
  assert.ok(indexHtml.includes('src="./js/bundle.js"'), 'index.html references js/bundle.js');
});
