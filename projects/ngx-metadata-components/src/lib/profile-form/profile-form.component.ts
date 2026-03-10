/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable import/no-extraneous-dependencies */
import { VocabularyProvider } from '../models/vocabulary-provider.interface';
import {
  Component, Input, OnDestroy, OnInit,
  ViewEncapsulation, signal, effect,
  ChangeDetectorRef,
  output
} from '@angular/core';
import { FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import {
  MDProfile,
  MDProfileEntry,
  MDProfileGroup,
  ProfileEntryParametersBoolean,
  ProfileEntryParametersNumber
} from '@iqb/metadata';
import { FormlyFieldConfig, FormlyFormOptions, FormlyModule } from '@ngx-formly/core';
import { Subject } from 'rxjs';
import { ProfileEntryParametersText, ProfileEntryParametersVocabulary }
  from '@iqb/metadata/md-profile-entry';
import { TextWithLanguage } from '@iqb/metadata/md-main';
import { TextsWithLanguageAndId } from '@iqb/metadata/md-values';
import {
  MetadataValues,
  MetadataValuesEntry,
  UnitMetadataValues
} from '../models/metadata-values.interface';
import { MetadataService } from '../services/metadata.service';
import { DurationService } from '../services/duration.service';
import { VocabularyEntry, Vocab, VocabIdDictionaryValue } from '../models/vocabulary.class';

interface FormlyConfigProps {
  label: string;
  min?: number;
  max?: number;
  autosize?: boolean;
  autosizeMinRows?: number;
  autosizeMaxRows?: number;
  trueLabel?: string;
  falseLabel?: string;
}

interface ProfileItemKeyValue {
  label: string;
  type: string;
  parameters: ProfileEntryParametersNumber | ProfileEntryParametersBoolean | ProfileEntryParametersText |
  ProfileEntryParametersVocabulary | null;
}

type ModelValueEntry = [string, ModelValue];

type ModelValue = string | number | boolean | Record<string, string> | VocabularyEntry[];

@Component({
  selector: 'iqb-profile-form',
  templateUrl: './profile-form.component.html',
  styleUrls: ['./profile-form.component.scss'],
  imports: [FormsModule, ReactiveFormsModule, FormlyModule],
  encapsulation: ViewEncapsulation.None
})
export class ProfileFormComponent implements OnInit, OnDestroy {
  private profileSignal = signal<MDProfile | undefined>(undefined);
  private metadataSignal = signal<Partial<UnitMetadataValues>>({});
  private languageSignal = signal<string>('de');
  private formlyWrapperSignal = signal<string>('');
  private panelExpandedSignal = signal<boolean>(false);
  private vocabularyProviderSignal = signal<VocabularyProvider | undefined>(undefined);
  private readonlySignal = signal<boolean>(false);

  @Input()
  set vocabularyProvider(value: VocabularyProvider | undefined) {
    if (value) {
      this.vocabularyProviderSignal.set(value);
    }
  }

  @Input()
  set profileData(value: MDProfile | string | undefined) {
    if (!value) return;

    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        this.profileSignal.set(parsed);
      } catch (e) {
        console.error('Invalid profile JSON', e);
      }
    } else {
      this.profileSignal.set(value);
    }
  }

  @Input()
  set metadataValues(value: Partial<UnitMetadataValues> | string | undefined) {
    if (!value) return;

    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        this.metadataSignal.set(parsed);
      } catch (e) {
        console.error('Invalid metadata JSON', e);
      }
    } else {
      this.metadataSignal.set(value);
    }
  }

  @Input()
  set language(value: string) {
    if (value) {
      this.languageSignal.set(value);
    }
  }

  @Input()
  set formlyWrapper(value: string) {
    this.formlyWrapperSignal.set(value || '');
  }

  @Input()
  set panelExpanded(value: boolean) {
    this.panelExpandedSignal.set(value || false);
  }

  @Input()
  set readonly(value: boolean) {
    this.readonlySignal.set(value);
  }

  private getReadonly(): boolean {
    return this.readonlySignal();
  }

  // @Input() set vocabularies(value: Vocab[]) {
  //   if (value && value.length > 0) {
  //     this.metadataService.storeVocabularies(value);
  //   }
  // }

  // @Input() set vocabulariesIdDictionary(value: Record<string, VocabIdDictionaryValue>) {
  //   if (value && Object.keys(value).length > 0) {
  //     this.metadataService.storeVocabulariesIdDictionary(value);
  //   }
  // }

  metadataChange = output<Partial<UnitMetadataValues>>();

  form = signal(new FormGroup({}));
  fields = signal<FormlyFieldConfig[]>([]);
  model = signal<Record<string, ModelValue>>({});
  private formState = { readonly: false };

  formlyOptions: FormlyFormOptions = {
    formState: this.formState
  };

  private profileItemKeys: Record<string, ProfileItemKeyValue> = {};
  private ngUnsubscribe = new Subject<void>();

  constructor(
    public metadataService: MetadataService,
    private cdr: ChangeDetectorRef
  ) {
    this.formlyOptions = {
      formState: this.formState,
      detectChanges: () => {
        this.cdr.detectChanges();
      }
    };
    effect(() => {
      const profile = this.profileSignal();
      if (profile) {
        this.loadProfile();
      }
    });

    effect(() => {
      const provider = this.vocabularyProviderSignal();
      if (provider) {
        this.metadataService.setVocabularyProvider(provider);
      }
    });

    effect(() => {
      const metadata = this.metadataSignal();
      const profile = this.profileSignal();
      const resolver = this.vocabularyProviderSignal();

      if (!resolver) return;
      if (!metadata || !profile) return;

      // Check if vocabularies are loaded in resolver
      const vocabs = resolver.getVocabularies();
      if (vocabs.length === 0) return;

      if (Object.keys(metadata).length > 0) {
        const newModel = this.mapMetadataValuesToFormlyModel(
          this.findCurrentProfileMetadata(metadata.profiles)
        );
        this.model.set(newModel);
      }
    });

    effect(() => {
      const readonly = this.readonlySignal();

      console.log('Readonly effect triggered:', readonly);

      // Just update the property on the existing object
      this.formState.readonly = readonly;

      console.log('FormState after update:', this.formState);

      this.cdr.detectChanges();
    }, { allowSignalWrites: true });
  }

  ngOnInit() {
    const currentProfile = this.profileSignal();
    if (currentProfile) {
      this.loadProfile();
    }
  }

  private getProfile(): MDProfile | undefined {
    return this.profileSignal();
  }

  private getMetadata(): Partial<UnitMetadataValues> {
    return this.metadataSignal();
  }

  private getLanguage(): string {
    return this.languageSignal();
  }

  private getFormlyWrapper(): string {
    return this.formlyWrapperSignal();
  }

  private getPanelExpanded(): boolean {
    return this.panelExpandedSignal();
  }

  private loadProfile() {
    const currentProfile = this.getProfile();
    if (!currentProfile) return;

    const newFields = this.mapProfileToFormlyFieldConfig(currentProfile);
    this.fields.set(newFields);

    const currentMetadata = this.getMetadata();
    const newModel = this.mapMetadataValuesToFormlyModel(
      this.findCurrentProfileMetadata(currentMetadata.profiles)
    );
    this.model.set(newModel);

    queueMicrotask(() => this.cdr.detectChanges());
  }

  private findCurrentProfileMetadata(metadata: MetadataValues[] | undefined): MetadataValues | undefined {
    if (!metadata || !metadata.length) return {};
    const currentProfile = this.getProfile();
    return metadata.find(data => data.profileId === currentProfile?.id);
  }

  private static getFormlyType(entry: MDProfileEntry): string {
    let type: string = entry.type;
    if (entry.type === 'text' && (entry.parameters as any)?.format === 'multiline') {
      type = 'textarea';
    } else if (entry.type === 'number' && (entry.parameters as any)?.isPeriodSeconds) {
      type = 'duration';
    }
    const typesMapping: Record<string, string> = {
      text: 'input',
      boolean: 'formlyToggle',
      number: 'number',
      duration: 'duration',
      vocabulary: 'chips',
      textarea: 'textarea'
    };
    return typesMapping[type];
  }

  private static extractLabelText(label: string | any): string {
    if (typeof label === 'string') {
      return label;
    }

    if (Array.isArray(label) && label.length > 0) {
      const deLbl = label.find((l: any) => l.lang === 'de');
      if (deLbl?.value) return deLbl.value;

      if (label[0]?.value) return label[0].value;
    }

    if (label && typeof label === 'object' && 'value' in label) {
      return label.value;
    }

    return label?.toString() || 'Unknown';
  }

  // //////////////////////////////////
  // Formly Model To Metadata Values //
  // //////////////////////////////////
  private mapFormlyModelToMetadataValues(model: Record<string, ModelValue>, profileId: string): MetadataValues {
    return this.mapFormlyModelToMetadataValueEntries(Object.entries(model), profileId);
  }

  private mapFormlyModelToMetadataValueEntries(allEntries: ModelValueEntry[], profileId: string): MetadataValues {
    const currentLanguage = this.getLanguage();
    return {
      entries: [
        ...allEntries
          .map(entry => ({
            id: entry[0],
            label: [{
              lang: currentLanguage,
              value: this.profileItemKeys[entry[0]]?.label
            }],
            value: this.mapFormlyModelValueToMetadataValue(entry),
            valueAsText: this.mapFormlyModelValueToMetadataValueAsText(entry)
          }))
      ],
      profileId: profileId
    };
  }

  private mapFormlyModelValueToMetadataValue(
    modelValueEntry: ModelValueEntry
  ): TextsWithLanguageAndId[] | TextWithLanguage[] | string {
    const type = this.profileItemKeys[modelValueEntry[0]]?.type;
    if (type === 'text') {
      const textWithLanguages = Object.entries(modelValueEntry[1]);
      return textWithLanguages
        .map(textWithLanguage => ({ lang: textWithLanguage[0], value: textWithLanguage[1] as string }));
    }
    if (type === 'vocabulary') {
      return (modelValueEntry[1] as VocabularyEntry[])
        .map(vocabEntry => ({ id: vocabEntry?.id, text: vocabEntry?.text }));
    }
    return modelValueEntry[1].toString();
  }

  private mapFormlyModelValueToMetadataValueAsText(
    modelValueEntry: ModelValueEntry
  ): TextWithLanguage | TextWithLanguage[] {
    const type = this.profileItemKeys[modelValueEntry[0]]?.type;
    const currentLanguage = this.getLanguage();

    if (type === 'text') {
      const textWithLanguages = Object.entries(modelValueEntry[1]);
      return textWithLanguages
        .map(textWithLanguage => ({ lang: textWithLanguage[0], value: textWithLanguage[1] as string }));
    }
    if (type === 'vocabulary') {
      return (modelValueEntry[1] as VocabularyEntry[])
        .map(vocabEntry => vocabEntry?.text).flat();
    }
    if (type === 'boolean') {
      return {
        lang: currentLanguage,
        value: this.getBooleanTypeLabel(modelValueEntry[0], modelValueEntry[1] as boolean)
      };
    }
    if (type === 'number') {
      if ((this.profileItemKeys[modelValueEntry[0]].parameters as ProfileEntryParametersNumber).isPeriodSeconds) {
        const duration = DurationService.convertSecondsToMinutes(Number(modelValueEntry[1]));
        return {
          lang: currentLanguage,
          value: `${duration.minutes}:${duration.seconds}`
        };
      }
    }
    return {
      lang: currentLanguage,
      value: modelValueEntry[1].toString()
    };
  }

  private getBooleanTypeLabel(key: string, value: boolean): string {
    if (value) {
      return (this.profileItemKeys[key].parameters as ProfileEntryParametersBoolean).trueLabel || value.toString();
    }
    return (this.profileItemKeys[key].parameters as ProfileEntryParametersBoolean).falseLabel || value.toString();
  }

  // //////////////////////////////////
  // Metadata Values To Formly Model //
  // //////////////////////////////////

  private mapMetadataValuesToFormlyModel(metadata: MetadataValues | undefined): Record<string, ModelValue> {
    if (!metadata || !metadata.entries) return {};
    return this.mapMetaDataEntriesToFormlyModel(metadata.entries);
  }

  private mapMetaDataEntriesToFormlyModel(entries: MetadataValuesEntry[]): Record<string, ModelValue> {
    const model: Record<string, ModelValue> = {};
    let triggerSaving = false;
    entries.forEach((entry: MetadataValuesEntry) => {
      const storedValue = this.mapMetaDataEntriesValueToFormlyModelValue(entry.value, entry.id);
      if (this.isStoredValueValidForFormlyField(entry.id, storedValue)) {
        model[entry.id] = storedValue;
      } else {
        triggerSaving = true;
      }
    });
    if (triggerSaving) setTimeout(() => this.onModelChange());
    return model;
  }

  private isStoredValueValidForFormlyField(id: string, value: ModelValue): boolean {
    const type = this.profileItemKeys[id]?.type;

    if (value !== undefined) {
      if (!type) return false;

      if (type === 'text' && !(typeof value === 'string' || typeof value === 'object')) return false;

      if (type === 'vocabulary' && !Array.isArray(value)) return false;
      if (type === 'boolean' && !(typeof value === 'boolean')) return false;
      if (type === 'number' && !(typeof value === 'number')) return false;
    }

    return true;
  }

  private mapMetaDataEntriesValueToFormlyModelValue(
    value: TextsWithLanguageAndId[] | TextWithLanguage[] | string | null,
    entryId?: string
  ): ModelValue {
    if (Array.isArray(value)) {
      if (value.length) {
        const valueElement = value[0];
        const hasLanguage = Object.prototype.hasOwnProperty.call(valueElement, 'lang');
        const hasId = Object.prototype.hasOwnProperty.call(valueElement, 'id');

        if (hasLanguage && !hasId) {
          const params = entryId ? this.profileItemKeys[entryId]?.parameters : null;
          const hasTextLanguages = params && 'textLanguages' in params && (params as any).textLanguages?.length > 1;

          if (!hasTextLanguages) {
            const currentLang = this.getLanguage();
            const match = (value as TextWithLanguage[]).find(v => v.lang === currentLang);
            const result = match?.value || (value as TextWithLanguage[])[0]?.value || '';
            return result;
          }

          const result = (value as TextWithLanguage[]).reduce((obj, currentValue) => ({
            ...obj,
            [currentValue.lang]: currentValue.value
          }), {});
          return result;
        }

        if (hasId) {
          const vocabDict = this.metadataService.vocabulariesIdDictionary();
          const params = entryId ? this.profileItemKeys[entryId]?.parameters as any : null;
          const hideNumbering = params?.hideNumbering || false;
          return (value as TextsWithLanguageAndId[]).map(v => {
            const entry = vocabDict[v.id];

            if (!entry) {
              const savedText = v.text?.find(t => t.lang === 'de')?.value || v.id.split('/').pop() || v.id;
              return {
                name: savedText,
                notation: [],
                text: v.text,
                id: v.id
              };
            }

            const label = entry.name || '';
            const notation = entry.notation?.[0] || '';
            return {
              name: `${hideNumbering ? '' : notation} ${label}`.trim(),
              notation: notation ? [notation] : [],
              text: v.text,
              id: v.id
            };
          });
        }
      }
      return [];
    }
    if (value === 'true') return true;
    if (value === 'false') return false;
    return parseInt((value as string), 10);
  }

  // ///////////////////////////
  // Profile to Formly Config //
  // ///////////////////////////

  private mapProfileToFormlyFieldConfig(profile: MDProfile): FormlyFieldConfig[] {
    if (profile) {
      const groups = profile?.groups;
      const currentFormlyWrapper = this.getFormlyWrapper();
      const currentPanelExpanded = this.getPanelExpanded();

      return groups?.map((group: MDProfileGroup) => ({
        wrappers: currentFormlyWrapper ? [currentFormlyWrapper] : undefined,
        props: {
          label: ProfileFormComponent.extractLabelText(group.label),
          expanded: currentPanelExpanded
        },
        fieldGroup: group.entries
          .map((entry: MDProfileEntry) => {
            this.registerProfileItem(entry);
            return ProfileFormComponent.getFormlyField(entry);
          })
      }));
    }
    return [];
  }

  private static getFormlyField(entry: MDProfileEntry): FormlyFieldConfig {
    const props: FormlyConfigProps = {
      ...entry.parameters,
      label: ProfileFormComponent.extractLabelText(entry.label)
    };

    if (entry.type === 'boolean' && entry.parameters) {
      const boolParams = entry.parameters as ProfileEntryParametersBoolean;
      if (boolParams.trueLabel) {
        props.trueLabel = ProfileFormComponent.extractLabelText(boolParams.trueLabel);
      }
      if (boolParams.falseLabel) {
        props.falseLabel = ProfileFormComponent.extractLabelText(boolParams.falseLabel);
      }
    }

    if (entry.type === 'number') {
      const params = entry.parameters as any;
      if (ProfileFormComponent.getFormlyType(entry) !== 'duration') {
        props.min = params?.minValue === null ? undefined : params?.minValue;
        props.max = params?.maxValue === null ? undefined : params?.maxValue;
      }
    } else if (entry.type === 'text') { //
      const params = entry.parameters as any;

      if (ProfileFormComponent.getFormlyType(entry) === 'textarea') {
        props.autosize = true;
        props.autosizeMinRows = 3;
        props.autosizeMaxRows = 10;
      }

      if (params?.textLanguages && params.textLanguages.length > 1) {
        return {
          key: entry.id,
          fieldGroup: params.textLanguages
            .map((language: string) => ProfileFormComponent.createFormlyField(language, entry, props))
        };
      }
    }

    return ProfileFormComponent.createFormlyField(entry.id, entry, props);
  }

  private static createFormlyField(key: string, entry: MDProfileEntry, props: FormlyConfigProps): FormlyFieldConfig {
    return {
      key,
      type: ProfileFormComponent.getFormlyType(entry),
      props,
      expressions: {
        'props.disabled': 'formState.readonly',
        'props.readonly': 'formState.readonly'
      }
    };
  }

  private registerProfileItem(entry: MDProfileEntry): void {
    this.profileItemKeys[entry.id] = {
      label: ProfileFormComponent.extractLabelText(entry.label),
      type: entry.type,
      parameters: entry.parameters
    };
  }

  onModelChange(): void {
    const currentModel = this.model();
    const currentProfile = this.getProfile();
    const currentMetadata = this.getMetadata();

    if (!currentProfile) return;

    const metadata = this.mapFormlyModelToMetadataValues(currentModel, currentProfile.id);

    if (currentMetadata && currentMetadata.profiles) {
      const index = currentMetadata.profiles!
        .findIndex((data: MetadataValues) => data.profileId === currentProfile.id);
      if (index < 0) {
        currentMetadata.profiles!.push(metadata);
      } else {
        currentMetadata.profiles![index] = metadata;
      }
    } else {
      currentMetadata.profiles = [metadata];
    }

    currentMetadata.profiles = this.defineCurrentProfile(currentMetadata.profiles);
    this.metadataSignal.set(currentMetadata);
    this.metadataChange.emit(currentMetadata);
  }

  private defineCurrentProfile(profiles: MetadataValues[]): MetadataValues[] {
    const currentProfile = this.getProfile();
    return profiles.map((metadata: MetadataValues) => ({
      ...metadata,
      isCurrent: metadata.profileId === currentProfile?.id
    }));
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }
}
