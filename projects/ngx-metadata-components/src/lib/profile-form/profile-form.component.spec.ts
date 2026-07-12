import {
  ComponentFixture, TestBed, fakeAsync, tick
} from '@angular/core/testing';
import { FormlyModule } from '@ngx-formly/core';
import { FormlyMaterialModule } from '@ngx-formly/material';
import { ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { MDProfile } from '@iqbspecs/metadata-profile';
import { ProfileFormComponent } from './profile-form.component';
import { VocabularyProvider } from '../models/vocabulary-provider.interface';
import { UnitMetadataValues } from '../models/metadata-values.interface';

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
