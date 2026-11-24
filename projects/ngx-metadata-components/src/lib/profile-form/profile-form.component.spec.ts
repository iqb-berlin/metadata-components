import {
  ComponentFixture, TestBed, fakeAsync, tick
} from '@angular/core/testing';
import { FormlyModule } from '@ngx-formly/core';
import { FormlyMaterialModule } from '@ngx-formly/material';
import { ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { MDProfile, ProfileEntryParametersVocabulary } from '@iqbspecs/metadata-profile';
import { ProfileFormComponent } from './profile-form.component';
import { metadataFormlyConfig } from '../providers/metadata-formly.config';
import { VocabularyProvider } from '../models/vocabulary-provider.interface';
import { StoredVocabularyEntry, UnitMetadataValues } from '../models/metadata-values.interface';
import { VocabularyEntry } from '../models/vocabulary.class';

const profile = {
  id: 'p1',
  label: 'Test Profile',
  groups: [{
    label: 'Group 1',
    entries: [{
      id: 'field1',
      type: 'text',
      label: 'Field 1',
      parameters: null
    }]
  }]
} as unknown as MDProfile;

const storedMetadata: Partial<UnitMetadataValues> = {
  profiles: [{
    entries: [{
      id: 'field1',
      label: [{ lang: 'de', value: 'Field 1' }],
      value: [{ lang: 'de', value: 'Hello' }]
    }],
    profileId: 'p1',
    order: 0
  }]
};

const vocabularyProvider: VocabularyProvider = {
  getVocabularies: () => [{ url: 'v1', data: {} }] as unknown as ReturnType<VocabularyProvider['getVocabularies']>,
  getVocabularyDictionary: () => ({})
};

describe('ProfileFormComponent', () => {
  let component: ProfileFormComponent;
  let fixture: ComponentFixture<ProfileFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        ReactiveFormsModule,
        FormlyModule.forRoot(metadataFormlyConfig),
        FormlyMaterialModule,
        TranslateModule.forRoot()
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ProfileFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('vocabulary notation <-> annotation mapping', () => {
    // Spec-Feld 'annotation' = interne SKOS-notation (Nummerierung).
    interface ProfileFormInternals {
      profileItemKeys: Record<string, {
        label: string; type: string; parameters: ProfileEntryParametersVocabulary | null;
      }>;
      mapFormlyModelValueToMetadataValue(entry: [string, VocabularyEntry[]]): StoredVocabularyEntry[];
      mapMetaDataEntriesValueToFormlyModelValue(
        value: StoredVocabularyEntry[], entryId?: string
      ): VocabularyEntry[];
    }
    let internals: ProfileFormInternals;

    const vocabParams = (hideNumbering: boolean): ProfileEntryParametersVocabulary => (
      { hideNumbering } as unknown as ProfileEntryParametersVocabulary
    );
    const setVocabField = (hideNumbering = false): void => {
      internals.profileItemKeys = {
        vocabField: { label: 'Vocab', type: 'VOCABULARY', parameters: vocabParams(hideNumbering) }
      };
    };
    const mapToStored = (entry: VocabularyEntry): StoredVocabularyEntry[] => internals
      .mapFormlyModelValueToMetadataValue(['vocabField', [entry]]);
    const mapToModel = (stored: StoredVocabularyEntry[]): VocabularyEntry[] => internals
      .mapMetaDataEntriesValueToFormlyModelValue(stored, 'vocabField');

    beforeEach(() => {
      internals = component as unknown as ProfileFormInternals;
    });

    it('writes the internal notation into the spec annotation field on save', () => {
      setVocabField();
      const result = mapToStored({
        id: 'concept-1', name: '1.2 Foo', notation: ['1.2'], text: [{ lang: 'de', value: 'Foo' }]
      });
      expect(result).toEqual([{
        id: 'concept-1',
        label: [{ lang: 'de', value: 'Foo' }],
        annotation: [{ lang: 'de', value: '1.2' }]
      }]);
    });

    it('emits an empty annotation when the entry has no notation', () => {
      setVocabField();
      const result = mapToStored({
        id: 'concept-1', name: 'Foo', notation: [], text: [{ lang: 'de', value: 'Foo' }]
      });
      expect(result[0].annotation).toEqual([]);
    });

    it('resolves numbering from the dictionary and keeps text as the pure label on load', () => {
      setVocabField(false);
      spyOn(component.metadataService, 'vocabulariesIdDictionary').and.returnValue({
        'concept-1': {
          id: 'concept-1', name: 'Foo', notation: ['1.2'], text: []
        }
      });
      const result = mapToModel([{
        id: 'concept-1', label: [{ lang: 'de', value: 'Foo' }], annotation: [{ lang: 'de', value: '1.2' }]
      }]);
      expect(result[0].name).toBe('1.2 Foo');
      expect(result[0].notation).toEqual(['1.2']);
      expect(result[0].text).toEqual([{ lang: 'de', value: 'Foo' }]);
    });

    it('reconstructs numbering from annotation when no dictionary entry exists', () => {
      setVocabField(false);
      spyOn(component.metadataService, 'vocabulariesIdDictionary').and.returnValue({});
      const result = mapToModel([{
        id: 'concept-1', label: [{ lang: 'de', value: 'Foo' }], annotation: [{ lang: 'de', value: '1.2' }]
      }]);
      expect(result[0].name).toBe('1.2 Foo');
      expect(result[0].notation).toEqual(['1.2']);
    });

    it('omits the numbering from the display name when hideNumbering is true', () => {
      setVocabField(true);
      spyOn(component.metadataService, 'vocabulariesIdDictionary').and.returnValue({});
      const result = mapToModel([{
        id: 'concept-1', label: [{ lang: 'de', value: 'Foo' }], annotation: [{ lang: 'de', value: '1.2' }]
      }]);
      expect(result[0].name).toBe('Foo');
    });

    it('round-trips notation through save -> load without loss', () => {
      setVocabField(false);
      spyOn(component.metadataService, 'vocabulariesIdDictionary').and.returnValue({});
      const stored = mapToStored({
        id: 'concept-1', name: '1.2 Foo', notation: ['1.2'], text: [{ lang: 'de', value: 'Foo' }]
      });
      const reloaded = mapToModel(stored);
      expect(reloaded[0].notation).toEqual(['1.2']);
      expect(reloaded[0].name).toBe('1.2 Foo');
    });
  });

  const labels = {
    trueLabel: [{ lang: 'de', value: 'Freigegeben' }],
    falseLabel: [{ lang: 'de', value: 'Gesperrt' }]
  };
  [
    {
      active: true, parameters: null, initialText: 'true', toggledText: 'false'
    },
    {
      active: false, parameters: null, initialText: 'false', toggledText: 'true'
    },
    {
      active: true, parameters: labels, initialText: 'Freigegeben', toggledText: 'Gesperrt'
    }
  ].forEach(({
    active, parameters, initialText, toggledText
  }) => {
    it(`saves unit edits and a BOOLEAN switch from "${initialText}" to "${toggledText}"`, fakeAsync(() => {
      const unitProfile: MDProfile = {
        id: 'synthetic-unit',
        target: ['UNIT'],
        label: [{ lang: 'de', value: 'Aufgabe' }],
        groups: [{
          label: [],
          entries: [
            {
              id: 'note', label: [], type: 'TEXT', parameters: null
            },
            {
              id: 'active', label: [], type: 'BOOLEAN', parameters
            }
          ]
        }]
      };
      const booleanValue = { raw: String(active), asText: [{ lang: 'de', value: initialText }] };
      component.profileData = unitProfile;
      component.metadataValues = {
        profiles: [{
          profileId: unitProfile.id,
          order: 0,
          entries: [
            { id: 'note', label: [], value: [{ lang: 'de', value: 'Entwurf' }] },
            { id: 'active', label: [], value: booleanValue }
          ]
        }]
      };
      fixture.detectChanges();
      tick();

      const changes = jasmine.createSpy('metadataChange');
      component.metadataChange.subscribe(changes);
      const note: HTMLInputElement = fixture.nativeElement.querySelector('input[type="text"]');
      note.value = 'Überarbeitet';
      note.dispatchEvent(new Event('input', { bubbles: true }));
      tick();
      const afterTextEdit: UnitMetadataValues = changes.calls.mostRecent().args[0];
      expect(afterTextEdit.profiles?.[0].profileId).toBe(unitProfile.id);
      expect(afterTextEdit.profiles?.[0].entries).toEqual(jasmine.arrayWithExactContents([
        jasmine.objectContaining({ id: 'note', value: [{ lang: 'de', value: 'Überarbeitet' }] }),
        jasmine.objectContaining({ id: 'active', value: booleanValue })
      ]));

      const toggle: HTMLButtonElement = fixture.nativeElement.querySelector('[role="switch"]');
      toggle.click();
      tick();
      const saved: UnitMetadataValues = changes.calls.mostRecent().args[0];
      expect(saved.profiles?.[0].entries.find(entry => entry.id === 'active')?.value).toEqual({
        raw: String(!active), asText: [{ lang: 'de', value: toggledText }]
      });

      const reopened = TestBed.createComponent(ProfileFormComponent);
      reopened.componentInstance.profileData = unitProfile;
      reopened.componentInstance.metadataValues = saved;
      reopened.detectChanges();
      tick();
      expect(reopened.componentInstance.form().getRawValue()).toEqual({ note: 'Überarbeitet', active: !active });
    }));
  });

  it('serializes only the active profile fields when switching between unit and item', fakeAsync(() => {
    const makeProfile = (id: string, target: 'UNIT' | 'ITEM', field: string): MDProfile => ({
      id,
      label: [{ lang: 'de', value: id }],
      target: [target],
      groups: [{
        label: [],
        entries: [field, 'shared'].map(key => ({
          id: key,
          label: [{ lang: 'de', value: key }],
          type: 'TEXT',
          parameters: null
        }))
      }]
    });
    const unitProfile = makeProfile('unit', 'UNIT', 'unitField');
    const itemProfile = makeProfile('item', 'ITEM', 'itemField');
    const metadata = (profileId: string, values: Record<string, string>): Partial<UnitMetadataValues> => ({
      profiles: [{
        profileId,
        order: 0,
        entries: Object.entries(values).map(([id, value]) => ({
          id,
          label: [{ lang: 'de', value: id }],
          value: [{ lang: 'de', value }]
        }))
      }]
    });
    const showProfile = (nextProfile: MDProfile, values: Partial<UnitMetadataValues>) => {
      component.metadataValues = values;
      component.profileData = nextProfile;
      fixture.detectChanges();
      tick();
      fixture.detectChanges();
      tick();
    };
    const lastChange = jasmine.createSpy('metadataChange');
    component.metadataChange.subscribe(lastChange);
    component.vocabularyProvider = vocabularyProvider;

    showProfile(unitProfile, metadata('unit', { unitField: 'Unit', shared: 'Unit shared' }));
    component.onModelChange({ unitField: 'Changed Unit', shared: 'Unit shared' });
    const unitEdited = lastChange.calls.mostRecent().args[0] as Partial<UnitMetadataValues>;

    showProfile(itemProfile, metadata('item', { itemField: 'Item', shared: 'Item shared' }));
    expect(component.form().getRawValue()).toEqual({ itemField: 'Item', shared: 'Item shared' });
    component.onModelChange({ itemField: 'Changed Item', shared: 'Item shared', unitField: 'Changed Unit' });
    expect(lastChange.calls.mostRecent().args[0].profiles).toEqual(
      metadata('item', { itemField: 'Changed Item', shared: 'Item shared' }).profiles
    );

    showProfile(unitProfile, unitEdited);
    expect(component.form().getRawValue()).toEqual({ unitField: 'Changed Unit', shared: 'Unit shared' });
    component.onModelChange({ unitField: 'Changed again', shared: 'Unit shared', itemField: 'Changed Item' });
    expect(lastChange.calls.mostRecent().args[0].profiles).toEqual(
      metadata('unit', { unitField: 'Changed again', shared: 'Unit shared' }).profiles
    );
    tick();
  }));

  describe('load cycle stability (regression for the change-detection loop)', () => {
    const emissions: Partial<UnitMetadataValues>[] = [];

    beforeEach(fakeAsync(() => {
      emissions.length = 0;
      component.metadataChange.subscribe(value => emissions.push(value));
      component.vocabularyProvider = vocabularyProvider;
      component.profileData = profile;
      component.metadataValues = JSON.parse(JSON.stringify(storedMetadata));
      fixture.detectChanges();
      tick(100);
      fixture.detectChanges();
      tick(100);
    }));

    it('does not emit metadataChange when the form reports an unchanged model', fakeAsync(() => {
      const before = emissions.length;
      // simulate the formly model->form sync echoing the loaded values back,
      // as it does at check time outside the suppression window
      component.onModelChange({ field1: 'Hello' });
      tick(100);
      component.onModelChange({ field1: 'Hello' });
      tick(100);
      expect(emissions.length).toBe(before);
    }));

    it('still emits metadataChange for real value changes exactly once', fakeAsync(() => {
      const before = emissions.length;
      component.onModelChange({ field1: 'Changed' });
      tick(100);
      component.onModelChange({ field1: 'Changed' });
      tick(100);
      expect(emissions.length).toBe(before + 1);
    }));

    it('settles after load instead of emitting on every change detection cycle', fakeAsync(() => {
      const before = emissions.length;
      // repeated CD cycles must not produce further emissions
      // (previously each cycle re-set the model and re-fired the loop)
      Array.from({ length: 5 }).forEach(() => {
        fixture.detectChanges();
        tick(100);
      });
      expect(emissions.length).toBe(before);
    }));
  });

  // The form shows the profile in the host's language and saves names and yes/no texts in every language
  // the profile brings, so that another language reads them too (#36).
  it('shows the profile in the language of the host and saves its texts in every language', fakeAsync(() => {
    const de = (value: string) => ({ lang: 'de', value });
    const en = (value: string) => ({ lang: 'en', value });
    const unitProfile: MDProfile = {
      id: 'p30',
      target: ['UNIT'],
      label: [de('Aufgabe'), en('Unit')],
      groups: [{
        label: [de('Aufgabe'), en('Unit')],
        entries: [
          {
            id: 'note', label: [de('Notiz'), en('Note')], type: 'TEXT', parameters: null
          },
          {
            id: 'keyboard',
            label: [de('Tastatur'), en('Keyboard')],
            type: 'BOOLEAN',
            parameters: {
              trueLabel: [de('Tastatur eingeblendet'), en('On-screen keyboard')],
              falseLabel: [de('Computertastatur'), en('Computer keyboard')]
            }
          }
        ]
      }]
    };
    component.language = 'en';
    component.profileData = unitProfile;
    component.metadataValues = {
      profiles: [{
        profileId: 'p30',
        order: 0,
        entries: [{
          id: 'keyboard', label: [de('Tastatur')], value: { raw: 'false', asText: [de('Computertastatur')] }
        }]
      }]
    };
    fixture.detectChanges();
    tick();

    const shown: string = fixture.nativeElement.textContent;
    expect(shown).toContain('Note');
    expect(shown).toContain('Keyboard');
    expect(shown).not.toContain('Notiz');

    const changes = jasmine.createSpy('metadataChange');
    component.metadataChange.subscribe(changes);
    (fixture.nativeElement.querySelector('[role="switch"]') as HTMLButtonElement).click();
    tick();
    const saved: UnitMetadataValues = changes.calls.mostRecent().args[0];
    const keyboard = saved.profiles?.[0].entries.find(entry => entry.id === 'keyboard');
    expect(keyboard?.label).toEqual([de('Tastatur'), en('Keyboard')]);
    expect(keyboard?.value).toEqual({ raw: 'true', asText: [de('Tastatur eingeblendet'), en('On-screen keyboard')] });
  }));
});
