import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { getInstallEnvironment, getInstallInstructions } from '../lib/pwa-install.ts';

test('detects mobile browsers and avoids prompting on desktop', () => {
  assert.equal(getInstallEnvironment('Mozilla/5.0 (iPhone; CPU iPhone OS 18_0) AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1'), 'ios-safari');
  assert.equal(getInstallEnvironment('Mozilla/5.0 (iPhone; CPU iPhone OS 18_0) AppleWebKit/605.1.15 CriOS/128.0 Mobile/15E148 Safari/604.1'), 'ios-other');
  assert.equal(getInstallEnvironment('Mozilla/5.0 (Linux; Android 15; Pixel 9) AppleWebKit/537.36 Chrome/130 Mobile Safari/537.36'), 'android');
  assert.equal(getInstallEnvironment('Mozilla/5.0 (Linux; Android 15; Pixel 9; wv) AppleWebKit/537.36 Chrome/130 Mobile Safari/537.36'), 'android-in-app');
  assert.equal(getInstallEnvironment('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Safari/605.1', 'MacIntel', 5), 'ios-safari');
  assert.equal(getInstallEnvironment('Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/130 Safari/537.36'), 'other');
});

test('manual install instructions cover browser-specific paths', () => {
  assert.match(getInstallInstructions('ios-safari').join(' '), /Chia sẻ.*Màn hình chính/);
  assert.match(getInstallInstructions('ios-other')[0], /Safari/);
  assert.match(getInstallInstructions('android').join(' '), /Cài đặt ứng dụng/);
  assert.match(getInstallInstructions('android-in-app')[0], /Chrome/);
});

test('PWA manifest has correctly sized Android install icons', async () => {
  const manifest = JSON.parse(readFileSync(new URL('../public/manifest.webmanifest', import.meta.url), 'utf8'));
  assert.equal(manifest.display, 'standalone');
  for (const size of [192, 512]) {
    const icon = manifest.icons.find(item => item.sizes === `${size}x${size}`);
    assert.ok(icon, `Missing ${size}px icon`);
    const dimensions = await sharp(fileURLToPath(new URL(`../public${icon.src}`, import.meta.url))).metadata();
    assert.equal(dimensions.width, size);
    assert.equal(dimensions.height, size);
  }
});
