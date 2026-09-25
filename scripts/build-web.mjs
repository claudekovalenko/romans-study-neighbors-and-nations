#!/usr/bin/env node
// Copies the web app into www/ — the folder Capacitor packages into the
// iPhone and Android apps (and that the website deploy publishes).
import { cpSync, rmSync, mkdirSync } from 'node:fs';

const FILES = ['index.html', 'manifest.webmanifest', 'sw.js', 'config.js', 'css', 'js', 'icons', 'series'];

rmSync('www', { recursive: true, force: true });
mkdirSync('www');
for (const f of FILES) cpSync(f, `www/${f}`, { recursive: true });
console.log(`Built www/ (${FILES.length} entries)`);
