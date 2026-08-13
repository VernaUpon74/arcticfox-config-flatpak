# Changelog

All notable deviations from the upstream `hobbyquaker/arcticfox-config` fork are
documented here. Inline `DEVIATION` comments in the source explain specific
implementation choices.

## Unreleased

### Architecture
- Reworked the Electron main/renderer process into a Rust/Tauri 2.x host with a
  bundled Node.js sidecar for HID communication.
- Packaged the application as a Flatpak (`org.onebuttfarting.af`) for Linux,
  including a bundled Node.js runtime and udev rules for unprivileged HID access.
- Sidecar uses the `node-hid` hidraw backend so the Flatpak sandbox can detect
  devices plugged in after the app starts.

### UI / UX
- Default dark-mode styling across the whole interface.
- Freedom-unit (°F) selection works correctly in both Regional and Profile
  sections.
- Autofire added as a multi-click / shortcut option.
- Added a "Lite" appearance mode for small displays.
- Removed redundant **Settings** entries from the Configuration dropdown and
  removed underlines from footer buttons.
- Device name field is editable and centered in the title row.
- Tab-content area now scales as a single centered block when the window is
  resized larger than the 536×596 design size; the header and footer stay fixed.
- Configuration dropdown now shows a single Photon icon arrow instead of a
  duplicated/missing glyph.

### Hardware / Connection
- Implemented explicit device auto-reconnect on unexpected disconnect.
- Device detection/reconnect works when the device is plugged in after startup.
- Bumped `supportedSettingsVersion` to 12 to match current firmware builds.

### Cleanup
- Removed unused `dev/` scripts and duplicate `src/afcfile.js`.
- Removed diagnostic logging and pruned dev dependencies from the Flatpak sidecar
  to reduce bundle size.

### Documentation
- Rewrote README with accurate Tauri/Flatpak install, build, and USB-permission
  instructions for `org.onebuttfarting.af`.
- Added Flatpak packaging credit to OneButtFarting.

## Source of deviations

Key files containing `DEVIATION` comments that explain why a change was made:

- `index.html`
- `src/renderer.js`
- `src/style.css`
- `src-tauri/src/lib.rs`
- `sidecar/hid-bridge.js`
- `sidecar/afcfile.js`
- `sidecar/patches/arcticfox+11.0.3.patch`
