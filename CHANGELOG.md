# Changelog

## 1.14.0 — 2026-08-13

### Added
- Hover tooltips on every labeled settings row; specific vape-function descriptions are shown where `Tooltips.*` i18n keys exist.
- Higher `z-index` on `<select>` elements and the Configuration dropdown so dropdowns layer above surrounding content.

### Changed
- Reworked window scaling so content anchors to the top-left and the footer no longer gets overlapped on resize.
- Bumped app version to 1.14.0 across Tauri, frontend, sidecar, and Flatpak metadata.

### Security
- `highcharts`: 6.1.0 → 9.0.0 (fixes high-severity XSS advisories).
- `xml2js`: 0.4.17 → 0.6.2 (fixes prototype pollution).
- Replaced the unmaintained `put` buffer-builder (used by `arcticfox`) with a local zero-initialized implementation (`sidecar/put-replacement/`) to avoid sensitive-data exposure from uninitialized `Buffer` allocations.
