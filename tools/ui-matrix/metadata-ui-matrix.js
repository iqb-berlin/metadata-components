const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const TARGET_URL = process.env.TARGET_URL || 'http://127.0.0.1:4300/';
const OUTPUT_DIR = process.env.UI_MATRIX_OUTPUT_DIR || path.resolve(process.cwd(), 'ui-matrix-output');
const SCREENSHOT_DIR = path.join(OUTPUT_DIR, 'screenshots');
const HEADLESS = process.env.UI_MATRIX_HEADLESS === '1';

const MATRIX_VOCAB_URL = 'assets/ui-matrix/vocab/';
const BROKEN_VOCAB_URL = 'assets/ui-matrix/broken-vocab/';

const viewports = [
  { id: 'desktop', width: 1440, height: 1000 },
  { id: 'tablet', width: 768, height: 1024 },
  { id: 'mobile', width: 390, height: 844 }
];

const matrixVocabulary = {
  id: MATRIX_VOCAB_URL,
  type: 'ConceptScheme',
  title: { de: 'UI Matrix Vocabulary' },
  hasTopConcept: [
    {
      id: 'ui-vocab-alpha',
      notation: ['A'],
      prefLabel: {
        de: 'Alpha Auswahl mit langem Titel',
        en: 'Alpha option with long title'
      },
      narrower: [
        {
          id: 'ui-vocab-alpha-child',
          notation: ['A1'],
          prefLabel: {
            de: 'Alpha Unterauswahl fuer Dialog',
            en: 'Alpha child for dialog'
          }
        }
      ]
    },
    {
      id: 'ui-vocab-beta',
      notation: ['B'],
      prefLabel: {
        de: 'Beta Inline Auswahl',
        en: 'Beta inline option'
      }
    },
    {
      id: 'ui-vocab-gamma',
      notation: ['C'],
      prefLabel: {
        de: 'Gamma zweiter Inline Wert',
        en: 'Gamma second inline value'
      }
    }
  ]
};

const allControlsProfile = {
  id: 'ui-matrix-all-controls',
  label: [{ lang: 'de', value: 'UI Matrix Profil' }],
  target: ['UNIT'],
  groups: [
    {
      label: [{ lang: 'de', value: 'Basisfelder' }],
      entries: [
        {
          id: 'text_single',
          label: [{ lang: 'de', value: 'Einzeiliger Text' }],
          type: 'TEXT',
          parameters: { format: 'SINGLE' }
        },
        {
          id: 'text_multiline',
          label: [{ lang: 'de', value: 'Mehrzeiliger Text mit langem Inhalt' }],
          type: 'TEXT',
          parameters: { format: 'MULTILINE' }
        },
        {
          id: 'text_multi_language',
          label: [{ lang: 'de', value: 'Mehrsprachiger Titel' }],
          type: 'TEXT',
          parameters: { format: 'SINGLE', textLanguages: ['de', 'en'] }
        },
        {
          id: 'number_plain',
          label: [{ lang: 'de', value: 'Normale Zahl' }],
          type: 'NUMBER',
          parameters: { minValue: 0, maxValue: 99, digits: 0 }
        },
        {
          id: 'duration_seconds',
          label: [{ lang: 'de', value: 'Dauer in Sekunden' }],
          type: 'NUMBER',
          parameters: { minValue: 0, maxValue: 7200, digits: 0, isPeriodSeconds: true }
        },
        {
          id: 'boolean_release',
          label: [{ lang: 'de', value: 'Freigabe mit langem booleschem Label' }],
          type: 'BOOLEAN',
          parameters: {
            trueLabel: [{ lang: 'de', value: 'freigegeben' }],
            falseLabel: [{ lang: 'de', value: 'nicht freigegeben' }]
          }
        }
      ]
    },
    {
      label: [{ lang: 'de', value: 'Vokabulare' }],
      entries: [
        {
          id: 'vocab_dialog_multi',
          label: [{ lang: 'de', value: 'Dialog-Vokabular mehrfach' }],
          type: 'VOCABULARY',
          parameters: {
            url: MATRIX_VOCAB_URL,
            allowMultipleValues: true,
            hideNumbering: false
          }
        },
        {
          id: 'vocab_dialog_single',
          label: [{ lang: 'de', value: 'Dialog-Vokabular einfach' }],
          type: 'VOCABULARY',
          parameters: {
            url: MATRIX_VOCAB_URL,
            allowMultipleValues: false,
            hideNumbering: true
          }
        },
        {
          id: 'vocab_inline_multi',
          label: [{ lang: 'de', value: 'Inline-Vokabular mehrfach' }],
          type: 'VOCABULARY',
          parameters: {
            url: MATRIX_VOCAB_URL,
            selectionMode: 'IN_FORM',
            allowMultipleValues: true,
            hideNumbering: false,
            maxLevel: 2
          }
        },
        {
          id: 'vocab_inline_single',
          label: [{ lang: 'de', value: 'Inline-Vokabular einfach' }],
          type: 'VOCABULARY',
          parameters: {
            url: MATRIX_VOCAB_URL,
            selectionMode: 'IN_FORM',
            allowMultipleValues: false,
            hideNumbering: true,
            maxLevel: 1
          }
        }
      ]
    }
  ]
};

