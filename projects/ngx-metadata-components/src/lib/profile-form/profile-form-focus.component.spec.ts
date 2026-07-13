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

const vocabularyProvider: VocabularyProvider = {
  getVocabularies: () => [{ url: 'v1', data: {} }] as unknown as ReturnType<VocabularyProvider['getVocabularies']>,
  getVocabularyDictionary: () => ({})
};

const storedMetadata = {
  profiles: [{
    entries: [{ id: 'field1', label: [{ lang: 'de', value: 'Field 1' }], value: [{ lang: 'de', value: 'ab' }] }],
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

describe('ProfileFormComponent focus stability while typing', () => {
  let fixture: ComponentFixture<ProfileFormComponent>;
  let component: ProfileFormComponent;

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
  });

  // Regression: the profile effect must not depend on metadataSignal. When it did,
  // every keystroke re-ran loadProfile() -> fields.set(), rebuilding the formly tree
  // and detaching the focused input (focus loss + page scroll on each character).
  it('keeps the same input element attached while typing', fakeAsync(() => {
    component.formlyWrapper = '';
    component.profileData = profile;
    component.panelExpanded = true;
    component.vocabularyProvider = vocabularyProvider;
    component.metadataValues = JSON.parse(JSON.stringify(storedMetadata));
    fixture.detectChanges();
    tick(100);
    fixture.detectChanges();

    const input: HTMLInputElement | null = fixture.nativeElement.querySelector('input');
    expect(input).toBeTruthy();
    if (!input) return;
    expect(input.value).toBe('ab');

    input.focus();
    input.value = 'abc';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    tick(200);
    fixture.detectChanges();
    tick(200);
    fixture.detectChanges();

    const inputAfter: HTMLInputElement | null = fixture.nativeElement.querySelector('input');
    expect(input.isConnected).toBe(true);
    expect(inputAfter).toBe(input);
    expect(input.value).toBe('abc');
  }));
});
