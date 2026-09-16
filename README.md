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
