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

Item centers (`x`, `y`) and widths are percentages of the section; rotation is
in degrees. Serve these assets from the site's static directory or an explicit
Hugo static mount. The optional `photoPool` is an array of image paths: each page
load shuffles the pool and assigns different photos before repeating any images.
Photo positions, widths, and rotation stay fixed, and logos keep their configured
images. Photos use a fixed 4:3 frame with cover cropping to keep tile heights fixed.
An absent or empty pool preserves the configured photos; a short pool fills the
remaining tiles with their configured fallback photos, using different images
where possible. If a selected photo fails to load, that tile retries its original
`items[].src` once. The image elements retain native lazy loading and decoding.
Photos and logos share a subtle circular depth-of-field
effect around the contact button. A nearby mouse or hovering pen brings them
into focus and gently enlarges them; moving away restores their original state.
The wordmark has a pointer-following dark iridescent
sheen, supports touch, and respects reduced motion. Attribution reuses
`site.footerCredit`, including the version supplied by the site build.

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
