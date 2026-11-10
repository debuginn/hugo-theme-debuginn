# Changelog

## v1.5.3

### Fixed
- Align the service heading and carousel with Plural's responsive desktop inset instead of a fixed 176px offset. Both begin at 96px on a 1280px viewport, 176px at 1440px, and 416px at 1920px; phone alignment remains 22px.

### Verification
- COM/CN Hugo builds and Chromium desktop/phone geometry checked. Native Safari and physical devices were not tested.

## v1.5.2

### Added
- Add the service page before the social ending, with four swipeable cards, matching detail dialogs, and a service navigation item on both COM and CN.

### Fixed
- Match Plural's rendered card geometry: border-box sizing and a 1.53:1 ratio on desktop and phone.
- Preserve the carousel's leading inset when scroll snapping so the first card does not slide flush to the viewport edge.

### Verification
- COM/CN Hugo builds and Chromium desktop/phone card dimensions checked against Plural. Native Safari and physical-device rendering are not covered by these checks.

## v1.5.1

### Removed
- Stop publishing the unused standalone `static/cover.css`; its active Bootstrap Cover-derived layout rules remain in `assets/css/main.css`.

### Verification
- COM/CN Hugo builds retain their homepages and active styles while omitting `/static/cover.css` from generated output.

## v1.5.0

### Changed
- Redesign the social ending footer as two centered rows: a compact llms.txt pill and optional compliance links, followed by copyright and subdued builder/theme/version credits.
- Restore the existing sparkle icon in the 22px pill, with an expanded touch target and visible keyboard focus.
- Add optional `social.footer.complianceLinks` entries (`label`, `href`); omit empty entries and never render placeholder filing information.
- Fit credits within narrow mobile screens without changing the existing navigation or ending wordmark.

### Verification
- COM/CN Hugo builds and local Chromium desktop/mobile layouts verified. Native Safari and physical-device checks are not part of this release validation.

## v1.4.0

### Added
- Opt-in iPhone Safari full-bleed section backgrounds via `?safariBleed=1`.
- Continuous photo, gradient and animated-mosaic backgrounds, including the mounted Plural hero's decorative paint.

### Fixed
- Plural's mobile preview now budgets space for artwork, captions and the bottom dock.
- Remove the clipped outer-dock shadow seam on the pale Plural preview while retaining theme-appropriate inset highlights.
- Keep the social ending wordmark and credit above the mobile dock in both normal and Safari-preview modes.
- Reserve a separate footer band for social links and subscriber counts; reduce wordmark height on short mobile landscape screens.

### Release notes
- Retains the desktop-style mobile dock and explicit cross-browser section navigation from the commits since v1.3.1.
- Safari background extension remains opt-in; default browsing and standalone/PWA behavior are unchanged.
- Native browser-bar previews were exercised in iOS 27 Simulator Safari. Physical-device verification remains separate.