const allControlsMetadata = {
  profiles: [
    {
      profileId: allControlsProfile.id,
      isCurrent: true,
      order: 0,
      entries: [
        {
          id: 'text_single',
          label: [{ lang: 'de', value: 'Einzeiliger Text' }],
          value: [{ lang: 'de', value: 'Gespeicherter Einzeiler' }]
        },
        {
          id: 'text_multiline',
          label: [{ lang: 'de', value: 'Mehrzeiliger Text mit langem Inhalt' }],
          value: [{
            lang: 'de',
            value: 'Erste Zeile\nZweite Zeile mit URL https://example.test/material und sehr langem Wort Donaudampfschifffahrtsgesellschaftskapitaen'
          }]
        },
        {
          id: 'text_multi_language',
          label: [{ lang: 'de', value: 'Mehrsprachiger Titel' }],
          value: [
            { lang: 'de', value: 'Deutscher Titel mit Umlauten ae oe ue und ss' },
            { lang: 'en', value: 'English title for the same metadata entry' }
          ]
        },
        {
          id: 'number_plain',
          label: [{ lang: 'de', value: 'Normale Zahl' }],
          value: { raw: '42', asText: [{ lang: 'de', value: '42' }] }
        },
        {
          id: 'duration_seconds',
          label: [{ lang: 'de', value: 'Dauer in Sekunden' }],
          value: { raw: '3671', asText: [{ lang: 'de', value: '61:11' }] }
        },
        {
          id: 'boolean_release',
          label: [{ lang: 'de', value: 'Freigabe' }],
          value: { raw: 'true', asText: [{ lang: 'de', value: 'freigegeben' }] }
        },
        {
          id: 'vocab_dialog_multi',
          label: [{ lang: 'de', value: 'Dialog-Vokabular mehrfach' }],
          value: [
            {
              id: 'ui-vocab-alpha-child',
              label: [{ lang: 'de', value: 'Alpha Unterauswahl fuer Dialog' }]
            }
          ]
        },
        {
          id: 'vocab_dialog_single',
          label: [{ lang: 'de', value: 'Dialog-Vokabular einfach' }],
          value: [
            {
              id: 'ui-vocab-beta',
              label: [{ lang: 'de', value: 'Beta Inline Auswahl' }]
            }
          ]
        },
        {
          id: 'vocab_inline_multi',
          label: [{ lang: 'de', value: 'Inline-Vokabular mehrfach' }],
          value: [
            {
              id: 'ui-vocab-beta',
              label: [{ lang: 'de', value: 'Beta Inline Auswahl' }]
            }
          ]
        },
        {
          id: 'vocab_inline_single',
          label: [{ lang: 'de', value: 'Inline-Vokabular einfach' }],
          value: [
            {
              id: 'ui-vocab-gamma',
              label: [{ lang: 'de', value: 'Gamma zweiter Inline Wert' }]
            }
          ]
        }
      ]
    }
  ],
  items: []
};

