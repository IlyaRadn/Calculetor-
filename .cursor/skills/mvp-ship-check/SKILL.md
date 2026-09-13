---
name: mvp-ship-check
description: Release-readiness audit for an MVP about to be demoed, launched, or sold. Walks the live code looking for what a buyer or first user hits before we do — missing empty and error states, behaviour on a phone, keyboard access, prefers-reduced-motion, weight and first paint, meta tags and favicon, forgotten secrets and personal data in defaults, dependency licences. Fixes nothing; produces a prioritised report with file:line references. Use before a demo, before publishing, before handing the repository over, and on "is this ready", "what's left before we sell", "ship check", "launch checklist", "release readiness".
license: MIT
---

# MVP Readiness

This skill reads and counts. It does not edit. The result is one report that
any other agent — or person — can work through item by item.

The split is deliberate: whether to fix something now or show it as-is is the
owner's call, not the finder's. A report that fixed itself takes that decision
away and buries the findings inside a diff.

## Procedure

### 1. Establish what is actually being sold

Read `PRODUCT.md` if it exists, otherwise `README.md`. Extract the primary
journey (what a person arrives to do), who the user is, and where this runs.
Without that, the audit degenerates into a generic linter.

**The primary journey is the unit of measurement.** A finding on that path
always outranks a finding in settings.

### 2. Walk the journey as a stranger

Find the screen or page where the primary journey starts and follow it to the
result. At every step, answer four questions:

- What is on screen while data loads?
- What is on screen when there is no data at all — first run, empty list, empty search?
- What is on screen when the request fails or the input is invalid?
- What is on screen after success — is it clear that it worked?

A missing answer to any of the four is a finding. This is the most common gap
between "works for the author" and "works for a stranger".

### 3. Work the checklist

Every item is either ✅ or a finding with an exact reference. Never mark ✅
without confirming it in the code: an unverified tick is worse than a skipped
one.

**Phone**
- Layout survives 375px wide; `body` does not scroll horizontally.
- Tap targets 44px and up; inputs at 16px font or larger, or iOS zooms the page on focus.
- `<meta name="viewport" content="width=device-width, initial-scale=1">` is present — without it mobile layout never engages at all.
- Notches accounted for: `env(safe-area-inset-*)` wherever the UI reaches the edges.

**Access**
- The whole primary journey works from the keyboard; focus is always visible (`:focus-visible`).
- Interactive elements have accessible names; unlabelled icons have `aria-label`.
- Text contrast 4.5:1, large text 3:1. Check both themes when there are two.
- State is never carried by colour alone: errors have text, selection has more than a tint.
- A `@media (prefers-reduced-motion: reduce)` block exists, and it also kills motion started from JavaScript.

**Motion**
- Nothing animates forever without a reason — it costs battery and attention.
- `transform` and `opacity` only; `width`, `height`, `top`, `left` in a transition is a finding.
- Interface transitions land in 120–300ms. For detail, see the `review-animations` skill.

**Weight and speed**
- Size of what actually ships: bundles, images, fonts.
- Fonts do not block paint: `display=swap` or a real local fallback stack.
- Images carry dimensions — otherwise the layout jumps as they load.
- No blocking third-party requests in the first paint.

**First impression and links**
- `<title>`, `<meta name="description">`, favicon, `og:title` / `og:description` / `og:image` — a link to the product has to unfurl into something meaningful in a messenger.
- `lang` on `<html>` matches the interface language.
- Indexing is a decision, not an accident: either a deliberate `noindex`, or the product is ready to be found.

**Clean for outside eyes**
- No personal data, real amounts, phone numbers, addresses or internal links in the code or in default values.
- No keys, tokens or passwords — not in source, not in history, not in a `.env` that slipped under version control.
- `.env.example` lists every variable needed to run and not one real value.
- The repository builds and runs from the README on a clean machine.

**Rights**
- Every dependency and vendored asset carries a licence compatible with selling the product.
- Fonts and images are licensed for commercial use.
- Licence files for third-party code sit next to it rather than having been dropped during the copy.

### 4. The report

```markdown
# Readiness: <name>

Primary journey: <one line>
Audited: <date>

## Blocks the demo
1. **<what>** — `path:line`
   What the person sees: <…>
   How it is fixed: <a sentence or two>

## Undermines the impression
...

## Do before selling
...

## Checked and sound
- <item> — <what confirmed it>
```

Three tiers, ordered by cost to the owner rather than by effort to fix:

- **Blocks the demo** — the person hits a dead end, sees an unexplained error, loses what they typed, or something leaks.
- **Undermines the impression** — it works but looks unfinished: no empty state, layout jumps, the link unfurls into nothing.
- **Do before selling** — harmless in a demo, unavoidable at handover: licences, docs, environment variables.

Within a tier, order by where they appear on the primary journey.

## What not to do

- Do not edit code. Found it, wrote it down. Fixing belongs to `/impeccable polish`, `/animate`, or a person.
- Do not tick ✅ from memory or from a filename. Only from code you read.
- Do not dress a preference up as a finding. Taste belongs to `design-taste-frontend` and `/impeccable critique`; this skill reports only what breaks or leaks.
- Do not rewrite the checklist for the project. An item that does not apply is marked as not applicable, with one line saying why.
