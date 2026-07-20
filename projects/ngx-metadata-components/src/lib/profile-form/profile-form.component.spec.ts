import {
  ComponentFixture, TestBed, fakeAsync, tick
} from '@angular/core/testing';
import { FormlyModule } from '@ngx-formly/core';
import { FormlyMaterialModule } from '@ngx-formly/material';
import { ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { MDProfile, ProfileEntryParametersVocabulary } from '@iqbspecs/metadata-profile';
import { ProfileFormComponent } from './profile-form.component';
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
        FormlyModule.forRoot(),
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
});