const emptyMetadata = {
  profiles: [
    {
      profileId: allControlsProfile.id,
      isCurrent: true,
      order: 0,
      entries: []
    }
  ],
  items: []
};

const itemOnlyMetadata = {
  profiles: [
    {
      profileId: allControlsProfile.id,
      isCurrent: true,
      order: 0,
      entries: []
    }
  ],
  items: [
    {
      id: 'item-01',
      profiles: [
        {
          profileId: 'item-profile',
          isCurrent: true,
          entries: [
            {
              id: 'item_text',
              label: [{ lang: 'de', value: 'Item Text' }],
              value: [{ lang: 'de', value: 'Item-only metadata must not hide the unit empty-state.' }]
            }
          ]
        }
      ]
    }
  ]
};

const invalidValuesMetadata = {
  profiles: [
    {
      profileId: allControlsProfile.id,
      isCurrent: true,
      order: 0,
      entries: [
        {
          id: 'text_single',
          label: [{ lang: 'de', value: 'Einzeiliger Text' }],
          value: { raw: '17', asText: [{ lang: 'de', value: 'falscher Typ' }] }
        },
        {
          id: 'boolean_release',
          label: [{ lang: 'de', value: 'Freigabe' }],
          value: [{ lang: 'de', value: 'kein Boolean' }]
        },
        {
          id: 'unknown_entry',
          label: [{ lang: 'de', value: 'Unbekannt' }],
          value: [{ lang: 'de', value: 'Soll ignoriert werden' }]
        }
      ]
    }
  ],
  items: []
};

const brokenVocabularyProfile = {
  id: 'ui-matrix-broken-vocab',
  label: [{ lang: 'de', value: 'UI Matrix defektes Vokabular' }],
  target: ['UNIT'],
  groups: [
    {
      label: [{ lang: 'de', value: 'Defektes Vokabular' }],
      entries: [
        {
          id: 'vocab_dialog_broken',
          label: [{ lang: 'de', value: 'Dialog-Vokabular mit fehlendem Provider' }],
          type: 'VOCABULARY',
          parameters: {
            url: BROKEN_VOCAB_URL,
            allowMultipleValues: true,
            hideNumbering: true
          }
        }
      ]
    }
  ]
};

const brokenVocabularyMetadata = {
  profiles: [
    {
      profileId: brokenVocabularyProfile.id,
      isCurrent: true,
      order: 0,
      entries: [
        {
          id: 'vocab_dialog_broken',
          label: [{ lang: 'de', value: 'Dialog-Vokabular mit fehlendem Provider' }],
          value: [
            {
              id: 'ui-vocab-missing',
              label: [{ lang: 'de', value: 'Gespeicherter Fallback-Wert' }]
            }
          ]
        }
      ]
    }
  ],
  items: []
};

const emptyProfile = {
  id: 'ui-matrix-empty-profile',
  label: [{ lang: 'de', value: 'UI Matrix leeres Profil' }],
  target: ['UNIT'],
  groups: [
    {
      label: [{ lang: 'de', value: 'Leere Gruppe' }],
      entries: []
    }
  ]
};

const emptyProfileMetadata = {
  profiles: [
    {
      profileId: emptyProfile.id,
      isCurrent: true,
      order: 0,
      entries: []
    }
  ],
  items: []
};

const routeFixtures = {
  'assets/ui-matrix/all-controls-profile.json': allControlsProfile,
  'assets/ui-matrix/all-controls-metadata.json': allControlsMetadata,
  'assets/ui-matrix/empty-metadata.json': emptyMetadata,
  'assets/ui-matrix/item-only-metadata.json': itemOnlyMetadata,
  'assets/ui-matrix/invalid-values-metadata.json': invalidValuesMetadata,
  'assets/ui-matrix/broken-vocab-profile.json': brokenVocabularyProfile,
  'assets/ui-matrix/broken-vocab-metadata.json': brokenVocabularyMetadata,
  'assets/ui-matrix/empty-profile.json': emptyProfile,
  'assets/ui-matrix/empty-profile-metadata.json': emptyProfileMetadata,
  'assets/ui-matrix/slow-profile.json': allControlsProfile,
  'assets/ui-matrix/slow-metadata.json': allControlsMetadata
};

