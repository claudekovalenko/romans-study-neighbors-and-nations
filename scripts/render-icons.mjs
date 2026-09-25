#!/usr/bin/env node
// Renders icons/*.svg to the PNG sizes browsers and iOS need.
// Needs Playwright:  npx playwright@latest --version  (or a global install)
import { chromium } from 'playwright';
import { readFileSync, mkdirSync } from 'node:fs';

const jobs = [
  ['icons/icon.svg', 'icons/icon-192.png', 192],
  ['icons/icon.svg', 'icons/icon-512.png', 512],
  ['icons/icon-maskable.svg', 'icons/icon-maskable-512.png', 512],
  ['icons/icon-maskable.svg', 'icons/apple-touch-icon.png', 180],
  // Sources for the phone apps — `npx @capacitor/assets generate` turns
  // these into every size iOS and Android need.
  ['icons/icon-maskable.svg', 'assets/icon-only.png', 1024],
  ['icons/icon-foreground.svg', 'assets/icon-foreground.png', 1024],
  ['icons/icon-background.svg', 'assets/icon-background.png', 1024],
  ['icons/splash.svg', 'assets/splash.png', 2732],
  ['icons/splash-dark.svg', 'assets/splash-dark.png', 2732],
];
mkdirSync('assets', { recursive: true });

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
