#!/usr/bin/env node
/*
 * Собирает docs/index.html для GitHub Pages из index.html.
 *
 * index.html — исходник для Artifact на claude.ai: там страницу оборачивают
 * в свой скелет, поэтому <!doctype>, <html>, <head> и <body> в нём нет.
 * GitHub Pages такой обвязки не добавляет, а без <meta viewport> мобильная
 * вёрстка не включается — этот скрипт достраивает недостающее.
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(root, "index.html"), "utf8");

const cut = src.indexOf("<style>");
if (cut < 0) throw new Error("В index.html не найден <style> — структура файла изменилась");

const headTags = src.slice(0, cut).trim();   // <title> и <link> на шрифты
const pageBody = src.slice(cut);             // стили, разметка, скрипт

const favicon =
  "data:image/svg+xml," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">🏦</text></svg>'
  );

const html = `<!doctype html>
<html lang="ru">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light dark">
<meta name="robots" content="noindex, nofollow">
<link rel="icon" href="${favicon}">
${headTags}
<style>body{margin:0}img{max-width:100%}</style>
</head>
<body>
${pageBody}
</body>
</html>
`;

mkdirSync(join(root, "docs"), { recursive: true });
writeFileSync(join(root, "docs", "index.html"), html, "utf8");
console.log("docs/index.html собран — " + Math.round(html.length / 1024) + " КБ");
