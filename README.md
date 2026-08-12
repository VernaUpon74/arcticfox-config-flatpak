# arcticfox-config

[![License: GPL v3](https://img.shields.io/badge/License-GPL%20v3-blue.svg)](http://www.gnu.org/licenses/gpl-3.0)

> Configuration Tool for Vape Battery Mods with Arcticfox Firmware.

This fork reworks the original Electron-based application as a [Tauri](https://tauri.app/) desktop app
and packages it as a Flatpak for Linux. It adds quality-of-life improvements such as a dark UI,
Autofire as a multi-click/shortcut option, device auto-reconnect, and a "Lite" appearance mode for small devices.


[Screenshot](https://i.ibb.co/WNty9HCc/Screenshot.png)

## Download / Install

### Linux (Flatpak)

A pre-built Flatpak bundle is available on the
[releases page](https://github.com/VernaUpon74/arcticfox-config-rework/releases).

#### Install from the `.flatpak` bundle

```bash
flatpak install --user arcticfox-config.flatpak
```

#### Install from a local Flatpak repository

```bash
flatpak remote-add --user --no-gpg-verify arcticfox-config-repo ./flatpak/repo
flatpak install --user arcticfox-config-repo org.hobbyquaker.arcticfox-config
```

#### Run

```bash
flatpak run org.hobbyquaker.arcticfox-config
```

#### USB permissions

The Flatpak manifest requests `--device=all`, but HID access also requires udev rules for
unprivileged users. Install the provided rules:

```bash
sudo cp flatpak/50-arcticfox-config.rules /etc/udev/rules.d/
sudo udevadm control --reload-rules
sudo udevadm trigger
```

Then unplug and reconnect your device.

### macOS

macOS builds are not currently produced by this fork. The original project provided a `.dmg` and
Homebrew formula; see [hobbyquaker/arcticfox-config](https://github.com/hobbyquaker/arcticfox-config)
for the upstream macOS instructions.

## Building from source

### Requirements

- Node.js 22 (LTS)
- Rust stable toolchain
- Flatpak Builder (for the Flatpak package)
- `org.gnome.Platform` runtime 49 and matching SDK
- `org.freedesktop.Sdk.Extension.node22`
- `org.freedesktop.Sdk.Extension.rust-stable`

### Local development

```bash
npm install
npm run tauri:dev
```

### Build a native release

```bash
npm install
npm run sidecar:build
npm run tauri:build -- --no-bundle
```

The binary is written to `src-tauri/target/release/arcticfox-config`.

### Build the Flatpak

```bash
cd flatpak
flatpak-builder --force-clean --repo=repo build-dir org.hobbyquaker.arcticfox-config.yml
flatpak build-bundle repo arcticfox-config.flatpak org.hobbyquaker.arcticfox-config
```

## Usage

Start the application and connect your Arcticfox device. The app will automatically detect the
device and download its configuration. Use the tabs to edit profiles, power curves, TFR tables,
and device settings, then click **Upload** to write the configuration back to the device.

## Project structure

- `src/` – Frontend source (HTML/CSS/JS, Vite build)
- `src-tauri/` – Tauri Rust host
- `sidecar/` – Node.js HID bridge run as a Tauri sidecar
- `flatpak/` – Flatpak manifest, desktop entry, appdata, and udev rules
- `public/` – Static assets (i18n, default config)

## Fork differences

Key deviations from the original `hobbyquaker/arcticfox-config` are documented inline with
`DEVIATION` comments in:

- `index.html`
- `src/renderer.js`
- `src-tauri/src/lib.rs`
- `sidecar/hid-bridge.js`
- `sidecar/afcfile.js`
- `sidecar/patches/arcticfox+11.0.3.patch`

Notable changes include:

- Tauri 2.x desktop shell replacing Electron
- Flatpak packaging with bundled Node.js sidecar for HID access
- Dark UI by default. Up Material Yours
- Autofire added to multi-click / shortcut dropdowns
- Device auto-reconnect on unexpected disconnect
- Lite mode support in Appearance settings

## Contributing

Clone the repo, run `npm install`, and use `npm run tauri:dev` for development.

## Related

- https://github.com/hobbyquaker/arcticfox-config – Original Electron application
- https://github.com/hobbyquaker/arcticfox – Node module that abstracts HID communication with Arcticfox firmware
- https://github.com/hobbyquaker/arcticfox-monitor – Device monitoring tool
- https://github.com/hobbyquaker/dna-monitor – DNA chipset configuration tool
- https://github.com/TBXin/NFirmwareEditor – NFE Team editor that this work is based on

## Credits

Based on the work of [NFE Team](https://nfeteam.org/) and [hobbyquaker](https://github.com/hobbyquaker/)

- https://github.com/maelstrom2001/ArcticFox
- https://github.com/TBXin/NFirmwareEditor
- https://github.com/hobbyquaker/


This software uses [Highcharts](http://www.highcharts.com/) which is free __only for non-commercial use__.

## Donations 

Accepting cryptocurrency donations for rework
- BTC bc1qpfq3c6hdflafccqmsl4v7ussvlw8pazpwez09m 
- XMR 85YdUQXSMTgTeySZCyJjh9QTnzevgCHtZA6dhmFYMZqtE529pUZ5K8ceEC2ysaV2o4CuMuYtoaYPYdJfHYGX7m1WMgyM53i

## License

GPLv3

Copyright (c) Sebastian Raff
