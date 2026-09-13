---
name: motion-system
description: Establishes and maintains one motion system in a codebase — motion tokens: a duration scale, a set of curves, a prefers-reduced-motion rule — and migrates scattered transition values onto it. For a project that has accumulated arbitrary numbers (.12s here, 180ms there, ease-in-out everywhere) until the animations stopped reading as parts of one interface. Use on "unify the animations", "motion tokens", "get the transitions onto a scale", "design tokens for animation". Building a single animation is the animate skill; this one is the shared vocabulary behind all of them.
license: MIT
---

# Motion System

An interface reads as one piece when its transitions sound alike. Ten similar
transitions at 120, 140, 150, 180 and 200ms read as ten separate decisions,
even when each one is defensible on its own.

This skill establishes a shared vocabulary and migrates the code onto it. It
does not invent new animations — that is `animate` — and it does not judge
existing ones — that is `review-animations`.

## 1. Count first, decide second

Collect every duration and curve in the repository:

```bash
grep -rn "transition\|animation:" --include=*.css --include=*.tsx --include=*.ts --include=*.html .
```

Write down frequencies: how often each value appears. The scale is built from
what is already there, not from a clean-sheet sequence — otherwise migration
turns into rewriting every transition at once.

The median of the short transitions is usually the future "fast" step.

## 2. The scale

Four steps are enough for an interface of any size. More, and picking a step
becomes a matter of taste again.

| Token | Typically | For |
|---|---|---|
| `--dur-instant` | 60–100ms | Press feedback: colour, a slight shift. The person should not register a transition at all. |
| `--dur-fast` | 120–180ms | Hover, focus, a toggle, revealing something small. The main working step. |
| `--dur-base` | 200–280ms | A panel, a modal, a dropdown arriving. |
| `--dur-slow` | 320–450ms | A large area changing: a screen, a sheet, a drawer. Past this it becomes waiting. |

Three curves, each answering "where is this element coming from and going to":

| Token | Value | When |
|---|---|---|
| `--ease-out` | `cubic-bezier(.2, 0, 0, 1)` | Entrances, and anything arriving toward the user. Fast start, soft landing. |
| `--ease-in` | `cubic-bezier(.4, 0, 1, 1)` | Exits only. On an entrance it produces a sluggish, sticky start. |
| `--ease-in-out` | `cubic-bezier(.4, 0, .2, 1)` | Movement within the screen: the element was visible before and stays visible after. |

One rule covers most of the mistakes: **entering is `out`, leaving is `in`,
moving is `in-out`.**

Springs (Motion, Framer Motion) do not obey a duration scale and live beside
it: their whole point is being interruptible and velocity-aware. Record their
parameters, not a time. For detail, see `apple-design`.

## 3. Where they go

In the same file as the project's other tokens — next to colour and type, not
in a separate `motion.css`. Splitting tokens by kind is how half the files end
up forgotten.

```css
:root {
  --dur-instant: 80ms;
  --dur-fast:    140ms;
  --dur-base:    220ms;
  --dur-slow:    360ms;

  --ease-out:    cubic-bezier(.2, 0, 0, 1);
  --ease-in:     cubic-bezier(.4, 0, 1, 1);
  --ease-in-out: cubic-bezier(.4, 0, .2, 1);
}
```

On Tailwind 4, put them in `@theme` alongside the palette, so the values are
available both as utilities and as variables.

## 4. Migrating the code

One file at a time, starting with the one holding the most transitions. Change
both the duration and the curve in each: a scale duration with a default curve
leaves the job half done.

```css
/* before */
transition: background .12s, border-color .12s, transform .06s;

/* after */
transition:
  background   var(--dur-fast)    var(--ease-out),
  border-color var(--dur-fast)    var(--ease-out),
  transform    var(--dur-instant) var(--ease-out);
```

Three things not to lose along the way:

- **`transition: all` is always a finding.** It animates things nobody meant to animate, `height` on a content change included. Name the properties.
- **Animate `transform` and `opacity` only.** Everything else makes the browser recompute layout every frame. `width`, `height`, `top`, `left`, `margin` in a transition gets rewritten as a `transform`.
- **A value outside the scale may stay, but it carries a comment.** One line on why this one is 700ms. Without it the next person either "corrects" it onto the scale or copies it as the new standard.

## 5. Honouring the setting

One block for the whole project, and it is mandatory:

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

CSS only covers CSS. Motion from JavaScript — `element.animate()`,
`scrollIntoView({ behavior: 'smooth' })`, springs from a library — never sees
that block, and each one has to be handled in code:

```js
const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
element.scrollIntoView({ behavior: calm ? 'auto' : 'smooth' });
```

Verify with the real system setting, not by reading the code. On macOS:
Accessibility → Display → Reduce motion. In DevTools: the "Emulate
prefers-reduced-motion" command.

## 6. Write it into DESIGN.md

The scale, the curves and the "entering is out, leaving is in" rule go into
the project's `DESIGN.md`. That is where `/impeccable animate`, `animate` and
the next person read them from — otherwise the motion system survives exactly
until the next new component.
