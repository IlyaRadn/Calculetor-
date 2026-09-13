#!/usr/bin/env node
/*
 * Один набор скиллов на двух агентов.
 *
 * Claude Code читает только `.claude/skills/`. Cursor читает `.cursor/skills/`
 * как свою штатную папку, а `.claude/skills/` — лишь в режиме совместимости,
 * который в его документации помечен как legacy. Полагаться на legacy у
 * репозитория, который однажды уйдёт покупателю, не стоит, поэтому обе папки
 * держим настоящими: `.claude/skills/` — источник, `.cursor/skills/` — зеркало.
 *
 *   node scripts/sync-skills.mjs          привести зеркало в соответствие
 *   node scripts/sync-skills.mjs --check  только проверить (код возврата 1, если разошлось)
 *
 * Заодно проверяется то, чего требуют обе платформы: у каждого скилла есть
 * SKILL.md, в нём есть frontmatter с `name` и `description`, и `name` совпадает
 * с именем папки — иначе Cursor скилл не примет.
 */
import {
  readdirSync, readFileSync, writeFileSync, mkdirSync, rmSync,
  statSync, existsSync, chmodSync,
} from "node:fs";
import { join, relative, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const SOURCE = join(root, ".claude", "skills");
const MIRROR = join(root, ".cursor", "skills");

/*
 * Скиллы со своим установщиком. Impeccable раскладывает себя сам и подставляет
 * в текст SKILL.md пути той папки, куда ставится (`.claude/...` против
 * `.cursor/...`), так что копия из одной папки в другую была бы с чужими
 * путями. Обновляется он командой из docs, а не этим скриптом.
 */
const EXTERNAL = new Set(["impeccable"]);

const checkOnly = process.argv.includes("--check");
const problems = [];

function walk(dir, base = dir) {
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full, base));
    else if (entry.isFile()) out.push(relative(base, full));
  }
  return out.sort();
}

function skillNames(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .sort();
}

/* ── проверка самих скиллов ───────────────────────────────────────────────── */

function validate(name) {
  const skillMd = join(SOURCE, name, "SKILL.md");
  if (!existsSync(skillMd)) {
    problems.push(`${name}: нет SKILL.md`);
    return;
  }
  const text = readFileSync(skillMd, "utf8");
  if (!text.startsWith("---")) {
    problems.push(`${name}/SKILL.md: нет frontmatter — открывающие «---» должны быть первой строкой`);
    return;
  }
  const end = text.indexOf("\n---", 3);
  if (end < 0) {
    problems.push(`${name}/SKILL.md: frontmatter не закрыт`);
    return;
  }
  const front = text.slice(3, end);
  const field = (key) => {
    const m = front.match(new RegExp(`^${key}:[ \\t]*(.+)$`, "m"));
    return m ? m[1].trim().replace(/^["']|["']$/g, "") : null;
  };

  const declared = field("name");
  if (!declared) problems.push(`${name}/SKILL.md: нет поля name`);
  else if (declared !== name) {
    problems.push(
      `${name}/SKILL.md: name «${declared}» не совпадает с именем папки — Cursor требует совпадения`,
    );
  }
  if (!field("description")) problems.push(`${name}/SKILL.md: нет поля description`);
}

/* ── зеркало ──────────────────────────────────────────────────────────────── */

function mirror(name) {
  const from = join(SOURCE, name);
  const to = join(MIRROR, name);
  const want = walk(from);
  const have = existsSync(to) ? walk(to) : [];

  const diverged = [];

  for (const file of want) {
    const src = join(from, file);
    const dst = join(to, file);
    const bytes = readFileSync(src);
    if (!existsSync(dst) || !readFileSync(dst).equals(bytes)) {
      diverged.push(file);
      if (!checkOnly) {
        mkdirSync(dirname(dst), { recursive: true });
        writeFileSync(dst, bytes);
        chmodSync(dst, statSync(src).mode & 0o777);
      }
    }
  }

  for (const file of have) {
    if (want.includes(file)) continue;
    diverged.push(`${file} (лишний)`);
    if (!checkOnly) rmSync(join(to, file));
  }

  return diverged;
}

/* ── выполнение ───────────────────────────────────────────────────────────── */

if (!existsSync(SOURCE)) {
  console.error("Нет .claude/skills — синхронизировать нечего");
  process.exit(1);
}

const sourceSkills = skillNames(SOURCE).filter((n) => !EXTERNAL.has(n));
const mirrorSkills = skillNames(MIRROR).filter((n) => !EXTERNAL.has(n));

sourceSkills.forEach(validate);

let changed = 0;
for (const name of sourceSkills) {
  const diverged = mirror(name);
  if (diverged.length) {
    changed += diverged.length;
    console.log(`${checkOnly ? "разошлось" : "обновлено"}: ${name} — ${diverged.join(", ")}`);
  }
}

for (const name of mirrorSkills) {
  if (sourceSkills.includes(name)) continue;
  changed += 1;
  console.log(`${checkOnly ? "лишний в .cursor" : "удалён из .cursor"}: ${name}`);
  if (!checkOnly) rmSync(join(MIRROR, name), { recursive: true, force: true });
}

if (problems.length) {
  console.error("\nСкиллы не проходят проверку:");
  for (const p of problems) console.error("  " + p);
  process.exit(1);
}

if (checkOnly && changed) {
  console.error("\n.cursor/skills отстаёт от .claude/skills. Выполните: node scripts/sync-skills.mjs");
  process.exit(1);
}

const count = sourceSkills.length + skillNames(SOURCE).filter((n) => EXTERNAL.has(n)).length;
console.log(
  checkOnly
    ? `Скиллов: ${count}. Frontmatter в порядке, .cursor/skills совпадает с .claude/skills.`
    : `Скиллов: ${count}. Зеркало .cursor/skills приведено в соответствие${changed ? "" : " (изменений не было)"}.`,
);
