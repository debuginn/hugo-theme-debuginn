# hugo-theme-debuginn

A data-driven fullscreen personal homepage theme for Hugo, extracted from `debuginn/profile`.

## Features

- Fullscreen snap sections
- Data-driven section ordering
- Home background gallery with optional quote API
- Product/iAssets-style mosaic section
- Blog cards from cached feed data
- Social links with count-up badges
- FlyBay as an optional extension section
- Hugo Pipes for CSS and JavaScript assets

## Quick Start

~~~bash
git submodule add git@github.com:debuginn/hugo-theme-debuginn.git themes/hugo-theme-debuginn
hugo server -t hugo-theme-debuginn
~~~

Run the bundled example site:

~~~bash
cd exampleSite
hugo server --themesDir ../..
~~~

## Configuration

Create `data/site.json` in your Hugo site. The theme reads `site.Data.site` first and falls back to `params.debuginn`.

See `exampleSite/data/site.json` for a complete working example.

## FlyBay Extension

FlyBay is intentionally treated as an extension instead of theme core. Configure it under `extensions.flybay`.

~~~json
{
  "extensions": {
    "flybay": {
      "enabled": true,
      "mode": "embed",
      "href": "https://flybay.debuginn.com",
      "titleLines": ["一趟大湾区之行", "通过补贴报销往返交通"]
    }
  }
}
~~~

The current theme renders a lightweight section. A future FlyBay Hugo module can replace this partial without coupling the base theme to the FlyBay application code.

## Development

~~~bash
cd exampleSite
hugo --themesDir ../..
hugo server --themesDir ../..
~~~
