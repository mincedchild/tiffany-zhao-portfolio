# Tiffany Zhao portfolio

## Everyday updates (no Cursor needed)

Drop files into the folders below, then publish. Layouts stay the same.

| I want to add… | Put the file in… |
|---|---|
| Homepage image | `public/art/home/` |
| Sketchbook page | `public/art/sketchbook/` |
| Tattoo flash | `public/art/tattoo/flash/` |
| Tattoo work photo | `public/art/tattoo/work/` |
| Image in an existing project | that project’s folder under `public/art/projects/` |

Then:

1. Save the files
2. Commit / push to GitHub (Netlify will rebuild), **or** run `npm run dev` to preview locally

Restart `npm run dev` after adding files so they show up.

### New project

1. Make a folder: `public/art/projects/my-new-series/`
2. Put images in it
3. Copy `public/art/projects/feeding-frenzy/project.json` into the new folder and edit the name, title, date, and description
4. Add the project name to `projectOrder` at the top of `content/site.json` if you want it in a specific nav spot (otherwise it appears at the end)

`layout` options in `project.json`:

- `column` — stacked images (good default for new work)
- `column-captions` — like Feeding Frenzy
- `book-grid` — like The Little Green Monster (2 columns)
- `centered-comic` — like Grand Central
- `recollection` — dates + quote images

### Optional titles / show on home

Existing pieces keep their titles in `content/site.json`. For a **new** file you usually do nothing.

To give a new image a title, or put a sketchbook/tattoo/project image on the homepage, add a block in `content/site.json` under `pieces`, copying an existing one. Use the file path as the key, for example `"/art/sketchbook/my-new-page.jpg"`.

Put its `id` in `homeOrder` if you want a specific spot on the homepage. New homepage folder images are added at the end automatically.

### About page

Replace `public/art/about/selfie.jpg` and `public/art/about/gob-bar.png`. Text for About is still in `components/scrapbook-gallery.tsx`.
