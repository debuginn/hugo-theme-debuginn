# Changelog

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
