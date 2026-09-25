#!/usr/bin/env node
// Renders icons/*.svg to the PNG sizes browsers and iOS need.
// Needs Playwright:  npx playwright@latest --version  (or a global install)
import { chromium } from 'playwright';
import { readFileSync } from 'node:fs';

const jobs = [
  ['icons/icon.svg', 'icons/icon-192.png', 192],
  ['icons/icon.svg', 'icons/icon-512.png', 512],
  ['icons/icon-maskable.svg', 'icons/icon-maskable-512.png', 512],
  ['icons/icon-maskable.svg', 'icons/apple-touch-icon.png', 180],
];

const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
const page = await browser.newPage();
for (const [src, out, size] of jobs) {
  await page.setViewportSize({ width: size, height: size });
  const svg = readFileSync(src, 'utf8');
  await page.setContent(`<style>html,body{margin:0;background:transparent}svg{width:${size}px;height:${size}px;display:block}</style>${svg}`);
  await page.screenshot({ path: out, omitBackground: true });
  console.log(`${out} (${size}px)`);
}
await browser.close();
