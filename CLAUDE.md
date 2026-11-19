# Working notes for this project

## Who this is for

The owner of this project is **not a developer**. Write explanations in plain
language, avoid jargon without explaining it, and prefer approaches with no
build step and no tooling to install.

## Always hand over a standalone copy

**Standing instruction:** whenever work is finished or meaningfully updated,
package it as a zip and send it with `SendUserFile`, in addition to committing
and pushing it.

The owner wants to be able to save their own copy rather than depending on
GitHub to get at their files. Don't wait to be asked — do it as part of
delivering the work.

How:

```bash
cd /home/user/blank-app
zip -rq /path/to/scratchpad/deliver/<project>.zip funnels -x '*.DS_Store'
```

Then verify it before sending: unzip it somewhere separate and open a page from
the unzipped copy, to confirm the relative paths to `shared/` still resolve.

Name the zip after the project, not the repo (e.g. `reservoir-funnels.zip`).

## The funnels project

`funnels/` is plain HTML and CSS by design — no framework, no build. Pages are
previewed by double-clicking `index.html`.

- Shared across all funnels → `funnels/shared/` (brand tokens, logo, lead form)
- Belongs to one funnel → that funnel's own folder (`index.html` + `page.css`)

Keep that split. It's what makes the project editable by a non-developer.

The lead form's variable defaults live on `:root` in
`shared/forms/lead-form.css` so each page can restyle it from its own
`page.css`. Don't move them onto `.rpv-form` — that blocks the override.

The repo also contains an unrelated Streamlit starter (`streamlit_app.py`,
`pyproject.toml`, `uv.lock`). Leave it alone unless asked.
