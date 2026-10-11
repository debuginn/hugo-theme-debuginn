# DebugInn Hugo Theme

DebugInn Hugo Theme is the open-source Hugo theme extraction of debuginn.com. The theme owns the fullscreen shell, shared sections, and extension slots. Business modules such as FlyBay stay in their own repositories and are mounted as Git submodules.

## Usage

Clone this theme into your Hugo site:

```bash
git submodule add git@github.com:debuginn/hugo-theme-debuginn.git themes/hugo-theme-debuginn
```

Configure Hugo:

```toml
theme = "hugo-theme-debuginn"
```

The theme reads page data from `data/site.json` first, then `params.debuginn`.

Optional `site.buildCredit` and `site.themeCredit` values are rendered inline
after the copyright text:

```json
"buildCredit": {
  "prefix": "使用 ", "label": "Hugo",
  "href": "https://gohugo.io/", "suffix": " 构建"
},
"themeCredit": {
  "prefix": "主题 ", "label": "DebugInn",
  "href": "https://github.com/debuginn/hugo-theme-debuginn",
  "byPrefix": " 由 ", "byLabel": "Meng小羽",
  "byHref": "https://blog.debuginn.com/about/", "suffix": " 设计"
}
```

Social links use white monochrome icons by default. Set `preserveIconColor: true`
on a link to keep its image's original colors, for example for a logo with a
solid background.

## Appearance

The circular control below the right navigation switches between light and dark
appearance. It follows the system until the visitor makes a choice, saves that
choice as `debuginn-theme`, and synchronizes it between tabs. The initial
`html[data-theme]` value is applied before stylesheets load. On phones and compact
touch screens, only the section dots are shown; the desktop navigation and
appearance switch are hidden.

Each section owns its palette. Embedded modules use the resolved root attribute
without adding their own storage or theme controller. A section can set
`navAccentDark` to customize its selected navigation icon in dark mode.
Home keeps the original photograph treatment and derives text contrast from
image brightness. iAssets and Blog keep their dark palettes in either mode.
Home selects its random photograph while the page is parsed, using the matching
thumbnail until the full image loads. The deferred script reuses that selection;
without JavaScript, the first configured photograph remains available.
Set `navIcon` to `plural` or `sparkles` for three star points in the section
navigation. `ingot` remains available for a yuanbao outline.
Hugo server previews omit analytics and use a no-referrer policy for image hosts
that reject localhost referrers; static production builds keep their normal
image policy and configured analytics.

## Social Footer

To combine the social page and final signature, make the social section the last
entry in `sections` and enable its footer:

```json
"social": {
  "footer": { "enabled": true, "wordmark": "DEBUGINN" },
  "links": [
    { "label": "YouTube", "icon": "youtube", "href": "https://www.youtube.com/@debuginn", "followers": 6 }
  ]
}
```

Keep the site's existing `social.links` and append additional links as needed.
The original circular buttons, hover counts, QR popovers, and counter animation
are reused. Footer layout and colors are isolated in `social-ending.css`; the
existing button stylesheet is unchanged. The background still comes from the
photography pool, with a light or dark fade beneath the signature.

The single-line credit uses `site.footerCredit`, including the real release
version provided by the site build, and the current copyright year. Its text
fits the available width on phones. The large wordmark retains pointer and
touch-controlled iridescent color, resizes with the viewport, and respects
reduced motion. No contact entry or decorative logos are part of this footer.
When no separate Closing section is configured, old `#closing` bookmarks open
the final social section. Without `social.footer.enabled`, the original social
layout and global footer remain available.

## Closing Section

Add a separate final section without replacing the social section:

```json
{ "id": "closing", "type": "closing", "navIcon": "contact", "navLabel": "与我联系" }
```

Its content is configured independently:

```json
"closing": {
  "contactLabel": "与我联系",
  "contactHref": "mailto:hello@example.com",
  "logo": "/closing/logo.webp",
  "logoHref": "/",
  "wordmark": "DEBUGINN",
  "photoPool": ["/closing/photos/01.webp", "/closing/photos/02.webp"],
  "items": [
    { "type": "photo", "src": "/closing/photo.webp", "x": 18, "y": 15, "width": 15, "rotation": 8 },
    { "type": "logo", "src": "/closing/project.webp", "x": 70, "y": 17, "width": 6, "rotation": -8 }
  ]
}
```

To replace the standalone contact button with a central logo and up to four
contact links, add `contactMode: "orbit"` and a nonempty `contacts` array:

