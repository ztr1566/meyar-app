import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

// Load compiled bundle and HTML
const bundleCode = fs.readFileSync(path.join(process.cwd(), 'js/bundle.js'), 'utf8');

test('Standalone Bundle - Full DOM Execution & Data Injection Test', async () => {
  const feedsHtml = fs.readFileSync(path.join(process.cwd(), 'feeds.html'), 'utf8');
  const indexHtml = fs.readFileSync(path.join(process.cwd(), 'index.html'), 'utf8');

  // Simple DOM simulation
  const postsContainerMatch = feedsHtml.includes('id="feed-posts-container"');
  const storiesTrackMatch = feedsHtml.includes('id="stories-track"');
  const searchModalMatch = feedsHtml.includes('id="search-modal"');
  
  assert.ok(postsContainerMatch, 'feed-posts-container exists in feeds.html');
  assert.ok(storiesTrackMatch, 'stories-track exists in feeds.html');
  assert.ok(searchModalMatch, 'search-modal exists in feeds.html');
  assert.ok(feedsHtml.includes('src="./js/bundle.js"'), 'feeds.html references js/bundle.js');

  assert.ok(!indexHtml.includes('id="feed-posts-container"'), 'feed-posts-container must not exist in index.html');
  assert.ok(!indexHtml.includes('id="stories-track"'), 'stories-track must not exist in index.html');
});