const results = {
  targetUrl: TARGET_URL,
  startedAt: new Date().toISOString(),
  matrix: [],
  events: {
    consoleErrors: [],
    consoleWarnings: [],
    pageErrors: [],
    requestFailures: []
  }
};

function ensureOutputDirs() {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

function slug(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function screenshotPath(caseId, viewportId) {
  return path.join(SCREENSHOT_DIR, `${slug(caseId)}-${viewportId}.png`);
}

function reportCheck(caseResult, name, passed, details = '') {
  caseResult.checks.push({ name, passed, details });
}

async function routeJson(page, url, body, delay = 0) {
  await page.route(`**/${url}`, async route => {
    if (delay) await new Promise(resolve => setTimeout(resolve, delay));
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(body)
    });
  });
}

async function registerRoutes(page) {
  for (const [url, body] of Object.entries(routeFixtures)) {
    await routeJson(page, url, body, url.includes('/slow-') ? 1200 : 0);
  }

  await routeJson(page, 'assets/ui-matrix/vocab/', matrixVocabulary);
  await routeJson(page, 'assets/ui-matrix/vocab/index.json', matrixVocabulary);
  await page.route('**/w3id.org/**', route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify(matrixVocabulary)
  }));
  await page.route('**/vocabs.openeduhub.de/**', route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify(matrixVocabulary)
  }));
  await page.route('**/assets/ui-matrix/broken-vocab/**', route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ invalid: true })
  }));
}

