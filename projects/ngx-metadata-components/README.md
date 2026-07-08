# Release notes

## 0.2.3 — Resolver decoupling

### Summary

The metadata component is decoupled from the vocabulary/resolver logic. Instead
of receiving vocabularies and a vocabulary dictionary directly, the component now
takes a single `vocabularyProvider` that it queries on demand. The component can
also be bootstrapped as a web component.

### Breaking changes — component inputs

| Before (≤ 0.2.x)                            | After                |
| ------------------------------------------- | -------------------- |
| `profile`                                   | `profileData`        |
| `metadata`                                  | `metadataValues`     |
| `vocabularies` + `vocabulariesIdDictionary` | `vocabularyProvider` |

`(metadataChange)` is unchanged. The component selector remains `iqb-profile-form`.

Previously consumers pushed vocabularies and the dictionary into the component,
which stored them internally. The component now pulls them from the provider, so
consumers no longer pre-resolve or pass that data.

#### Angular component

Before:

```html
<iqb-profile-form
  [profile]="profile"
  [metadata]="metadata"
  [vocabularies]="vocabularies"
  [vocabulariesIdDictionary]="vocabulariesIdDictionary"
  (metadataChange)="onMetadataChange($event)">
</iqb-profile-form>
```

After:

```html
<iqb-profile-form
  [profileData]="profile"
  [metadataValues]="metadata"
  [vocabularyProvider]="metadataResolver"
  (metadataChange)="onMetadataChange($event)">
</iqb-profile-form>
```

#### Web component

Set the same inputs as properties on the `metadata-profile-form` element after
calling `bootstrapMetadataWebComponents()`. Profile and metadata are passed as
JSON strings:

```js
const form = document.getElementById('metadata-form');
form.profileData = JSON.stringify(profile);
form.metadataValues = JSON.stringify(metadata);
form.vocabularyProvider = metadataResolver;
form.addEventListener('metadataChange', e => onMetadataChange(e.detail));
```

### Providing vocabularies

`vocabularyProvider` must implement the `VocabularyProvider` interface, exported
from this package. The component calls two methods:

```ts
import { VocabularyProvider, Vocab, VocabularyEntry } from '@iqb/metadata-components';

interface VocabularyProvider {
  getVocabularies(): Vocab[];
  getVocabularyDictionary(): Record<string, VocabularyEntry>;
}
```

`MetadataResolver` from `@iqb/metadata-resolver` implements this interface, so in
most cases you pass a configured `MetadataResolver` instance directly:

```ts
const metadataResolver = new MetadataResolver({ cache: true });
await metadataResolver.loadVocabularies(profile);
// pass metadataResolver as [vocabularyProvider]
```

`Vocab` and `VocabularyEntry` are exported from this package, so a custom provider
can import the exact types it must return.

### Additional changes

- Spec migration: models now derive from `@iqbspecs/metadata-profile` and
  `@iqbspecs/metadata-values` instead of the legacy `@iqb/metadata` package.
- New `vocabInline` field type (`FormlyInlineComponent`) for vocabulary fields
  with `selectionMode: "IN_FORM"`.
- `@angular/forms` and `rxjs` are now declared as peer dependencies.
- Removed a broken `exports` entry from the package manifest.
```
