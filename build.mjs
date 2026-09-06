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

/* ── Дистрибутив для передачи третьим лицам ────────────────────────────────
 * Один самодостаточный файл: без внешних ссылок (работает в закрытом контуре
 * без интернета) и без личных данных владельца в значениях по умолчанию.
 * Условия продукта — ставка, срок, льготный период — остаются: это параметры
 * кредита, а не персональные данные. Конкретные суммы задаются в интерфейсе
 * или параметрами ссылки.
 */
const DIST_DEFAULTS = { amount: 100000, rate: 14.5, term: 300, grace: 60, pct: 0.75, fix: 10 };

// дата первого платежа — 26-е число следующего месяца, считается при открытии
const distCfg =
  'var cfg = {amount:' + DIST_DEFAULTS.amount + ', rate:' + DIST_DEFAULTS.rate +
  ', term:' + DIST_DEFAULTS.term + ', grace:' + DIST_DEFAULTS.grace +
  ', pct:' + DIST_DEFAULTS.pct + ', fix:' + DIST_DEFAULTS.fix +
  ', first:(function(){var d=new Date();d.setMonth(d.getMonth()+1);' +
  'return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-26";})()};';

let distBody = pageBody;

const cfgLine = /var cfg = \{amount:.*?\};/;
if (!cfgLine.test(distBody)) throw new Error("Не найдена строка с cfg — обнови build.mjs");
distBody = distBody.replace(cfgLine, distCfg);

// начальные значения полей: их всё равно перезаписывает JS, но пусть не мелькают чужие цифры
distBody = distBody
  .replace('id="f-amount" type="number" step="100" min="1" value="238000"',
           'id="f-amount" type="number" step="100" min="1" value="' + DIST_DEFAULTS.amount + '"')
  .replace('id="f-date" type="date" value="2026-09-26"', 'id="f-date" type="date"');

// шрифты не подгружаются извне — остаются системные из fallback-стеков
const distHead = headTags
  .split("\n")
  .filter((line) => !line.includes("fonts.googleapis.com") && !line.includes("fonts.gstatic.com"))
  .join("\n");

const dist = `<!doctype html>
<html lang="ru">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light dark">
<link rel="icon" href="${favicon}">
${distHead}
<style>body{margin:0}img{max-width:100%}</style>
</head>
<body>
${distBody}
</body>
</html>
`;

mkdirSync(join(root, "dist"), { recursive: true });
writeFileSync(join(root, "dist", "credit-calculator.html"), dist, "utf8");
console.log("dist/credit-calculator.html собран — " + Math.round(dist.length / 1024) + " КБ, без внешних ссылок");