async function gotoApp(page) {
  await page.goto(TARGET_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForSelector('input[placeholder*="profile.json"]', { timeout: 30000 });
}

async function fillLoadInputs(page, profileUrl, metadataUrl) {
  await page.locator('input[placeholder*="profile.json"]').fill(profileUrl);
  await page.locator('input[placeholder*="metadata.json"]').fill(metadataUrl);
}

async function clickLoad(page) {
  await page.locator('button').filter({ hasText: 'Load Data' }).first().click();
}

async function loadData(page, profileUrl, metadataUrl, profileId) {
  await fillLoadInputs(page, profileUrl, metadataUrl);
  await clickLoad(page);
  if (profileId) {
    await page.waitForSelector(`text=${profileId}`, { timeout: 30000 });
  }
  await page.waitForLoadState('domcontentloaded');
}

async function getPageSnapshot(page) {
  return page.evaluate(() => {
    const doc = document.documentElement;
    const body = document.body;
    const controls = Array.from(document.querySelectorAll('button, mat-chip-row'));
    const overflowingControls = controls
      .map((element) => {
        const rect = element.getBoundingClientRect();
        return {
          tag: element.tagName.toLowerCase(),
          text: (element.textContent || element.getAttribute('placeholder') || '').trim().slice(0, 80),
          scrollWidth: element.scrollWidth,
          clientWidth: element.clientWidth,
          width: rect.width
        };
      })
      .filter(element => element.clientWidth > 0 && element.scrollWidth > element.clientWidth + 10);

    const toggleOverlaps = Array.from(document.querySelectorAll('.iqb-toggle-field'))
      .map((field) => {
        const children = Array.from(field.children)
          .map(child => ({
            tag: child.tagName.toLowerCase(),
            text: (child.textContent || '').trim(),
            rect: child.getBoundingClientRect()
          }))
          .filter(child => child.rect.width > 0 && child.rect.height > 0);
        const overlaps = [];
        for (let i = 0; i < children.length; i += 1) {
          for (let j = i + 1; j < children.length; j += 1) {
            const a = children[i].rect;
            const b = children[j].rect;
            const intersects = a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
            if (intersects) {
              overlaps.push(`${children[i].tag}:${children[i].text} / ${children[j].tag}:${children[j].text}`);
            }
          }
        }
        return overlaps;
      })
      .flat();

    return {
      text: body.innerText,
      horizontalOverflow: doc.scrollWidth > doc.clientWidth + 1,
      viewportWidth: doc.clientWidth,
      scrollWidth: doc.scrollWidth,
      overflowingControls,
      toggleOverlaps
    };
  });
}

async function captureViewport(page, caseResult, caseId, viewport) {
  await page.setViewportSize({ width: viewport.width, height: viewport.height });
  await page.waitForTimeout(300);
  const snapshot = await getPageSnapshot(page);
  const file = screenshotPath(caseId, viewport.id);
  await page.screenshot({ path: file, fullPage: true });

  caseResult.screenshots.push({
    viewport: viewport.id,
    path: file
  });
  reportCheck(
    caseResult,
    `no horizontal overflow (${viewport.id})`,
    !snapshot.horizontalOverflow,
    `scrollWidth=${snapshot.scrollWidth}, viewportWidth=${snapshot.viewportWidth}`
  );
  reportCheck(
    caseResult,
    `no overflowing fixed controls (${viewport.id})`,
    snapshot.overflowingControls.length === 0,
    JSON.stringify(snapshot.overflowingControls)
  );
  reportCheck(
    caseResult,
    `toggle labels do not overlap (${viewport.id})`,
    snapshot.toggleOverlaps.length === 0,
    JSON.stringify(snapshot.toggleOverlaps)
  );
  return snapshot;
}

async function runCase(page, caseId, action) {
  const caseResult = {
    id: caseId,
    checks: [],
    screenshots: []
  };
  results.matrix.push(caseResult);

  try {
    await action(caseResult);
  } catch (error) {
    reportCheck(caseResult, 'case execution', false, error.stack || error.message);
  }

  return caseResult;
}

async function runDefaultExamples(page) {
  await runCase(page, 'default-examples', async (caseResult) => {
    await gotoApp(page);
    await page.waitForSelector('text=Profile Loaded:', { timeout: 30000 });

    for (const viewport of viewports) {
      const snapshot = await captureViewport(page, caseResult, 'default-examples', viewport);
      reportCheck(
        caseResult,
        `default profile status visible (${viewport.id})`,
        snapshot.text.includes('Profile Loaded:')
      );
    }
  });
}

async function runAllControls(page) {
  await runCase(page, 'all-controls', async (caseResult) => {
    await gotoApp(page);
    await loadData(
      page,
      'assets/ui-matrix/all-controls-profile.json',
      'assets/ui-matrix/all-controls-metadata.json',
      allControlsProfile.id
    );
    await page.waitForSelector('text=UI Matrix Vocabulary', { timeout: 30000 }).catch(() => undefined);

    for (const viewport of viewports) {
      const snapshot = await captureViewport(page, caseResult, 'all-controls', viewport);
      [
        'Einzeiliger Text',
        'Mehrzeiliger Text mit langem Inhalt',
        '(de) Mehrsprachiger Titel',
        '(en) Mehrsprachiger Titel',
        'Normale Zahl',
        'Dauer in Sekunden',
        'nicht freigegeben',
        'freigegeben',
        'Alpha Unterauswahl fuer Dialog',
        'Beta Inline Auswahl'
      ].forEach(text => {
        reportCheck(caseResult, `visible text: ${text} (${viewport.id})`, snapshot.text.includes(text));
      });
    }
  });
}

async function runReadonly(page) {
  await runCase(page, 'readonly-all-controls', async (caseResult) => {
    await gotoApp(page);
    await loadData(
      page,
      'assets/ui-matrix/all-controls-profile.json',
      'assets/ui-matrix/all-controls-metadata.json',
      allControlsProfile.id
    );
    await page.locator('button').filter({ hasText: 'Edit Mode - Click to Lock' }).click();
    await page.waitForSelector('text=Readonly Mode: ENABLED', { timeout: 10000 });

    const disabledState = await page.evaluate(() => ({
      disabledInputs: Array.from(document.querySelectorAll('input, textarea'))
        .filter(input => input.hasAttribute('disabled')).length,
      chipRemoveButtons: document.querySelectorAll('button[matchipremove], button[matChipRemove]').length,
      readonlyText: document.body.innerText.includes('Readonly Mode: ENABLED')
    }));

    reportCheck(caseResult, 'readonly status is visible', disabledState.readonlyText);
    reportCheck(caseResult, 'readonly disables form controls', disabledState.disabledInputs > 0,
      JSON.stringify(disabledState));

    for (const viewport of viewports) {
      await captureViewport(page, caseResult, 'readonly-all-controls', viewport);
    }
  });
}

async function runStates(page) {
  await runCase(page, 'loading-error-empty-states', async (caseResult) => {
    await gotoApp(page);
    await loadData(
      page,
      'assets/ui-matrix/all-controls-profile.json',
      'assets/ui-matrix/all-controls-metadata.json',
      allControlsProfile.id
    );

    await fillLoadInputs(page, 'assets/ui-matrix/all-controls-profile.json', 'assets/missing-matrix-metadata.json');
    await clickLoad(page);
    await page.waitForSelector('text=Failed to load data:', { timeout: 30000 });
    let snapshot = await captureViewport(page, caseResult, 'state-error', viewports[0]);
    reportCheck(caseResult, 'error clears previous data', !snapshot.text.includes('Gespeicherter Einzeiler'));

    await loadData(
      page,
      'assets/ui-matrix/all-controls-profile.json',
      'assets/ui-matrix/empty-metadata.json',
      allControlsProfile.id
    );
    snapshot = await captureViewport(page, caseResult, 'state-empty', viewports[0]);
    reportCheck(caseResult, 'empty state message visible', snapshot.text.includes('No metadata values found'));

    await fillLoadInputs(page, 'assets/ui-matrix/slow-profile.json', 'assets/ui-matrix/slow-metadata.json');
    await clickLoad(page);
    await page.waitForTimeout(200);
    snapshot = await captureViewport(page, caseResult, 'state-loading', viewports[0]);
    reportCheck(caseResult, 'loading clears previous data', !snapshot.text.includes('No metadata values found') &&
      !snapshot.text.includes('Profile Loaded:'));
    await page.waitForSelector(`text=${allControlsProfile.id}`, { timeout: 30000 });
  });
}

async function runEdgeData(page) {
  await runCase(page, 'data-edge-cases', async (caseResult) => {
    await gotoApp(page);

    await loadData(
      page,
      'assets/ui-matrix/all-controls-profile.json',
      'assets/ui-matrix/item-only-metadata.json',
      allControlsProfile.id
    );
    let snapshot = await captureViewport(page, caseResult, 'edge-item-only', viewports[0]);
    reportCheck(caseResult, 'item-only metadata keeps current profile empty state',
      snapshot.text.includes('No metadata values found'));

    await loadData(
      page,
      'assets/ui-matrix/all-controls-profile.json',
      'assets/ui-matrix/invalid-values-metadata.json',
      allControlsProfile.id
    );
    snapshot = await captureViewport(page, caseResult, 'edge-invalid-values', viewports[0]);
    reportCheck(caseResult, 'invalid values do not crash form', snapshot.text.includes(allControlsProfile.id));
    reportCheck(caseResult, 'unknown metadata entry is not rendered', !snapshot.text.includes('Soll ignoriert werden'));

    await loadData(
      page,
      'assets/ui-matrix/broken-vocab-profile.json',
      'assets/ui-matrix/broken-vocab-metadata.json',
      brokenVocabularyProfile.id
    );
    snapshot = await captureViewport(page, caseResult, 'edge-broken-vocab', viewports[0]);
    reportCheck(caseResult, 'broken vocabulary keeps saved fallback chip',
      snapshot.text.includes('Gespeicherter Fallback-Wert'));

    await loadData(
      page,
      'assets/ui-matrix/empty-profile.json',
      'assets/ui-matrix/empty-profile-metadata.json',
      emptyProfile.id
    );
    snapshot = await captureViewport(page, caseResult, 'edge-empty-profile', viewports[0]);
    reportCheck(caseResult, 'empty profile loads without page error', snapshot.text.includes(emptyProfile.id));
  });
}

async function runInteractions(page) {
  await runCase(page, 'basic-interactions', async (caseResult) => {
    await gotoApp(page);
    await loadData(
      page,
      'assets/ui-matrix/all-controls-profile.json',
      'assets/ui-matrix/all-controls-metadata.json',
      allControlsProfile.id
    );

    const form = page.locator('metadata-profile-form');
    const textField = form.locator('formly-field').filter({ hasText: 'Einzeiliger Text' }).first();
    const numberInputs = form.locator('input[type="number"]');

    const plainTextInput = textField.locator('input').first();
    const numberInput = numberInputs.nth(0);
    const durationMinutesInput = numberInputs.nth(1);
    const durationSecondsInput = numberInputs.nth(2);

    await plainTextInput.fill('Bearbeiteter Einzeiler');
    await numberInput.click();
    await numberInput.press(process.platform === 'darwin' ? 'Meta+A' : 'Control+A');
    await numberInput.pressSequentially('55');
    await numberInput.blur();
    await durationMinutesInput.click();
    await durationMinutesInput.press(process.platform === 'darwin' ? 'Meta+A' : 'Control+A');
    await durationMinutesInput.pressSequentially('12');
    await durationMinutesInput.blur();
    await durationSecondsInput.click();
    await durationSecondsInput.press(process.platform === 'darwin' ? 'Meta+A' : 'Control+A');
    await durationSecondsInput.pressSequentially('34');
    await durationSecondsInput.blur();
    for (const input of [numberInput, durationMinutesInput, durationSecondsInput]) {
      await input.dispatchEvent('input', { bubbles: true, composed: true });
      await input.dispatchEvent('change', { bubbles: true, composed: true });
    }
    await page.waitForTimeout(500);

    const inlineCheckboxes = form.locator('iqb-formly-inline mat-checkbox');
    if (await inlineCheckboxes.count() > 0) {
      await inlineCheckboxes.nth(1).click();
    }

    const metadataText = await page.locator('pre').innerText({ timeout: 30000 });
    const inputDiagnostics = await form.locator('input[type="number"]').evaluateAll(inputs => inputs
      .map((input, index) => ({
        index,
        id: input.id,
        name: input.name,
        value: input.value,
        disabled: input.disabled,
        fieldText: (input.closest('formly-field')?.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 120)
      })));
    const metadata = JSON.parse(metadataText);
    const entries = metadata.profiles?.[0]?.entries || [];
    const entryDetails = (id) => JSON.stringify(entries.find(entry => entry.id === id) || null);
    reportCheck(caseResult, 'text edit updates current metadata', metadataText.includes('Bearbeiteter Einzeiler'));
    reportCheck(caseResult, 'number edit updates current metadata', metadataText.includes('"raw": "55"'),
      `${entryDetails('number_plain')} inputs=${JSON.stringify(inputDiagnostics)}`);
    reportCheck(caseResult, 'duration edit updates current metadata', metadataText.includes('"raw": "754"'),
      `${entryDetails('duration_seconds')} inputs=${JSON.stringify(inputDiagnostics)}`);

    await form.locator('mat-chip-grid').first().click();
    await page.waitForSelector('mat-dialog-container', { timeout: 10000 });
    await page.locator('mat-dialog-container').getByText('Alpha Auswahl mit langem Titel').click();
    await page.locator('mat-dialog-container button').filter({ hasText: 'confirm' }).click();
    await page.waitForTimeout(500);
    const metadataAfterDialog = await page.locator('pre').innerText();
    reportCheck(caseResult, 'dialog vocabulary confirm updates metadata',
      metadataAfterDialog.includes('ui-vocab-alpha'));

    for (const viewport of viewports) {
      await captureViewport(page, caseResult, 'basic-interactions', viewport);
    }
  });
}

function summarizeResults() {
  const allChecks = results.matrix.flatMap(caseResult => caseResult.checks
    .map(check => ({ caseId: caseResult.id, ...check })));
  const failed = allChecks.filter(check => !check.passed);
  return {
    totalCases: results.matrix.length,
    totalChecks: allChecks.length,
    failedChecks: failed.length,
    failed
  };
}

function writeReports() {
  results.finishedAt = new Date().toISOString();
  results.summary = summarizeResults();

  fs.writeFileSync(path.join(OUTPUT_DIR, 'ui-matrix-results.json'), JSON.stringify(results, null, 2));

  const lines = [
    '# Systematic UI Matrix Report',
    '',
    `Target: ${TARGET_URL}`,
    `Started: ${results.startedAt}`,
    `Finished: ${results.finishedAt}`,
    '',
    '## Summary',
    '',
    `- Cases: ${results.summary.totalCases}`,
    `- Checks: ${results.summary.totalChecks}`,
    `- Failed checks: ${results.summary.failedChecks}`,
    '',
    '## Matrix Coverage',
    '',
    '- Viewports: desktop, tablet, mobile',
    '- States: default, readonly, loading, error, empty',
    '- Field paths: text, textarea, multilingual text, number, duration, boolean, vocabulary dialog, vocabulary inline',
    '- Data cases: populated, empty current profile, item-only metadata, invalid stored values, broken vocabulary, empty profile',
    '- Interactions: text edit, number edit, duration edit, inline vocabulary click, dialog vocabulary confirm',
    '',
    '## Case Results',
    ''
  ];

  results.matrix.forEach(caseResult => {
    lines.push(`### ${caseResult.id}`, '');
    caseResult.checks.forEach(check => {
      lines.push(`- ${check.passed ? 'PASS' : 'FAIL'} ${check.name}${check.details ? ` (${check.details})` : ''}`);
    });
    if (caseResult.screenshots.length) {
      lines.push('', 'Screenshots:');
      caseResult.screenshots.forEach(screenshot => {
        lines.push(`- ${screenshot.viewport}: ${path.relative(OUTPUT_DIR, screenshot.path)}`);
      });
    }
    lines.push('');
  });

  if (results.events.consoleErrors.length || results.events.pageErrors.length || results.events.requestFailures.length) {
    lines.push('## Browser Events', '');
    lines.push(`- Console errors: ${results.events.consoleErrors.length}`);
    lines.push(`- Page errors: ${results.events.pageErrors.length}`);
    lines.push(`- Request failures: ${results.events.requestFailures.length}`);
    lines.push('');
  }

  fs.writeFileSync(path.join(OUTPUT_DIR, 'ui-matrix-report.md'), `${lines.join('\n')}\n`);
}

(async () => {
  ensureOutputDirs();

  const browser = await chromium.launch({ headless: HEADLESS, slowMo: HEADLESS ? 0 : 40 });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const page = await context.newPage();

  page.on('console', msg => {
    if (msg.type() === 'error') {
      const text = msg.text();
      const isExpectedMissingMetadata = text.includes('missing-matrix-metadata.json') ||
        text.includes('Failed to load resource: the server responded with a status of 404');
      const isExpectedBrokenVocabulary = text.includes('Invalid structure: missing hasTopConcept');
      if (!isExpectedMissingMetadata && !isExpectedBrokenVocabulary) {
        results.events.consoleErrors.push(text);
      }
    }
    if (msg.type() === 'warning') results.events.consoleWarnings.push(msg.text());
  });
  page.on('pageerror', err => results.events.pageErrors.push(err.message));
  page.on('requestfailed', req => {
    const url = req.url();
    if (!url.includes('missing-matrix-metadata.json')) {
      results.events.requestFailures.push({
        url,
        failure: req.failure()?.errorText || ''
      });
    }
  });

  await registerRoutes(page);

  await runDefaultExamples(page);
  await runAllControls(page);
  await runReadonly(page);
  await runStates(page);
  await runEdgeData(page);
  await runInteractions(page);

  reportCheck(results.matrix[results.matrix.length - 1], 'no page errors', results.events.pageErrors.length === 0,
    JSON.stringify(results.events.pageErrors));
  reportCheck(results.matrix[results.matrix.length - 1], 'no unexpected console errors',
    results.events.consoleErrors.length === 0, JSON.stringify(results.events.consoleErrors));
  reportCheck(results.matrix[results.matrix.length - 1], 'no unexpected request failures',
    results.events.requestFailures.length === 0, JSON.stringify(results.events.requestFailures));

  await browser.close();
  writeReports();

  console.log(JSON.stringify(results.summary, null, 2));

  if (results.summary.failedChecks > 0) {
    process.exitCode = 1;
  }
})();