```json
"contactMode": "orbit",
"contactLabel": "联系我",
"contacts": [
  { "id": "email", "icon": "email", "label": "邮箱", "href": "mailto:hello@example.com" },
  { "id": "wechat", "icon": "https://example.com/wechat.svg", "label": "微信", "qrImage": "/closing/wechat-qr.jpg" },
  { "id": "telegram", "icon": "https://example.com/telegram.svg", "label": "Telegram", "href": "https://example.com/chat" },
  { "id": "discord", "icon": "discord", "label": "Discord", "href": "https://example.com/community" }
]
```

Contact icons use the same format as `social.links`; replace the example URLs
with your own icons and destinations. QR contacts open a native dialog, and can
also include an optional `href` below the QR image. The logo opens and closes
the links with interruptible spring motion when hovered or focused. One to four
links form a compact fan above the logo; a small transparent bridge keeps hover
active while moving to a link. Desktop logo clicks do not toggle or scale it;
touch uses tap to open or close. The closed state has no caption by default;
optional `closedLabel` and `touchLabel` values can supply one. Moving
outside the fan, clicking blank space or pressing Escape dismisses the links.
The logo sits on a white circular surface, with a small inner inset to give the
complete mark breathing room on desktop and touch screens.
Two blue and teal light arcs rotate in opposite directions around its edge at
different speeds while this section is visible. Hover strengthens the glow;
opening the contacts softens the outer arc for legibility. The halo does not
intercept pointer input; leaving the section pauses it, and reduced motion
keeps both arcs static.
Escape closes an open QR dialog first. Closing returns
keyboard focus, leaving the section collapses the links, and reduced motion
uses immediate state changes. If orbit mode is absent or contains no usable
contacts, the original contact button and footer logo remain available.

Item centers (`x`, `y`) and widths are percentages of the section; rotation is
in degrees. Serve these assets from the site's static directory or an explicit
Hugo static mount. The optional `photoPool` is an array of image paths: each page
load shuffles the pool and assigns a distinct photo to each visible tile.
Photo positions, widths, and rotation stay fixed, and logos keep their configured
images. Photos use a fixed 4:3 frame with cover cropping to keep tile heights fixed.
An absent or empty pool uses the distinct configured photos in their original
order; a short pool fills the remaining tiles from unused configured photos.
If a selected photo fails to load, that tile takes an unused, unfailed candidate
from the pool or configured defaults. Each source is attempted at most once.
When no distinct candidate remains, that tile is hidden rather than repeating a
photo. The image elements retain native lazy loading and decoding. Uniqueness
applies within the current page; refreshing may show photos from a previous visit.
Photos and logos stay sharp at every distance from the central logo. A nearby
mouse or hovering pen gently enlarges them; moving away restores their original size.
The wordmark has a pointer-following dark iridescent
sheen, supports touch, and respects reduced motion. Attribution reuses
`site.footerCredit`, including the version supplied by the site build.
The section follows the `light` or `dark` value of `html[data-theme]`. Photos and colored brand
logos retain their colors; set `monochrome: true` on a single-color logo item
when it should invert for contrast in dark mode.

CSS and JavaScript are loaded only when a closing section is configured, and
all presentation rules are scoped to that section.

## Extension Modules

A section can declare an external module:

```json
{ "id": "flybay", "type": "extension", "module": "flybay" }
```

The theme looks up `extensions.flybay` and renders the partial named by `partial`, defaulting to `debuginn/extensions/flybay.html`. FlyBay's `codex-hugo-adapter` branch owns the Hugo presentation adapter alongside the module's configuration and public assets.

## FlyBay Submodule

FlyBay is mounted as a pinned nested submodule. The relative URL keeps the
parent clone protocol, so both SSH and HTTPS checkouts work recursively:

```bash
git submodule update --init --recursive
```

The example site mounts FlyBay's Hugo adapter, configuration, and public assets:

```toml
[module]
  [[module.mounts]]
    source = "../extensions/flybay/hugo/layouts"
    target = "layouts"
  [[module.mounts]]
    source = "../extensions/flybay/hugo/assets"
    target = "assets"
  [[module.mounts]]
    source = "../extensions/flybay/public"
    target = "static/flybay"
  [[module.mounts]]
    source = "../extensions/flybay/hugo/static"
    target = "static"
  [[module.mounts]]
    source = "../extensions/flybay/config"
    target = "data/flybay"
```

Make Hugo integration changes on a dedicated FlyBay feature branch and run
`npm run build:flybay` before updating this theme's pinned FlyBay commit.

## Development

```bash
cd exampleSite
hugo server --themesDir ../.. --disableFastRender
```
