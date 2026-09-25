import { test } from 'node:test';
import assert from 'node:assert/strict';
import { videoEmbed, spotifyEmbed } from '../js/media.js';

test('YouTube links in their common shapes', () => {
  for (const url of [
    'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    'https://youtu.be/dQw4w9WgXcQ?si=abc',
    'https://www.youtube.com/shorts/dQw4w9WgXcQ',
    'https://www.youtube.com/live/dQw4w9WgXcQ',
    'https://m.youtube.com/watch?feature=share&v=dQw4w9WgXcQ',
  ]) {
    assert.equal(videoEmbed(url).src, 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ', url);
  }
});

test('Vimeo, direct files, and other links', () => {
  assert.equal(videoEmbed('https://vimeo.com/123456789').src, 'https://player.vimeo.com/video/123456789');
  assert.equal(videoEmbed('https://cdn.example.org/pastor.mp4').type, 'video');
  assert.equal(videoEmbed('https://example.org/watch').type, 'link');
  assert.equal(videoEmbed(''), null);
});

test('Spotify episode and show links', () => {
  assert.deepEqual(spotifyEmbed('https://open.spotify.com/episode/4rOoJ6Egrf8K2IrywzwOMk?si=x'), {
    kind: 'episode',
    src: 'https://open.spotify.com/embed/episode/4rOoJ6Egrf8K2IrywzwOMk',
  });
  assert.equal(spotifyEmbed('https://open.spotify.com/show/2MAi0BvDc6GTFvKFPXnkCL').kind, 'show');
  assert.equal(spotifyEmbed('https://example.org'), null);
});
