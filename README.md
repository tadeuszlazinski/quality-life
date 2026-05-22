# Quality life

Tiny tools for annoying moments.

Quality life is a free, offline-first desktop utility app built with Tauri, React, and TypeScript. It is designed as a lightweight local toolkit: no ads, no accounts, no telemetry, no paywalls, no subscriptions, and no locked tools.

## Run In Development

Install dependencies:

```bash
npm install
```

Run the web preview:

```bash
npm run dev
```

Run the desktop app with Tauri:

```bash
npm run tauri:dev
```

## Build The App

Build the React frontend:

```bash
npm run build
```

Build the production Tauri desktop app:

```bash
npm run tauri:build
```

If you are building updater-enabled release bundles, set the signing key first:

```bash
export TAURI_SIGNING_PRIVATE_KEY="$(cat ~/.tauri/quality-life.key)"
export TAURI_SIGNING_PRIVATE_KEY_PASSWORD=""
npm run tauri:build
```

Build platform-specific bundles:

```bash
npm run tauri:build:mac
npm run tauri:build:windows
npm run tauri:build:linux
```

Windows and Linux installers usually need to be built on their matching operating system or a dedicated CI runner. macOS builds create app/dmg artifacts on macOS. The Windows helper builds the NSIS installer format in this repo; MSI is not used here. The GitHub Windows workflow uses `--no-sign` so it can build a shareable installer without updater signing keys.

## Build On GitHub

You can build a Windows installer from GitHub Actions:

1. Push the repo to GitHub.
2. Open the `Actions` tab.
3. Run `Build Windows Installer`.
4. If you triggered the workflow from a tag like `v0.2.0`, GitHub will also publish a Release with a downloadable Windows installer.
5. If you just ran the workflow manually, download the `quality-life-windows-installer` artifact from the run.

To publish a real GitHub Release, create and push a tag:

```bash
git tag v0.2.0
git push origin v0.2.0
```

That tag pushes the release workflow and uploads the installer to the GitHub Releases page as `quality-life-windows-setup.exe`.

If you want updater-enabled signed bundles, add these repository secrets first and remove `--no-sign` from the workflow:

- `TAURI_SIGNING_PRIVATE_KEY`
- `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`

The private key secret must be the full updater private key text, not the public key. If the key is encrypted, the password secret must match exactly.

Build the publish-ready website bundle:

```bash
npm run web:build
```

If you want the published website to emit a real sitemap and point at real release URLs, set these environment variables first:

```bash
export QUALITY_LIFE_PUBLIC_URL="https://your-domain.example"
export VITE_QUALITY_LIFE_WEBSITE_URL="https://your-domain.example"
export VITE_QUALITY_LIFE_DOWNLOAD_URL="https://your-domain.example/download"
export VITE_QUALITY_LIFE_INSIGHT_DOWNLOAD_URL="https://your-domain.example/insight"
export VITE_QUALITY_LIFE_REPOSITORY_URL="https://github.com/your-org/quality-life"
export VITE_QUALITY_LIFE_PRIVACY_URL="https://your-domain.example/privacy"
export VITE_QUALITY_LIFE_SOURCE_URL="https://github.com/your-org/quality-life/tree/main/src"
npm run web:build
```

Release outputs are written under:

```text
src-tauri/target/release/bundle/
```

## Installer Support

The Tauri bundle config is enabled for downloadable desktop releases:

- macOS: `.app` and `.dmg`
- Windows: NSIS and MSI installer targets
- Linux: AppImage and Debian package targets

The app also includes Tauri updater support. Set the signed release feed URL in `Settings > Updates` before using `Check for updates`.

The app icon files live in `src-tauri/icons/` and include PNG, `.icns`, and `.ico` assets generated from the same Quality life icon.

## Project Structure

```text
src/
  components/        Shared UI building blocks
  context/           Settings and toast providers
  data/              Tool registry and category metadata
  hooks/             Reusable React hooks
  lib/               Local helpers, history, native bridges
  tools/             Individual tool implementations
  types/             TypeScript data contracts

src-tauri/
  capabilities/      Tauri permissions
  icons/             Release icon assets
  src/               Native Rust commands
  tauri.conf.json    Desktop app and bundling config
```

## Privacy And Free-Use Philosophy

Quality life is built to be trustworthy:

- Every core tool is free.
- There are no ads, paywalls, subscriptions, upgrade prompts, accounts, analytics, or telemetry.
- Settings, pinned tools, recent tools, notes, clipboard entries, shortcuts, and General History Search data are stored locally.
- The app has no backend requirement and core functionality is offline-first.
- Export/import settings is local and user-controlled.

## Website Publishing Notes

The public website is designed to be published from the same codebase:

- `npm run web:build` creates the publish-ready browser bundle.
- Download buttons can be configured through `VITE_QUALITY_LIFE_DOWNLOAD_URL` and `VITE_QUALITY_LIFE_INSIGHT_DOWNLOAD_URL`.
- The site manifest and robots file are generated for the published web build.
- Source maps are disabled and production assets are minified and hashed to make casual copying harder.
- The browser-delivered part of the app cannot be made completely impossible to copy; the open-source pieces stay intentionally visible in the Trust Center, while the shipped bundle is hardened as much as a web app reasonably can be.

## Release Checklist

Before sharing a build:

```bash
npm run build
npm run tauri:build
```

Then test the generated app from `src-tauri/target/release/bundle/`, confirm the main tools open, confirm the About and Privacy pages match the release version, and verify the updater feed URL if you plan to ship signed updates.
