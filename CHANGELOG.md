# Changelog

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
