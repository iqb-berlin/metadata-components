import {
  ComponentFixture, TestBed, fakeAsync, tick
} from '@angular/core/testing';
import { FormlyModule } from '@ngx-formly/core';
import { FormlyMaterialModule } from '@ngx-formly/material';
import { ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { MDProfile } from '@iqbspecs/metadata-profile';
import { ProfileFormComponent } from './profile-form.component';
import { FormlyWrapperPanel } from '../formly-wrapper-panel/formly-wrapper-panel.component';
import { VocabularyProvider } from '../models/vocabulary-provider.interface';

const vocabularyProvider: VocabularyProvider = {
  getVocabularies: () => [{ url: 'v1', data: {} }] as unknown as ReturnType<VocabularyProvider['getVocabularies']>,
  getVocabularyDictionary: () => ({})
};

const storedMetadata = {
  profiles: [{
    entries: [{ id: 'field1', label: [{ lang: 'de', value: 'Field 1' }], value: [{ lang: 'de', value: 'Hello' }] }],
    profileId: 'p1',
    order: 0
  }]
};

const profile = {
  id: 'p1',
  label: 'Test Profile',
  groups: [{
    label: 'Group 1',
    entries: [{
      id: 'field1', type: 'text', label: 'Field 1', parameters: null
    }]
  }]
} as unknown as MDProfile;

describe('ProfileFormComponent panel expansion', () => {
  let fixture: ComponentFixture<ProfileFormComponent>;
  let component: ProfileFormComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        ReactiveFormsModule,
        FormlyModule.forRoot({
          wrappers: [{ name: 'panel', component: FormlyWrapperPanel }]
        }),
        FormlyMaterialModule,
        TranslateModule.forRoot()
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ProfileFormComponent);
    component = fixture.componentInstance;
  });

  const isPanelExpanded = (): boolean => !!fixture.nativeElement
    .querySelector('mat-expansion-panel.mat-expanded');

  it('renders an expanded panel when panelExpanded is set before the profile', fakeAsync(() => {
    component.formlyWrapper = 'panel';
    component.panelExpanded = true;
    component.profileData = profile;
    fixture.detectChanges();
    tick();
    fixture.detectChanges();
    expect(isPanelExpanded()).toBe(true);
  }));

  it('renders an expanded panel when the profile is set before panelExpanded ' +
    '(studio-lite binding order)', fakeAsync(() => {
    // Angular applies template inputs in declaration order; studio-lite lists
    // [profileData] before [panelExpanded], so reproduce that order here.
    component.formlyWrapper = 'panel';
    component.profileData = profile;
    component.panelExpanded = true;
    fixture.detectChanges();
    tick();
    fixture.detectChanges();
    expect(isPanelExpanded()).toBe(true);
  }));

  it('keeps the panel expanded after metadata and vocabularies load and ' +
    'rebuild the model', fakeAsync(() => {
    component.formlyWrapper = 'panel';
    component.profileData = profile;
    component.panelExpanded = true;
    component.vocabularyProvider = vocabularyProvider;
    fixture.detectChanges();
    tick(100);
    fixture.detectChanges();
    // metadata arrives after the first render (async load) and triggers a
    // model rebuild through the metadata effect
    component.metadataValues = JSON.parse(JSON.stringify(storedMetadata));
    fixture.detectChanges();
    tick(100);
    fixture.detectChanges();
    expect(isPanelExpanded()).toBe(true);
  }));

  it('keeps the panel expanded when panelExpanded is applied one CD cycle ' +
    'after the profile', fakeAsync(() => {
    component.formlyWrapper = 'panel';
    component.profileData = profile;
    fixture.detectChanges();
    tick();
    fixture.detectChanges();
    // late input: host sets panelExpanded only on a later change detection
    component.panelExpanded = true;
    fixture.detectChanges();
    tick();
    fixture.detectChanges();
    expect(isPanelExpanded()).toBe(true);
  }));
});
