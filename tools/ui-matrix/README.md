# Metadata Components UI Matrix

This runner exercises the demo app with deterministic profile, metadata, and vocabulary fixtures. CI runs the matrix against the built demo in Chrome.

## Coverage

- Viewports: desktop, tablet, mobile
- States: default examples, readonly, loading, error, empty
- Field paths: text, textarea, multilingual text, number, duration, boolean, vocabulary dialog, vocabulary inline
- Data cases: populated values, empty current profile, item-only metadata, invalid stored values, broken vocabulary, empty profile
- Interactions: text edit, number edit, duration edit, inline vocabulary click, dialog vocabulary confirm

## Run

Start the demo app first:

```sh
npx ng serve metadata-components --host 127.0.0.1 --port 4300
```

Run the matrix using the Chrome installation on your machine:

```sh
TARGET_URL=http://127.0.0.1:4300/ \
UI_MATRIX_OUTPUT_DIR=/tmp/metadata-ui-matrix \
UI_MATRIX_BROWSER_CHANNEL=chrome UI_MATRIX_HEADLESS=1 \
node tools/ui-matrix/metadata-ui-matrix.js
```

The runner writes:

- `ui-matrix-results.json`
- `ui-matrix-report.md`
- `screenshots/*.png`
