---
name: handoff-package
description: Assembles the handover dossier for a product — the due-diligence package a buyer or an incoming developer needs. Reconstructs from the code what normally lives only in the author's head: what it is built from, where it is deployed, which external services it depends on and what they cost per month, which environment variables are required, how to ship and how to roll back, what breaks first, what licences the dependencies carry. Writes docs/handoff.md. Use on "preparing to sell", "handing the project over", "what do we give the buyer", "handoff", "due diligence", and before a new person joins the repository.
license: MIT
---

# Handover Dossier

A product is sold together with the ability to keep developing it. The buyer
is not paying for the source — they can read that — but for answers to the
questions that otherwise take a week to work out: where is this deployed, who
owns the domain, what happens when the free tier runs out.

The output is `docs/handoff.md`. One file, because a dossier spread across
twelve files does not get read.

## The accuracy rule

**Every claim in the dossier is backed by a place in the repository.**

No backing means it goes into "Ask the owner", not into a plausible
invention. A dossier that is half fabricated is worse than none: the buyer
will believe it and plan around it.

Amounts, deadlines, arrangements with contractors, rights to the domain and to
the brand — these are almost always in that category. Only the owner knows.

## Gathering

Work the sources in this order; each one sharpens the last.

1. **`README.md`, `PRODUCT.md`, `docs/`** — what is already written down. Link to it rather than restating it.
2. **Manifests** (`package.json`, `Cargo.toml`, `requirements.txt`) — composition, scripts, runtime versions.
3. **`.env.example` plus every variable the code actually reads** — the full settings list. Cross-check the two: a variable the code reads that `.env.example` omits is a finding, and a common one.
4. **Docker, compose, Caddyfile, nginx.conf, workflows** — how this comes up and where it ships.
5. **External service clients in the code** — storage, mail, payments, analytics, maps, bots. Every such call means somebody else's account that will have to be transferred.
6. **`git log`** — pace of work, and the areas touched most often.

## Structure of docs/handoff.md

```markdown
# Handover: <name>

## What this is
Two or three paragraphs: what the product does, who uses it, where it stands
today. Honest about the stage: prototype, MVP in progress, product with users.

## Stack
Table: layer — choice — version — why.
The "why" is short and real; drop the row if the reason is unknown.

## Running it
Commands from `git clone` to an address open in a browser.
Runtime versions and external requirements (database, docker) stated outright.

## Environment variables
Table: name — required? — what it does — where the value comes from.
No real values appear in a dossier, ever.

## Where it is deployed
Addresses, providers, who owns the account.
How a new version ships. How to roll back.

## External services and cost
Table: service — what for — tier — roughly per month — whose account.
A separate line: what breaks if the account is not transferred.

## Data
Where it lives, how it is shaped, whether there are backups and how to restore.
What counts as personal data and what that means for the owner.

## What breaks first
An honest list of weak points with an estimate: when it gives, and into what.
The section the buyer reads first, and the one that sets their trust in
everything else.

## Licences
The product's own licence.
Dependencies and vendored assets with non-free or copyleft terms.
Fonts and images separately: their licences are the ones that most often turn
out to be incompatible with selling.

## Ask the owner
Questions the repository cannot answer.
```

## Costing

Work from published tiers, not from impressions. For every external service:
current tier, what it includes, and the threshold where billing starts.

Where the tier is unknown, write "free tier, threshold unverified" rather than
inventing a number.

## The "What breaks first" section

This is where a dossier separates from a sales page. Be specific:

> Uploads are written to the container's disk rather than to object storage.
> Recreating the container loses them. The threshold is the first migration,
> or the first deploy that rebuilds the image.

Not "there are risks around file storage".

Sources for these: TODO and FIXME comments, manual steps in the deploy, absent
backups, single points of failure, free tiers under critical services,
unmaintained dependencies, no tests on the primary journey.

A `mvp-ship-check` report, if one exists, is ready material for this section —
do not paste it whole; a reference and a summary are enough.

## Refreshing

A dossier goes stale faster than the code. On a second run, re-read the sources
and rewrite whatever has drifted, preserving anything the owner added by hand.
Items in "Ask the owner" that were answered move into their proper section and
leave the question list.
