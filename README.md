# Platinum Atlas — GTA VI trophy guide & tracker

An offline, open-source guide and tracker for the 55 PlayStation 5 trophies
of Grand Theft Auto VI: every trophy with its official name, description and
grade, a guide in this entry's own words that cites its sources, a roadmap
to the platinum in six stages, and every missable trophy flagged with the
moment it closes.

## What it does

- **Checklist** — tick a trophy when you earn it; progress is saved in the
  browser (localStorage) and survives a reload.
- **Export / import** — download your progress as a JSON file and import it
  back on any machine.
- **Filters** — by kind (story, missable, collectibles, activities,
  platinum), by grade, by earned / not yet earned, and by text search.
- **Spoiler setting** — hides the names and descriptions of story trophies
  until you earn them.
- **Roadmap to platinum** — six stages in the order to play them, built from
  the official descriptions.
- **Missables** — every trophy that can be missed, with the moment it closes.
- **Next up** — jumps to the next unearned trophy in roadmap order.
- **Honest guides** — where the official description does not pin a location
  or step down, the guide says so plainly instead of inventing one.

## Run it offline

```sh
node serve.ts
```

Then open http://localhost:8080 in desktop Chrome. The app loads only its
own files under `app/` and makes no network request at run time; source
links open only if you follow them.

## Sources

- The official trophy list, as listed by
  [Exophase](https://www.exophase.com/game/grand-theft-auto-vi-psn/trophies/)
  and [PSNProfiles](https://psnprofiles.com/trophies/43531-grand-theft-auto-vi)
  — names, descriptions and grades are shown exactly as PlayStation
  publishes them. Every guide is written in this entry's own words and cites
  its sources beside each trophy.

## Hand it in

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

That copies `app/` and `screenshots/` to `out/` and writes
`out/dossier.json` with the vendored make.fun library.

## Licence

MIT — see `LICENSE`. No Rockstar Games logo or official artwork is used.
