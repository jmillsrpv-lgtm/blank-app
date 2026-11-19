# Reservoir Property Ventures — Funnels

Three landing pages that share one set of brand assets and one lead-capture form.

Plain HTML and CSS. Nothing to install, nothing to build, no developer needed to
make changes. If you can edit a text file, you can edit these pages.

---

## How to look at a page

**Double-click `index.html` inside any funnel folder.** It opens in your browser.
That's it.

For example, open `foreclosure-help/index.html` and you'll see the foreclosure
page exactly as a visitor would.

Editing works the same way: change the text in `index.html`, save, then press
**refresh** in the browser. Your change is there.

> One thing to know: opened this way, the address bar says `file:///...`. Some
> browsers block the form from actually *sending* leads from a `file://` page.
> Everything else works fine, and once the pages are on a real web address the
> sending works too. If you want to test sending before then, see
> "Previewing like a real website" at the bottom.

---

## Where everything lives

```
funnels/
│
├── shared/                  ← used by ALL three pages. Change once, changes everywhere.
│   ├── brand/
│   │   ├── BRAND.md             the colours, fonts and logo rules, in plain English
│   │   ├── brand.css            the actual colours and fonts the pages read
│   │   ├── logo-mark.svg        just the badge — social avatars, favicons
│   │   ├── logo-lockup-dark.svg badge + name, for light backgrounds
│   │   └── logo-lockup-light.svg badge + name, for dark backgrounds
│   │
│   └── forms/
│       ├── GOHIGHLEVEL.md       how to connect the form to your CRM ← read this
│       ├── form-config.js       THE ONE FILE YOU EDIT to go live
│       ├── lead-form.html       the form's master copy, to paste into a new page
│       ├── lead-form.css        how the form looks
│       └── lead-form.js         how the form behaves (you shouldn't need to touch it)
│
├── foreclosure-help/        ← one funnel
│   ├── index.html               the page itself — words, headlines, the form
│   └── page.css                 how THIS page looks, and only this page
│
├── seller-data-capture/     ← same two files
│   ├── index.html
│   └── page.css
│
└── tiktok-marketing/        ← same two files
    ├── index.html
    └── page.css
```

### The rule that keeps this simple

- Something that should look the same on **every** funnel — a colour, the logo,
  the font, how the form behaves → it lives in **`shared/`**.
- Something that belongs to **one** funnel — its headline, its layout, its mood
  → it lives in that funnel's own folder.

So if you want to change the amber on every page, edit `shared/brand/brand.css`.
If you want to change only the TikTok page's headline, edit
`tiktok-marketing/index.html`.

---

## The three funnels

| Folder | Who it's for | How it looks |
|---|---|---|
| `foreclosure-help` | Homeowners behind on payments | Dark, calm, serious. A timeline showing options narrowing as the deadline nears |
| `seller-data-capture` | Owners curious what their place is worth | Light, like a surveyor's worksheet. Big plain numbers, pen-and-ink form |
| `tiktok-marketing` | People who just watched one of your videos | Loud, fast, dark. A phone playing the video, built for a thumb |

They're deliberately three different-looking pages. They share the logo, the
colours, the fonts and the form — so they're recognisably the same company —
but none of them looks like a stock template, and a visitor arriving from a
TikTok video doesn't land on something that feels like a bank.

---

## Connecting the form to GoHighLevel

Right now the form is in **preview mode**: it checks the answers and shows a
thank-you message, but nothing is sent anywhere, so you can click around safely.

To go live you paste one web address into one file.
**Full instructions: `shared/forms/GOHIGHLEVEL.md`.**

Doing it once connects all three funnels at the same time. Every lead arrives
tagged with which funnel it came from.

---

## Changing the words

Open the funnel's `index.html` and look for the plain English between the tags.
To change this headline:

```html
<h1 class="hero__title">
  You have more options left than
  <em>anyone has told you.</em>
</h1>
```

…just type over the words. Leave the `<h1 ...>` and `</h1>` parts alone — those
are the labels that tell the browser how to style it.

The same goes for the phone number `(555) 010-0199`, which appears in a few
places on each page. Search for it and replace it with your real one — including
in the `href="tel:+15550100199"` link, which is what makes it tappable on a phone.

---

## Putting the pages online

Upload the whole `funnels` folder, keeping its structure, to any web host —
or point GoHighLevel, Netlify, Vercel or your existing host at it. The pages
find each other using relative paths, so as long as the folders stay in the same
arrangement, everything keeps working.

Each funnel's web address ends up being the folder name, for example
`your-domain.com/foreclosure-help/`.

**Before you spend money sending traffic:** open each page on your own phone, and
send yourself one test lead through each form.

---

## Previewing like a real website

Useful when you want to test the form sending for real. On a Mac, open Terminal,
and on Windows open PowerShell, then:

```
cd path/to/funnels
python3 -m http.server 8000
```

(On Windows, type `python` instead of `python3`.)

Then visit `http://localhost:8000/foreclosure-help/` in your browser. Press
`Ctrl + C` in the terminal window when you're finished.

---

## Adding a fourth funnel later

1. Copy whichever existing funnel folder is closest to what you want.
2. Rename the copy.
3. In its `index.html`, change the hidden funnel field near the top of the form
   to the new folder's name:
   `<input type="hidden" name="funnel" value="your-new-funnel">`
4. Edit the words, and edit `page.css` for the look.

It picks up the brand and the form connection automatically.
