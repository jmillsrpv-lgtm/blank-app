# Reservoir Property Ventures — Brand Sheet

Everything here is shared by all three funnels. Change it once, it changes everywhere.

---

## Colours

| Name | Hex | Where it's used |
|---|---|---|
| Ink | `#0A1F2B` | Body text, darkest backgrounds |
| Deep Water | `#0E3440` | Dark sections, the logo badge |
| Teal | `#14707D` | Links, key accents on light backgrounds |
| Bright Teal | `#26B0AE` | Highlights on dark backgrounds |
| Amber | `#E39A2E` | **Buttons / call-to-action.** The "click here" colour |
| Clay | `#C9552F` | Urgency only — deadlines, warnings |
| Sand | `#F3EDE3` | Warm light background |
| Paper | `#FBF8F3` | Lightest background (default page colour) |
| Slate | `#5C7079` | Small print, captions |

Paste these into GoHighLevel's brand settings so the funnels and your CRM match.

**Rule of thumb:** amber is reserved for things you want clicked. If everything is
amber, nothing is.

---

## Fonts

All three are free Google Fonts, loaded straight from the web — nothing to install.

| Role | Font | Used for |
|---|---|---|
| Display | **Fraunces** | Big headlines |
| Body | **Inter** | Paragraphs, buttons, forms, the logo wordmark |
| Tech | **Space Grotesk** | Numbers, labels, the TikTok funnel |

Every page already has this line in its `<head>` — copy it if you build a new page:

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400..700&family=Inter:wght@400..700&family=Space+Grotesk:wght@400..700&display=swap" rel="stylesheet">
```

---

## Logo

Three ripples over a waterline — a reservoir seen from the side.

| File | Use it for |
|---|---|
| `logo-mark.svg` | Just the badge. Social avatars, favicons, app icons |
| `logo-lockup-dark.svg` | Badge + name, for **light** backgrounds |
| `logo-lockup-light.svg` | Badge + name, for **dark** backgrounds |

Upload these to GoHighLevel, your email signature, business cards — anywhere
outside these funnel pages.

**Inside** the funnel pages the logo is written directly into the HTML so it can
pick up each page's colours. If you're building a new page, copy this block:

```html
<a class="rpv-logo" href="#">
  <svg class="rpv-logo__mark" viewBox="0 0 48 48" aria-hidden="true">
    <rect width="48" height="48" rx="11" fill="currentColor" opacity=".12"/>
    <g fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round">
      <path d="M10 31a14 14 0 0 1 28 0"/>
      <path d="M16.5 31a7.5 7.5 0 0 1 15 0" opacity=".6"/>
    </g>
    <path d="M9 37.5h30" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" opacity=".45"/>
  </svg>
  <span class="rpv-logo__text">
    <span class="rpv-logo__name">Reservoir</span>
    <span class="rpv-logo__sub">Property Ventures</span>
  </span>
</a>
```

**Clear space:** leave at least the height of the badge empty on all sides.
Don't stretch it, recolour it outside this palette, or add a drop shadow.

---

## Minimum sizes

- Logo badge: never smaller than 28px tall on screen.
- Body text: never smaller than 15px.
- Tap targets (buttons, links on phones): at least 44px tall.
