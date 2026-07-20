/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable import/no-extraneous-dependencies */
import {
  AfterViewInit, Component, ElementRef, Input, OnDestroy, OnInit,
  ViewEncapsulation, signal, effect, untracked,
  ChangeDetectorRef,
  output
} from '@angular/core';
import { FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import {
  MDProfile,
  MDProfileEntry,
  MDProfileGroup,
  ProfileEntryParametersBoolean,
  ProfileEntryParametersText,
  ProfileEntryParametersVocabulary,
  ProfileEntryParametersNumber,
  LanguageCodedText
} from '@iqbspecs/metadata-profile';
import { FormlyFieldConfig, FormlyFormOptions, FormlyModule } from '@ngx-formly/core';
import { Subject, takeUntil } from 'rxjs';
import { MetadataValue, SimpleValue } from '@iqbspecs/metadata-values';
import { VocabularyProvider } from '../models/vocabulary-provider.interface';
import {
  MetadataProfileValues,
  StoredVocabularyEntry,
  UnitMetadataValues
} from '../models/metadata-values.interface';
import { MetadataService } from '../services/metadata.service';
import { DurationService } from '../services/duration.service';
import { VocabularyEntry } from '../models/vocabulary.class';

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
export class ProfileFormComponent implements OnInit, AfterViewInit, OnDestroy {
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
  set readonly(value: boolean | string | null | undefined) {
    this.readonlySignal.set(ProfileFormComponent.coerceBooleanInput(value));
  }

  private static coerceBooleanInput(value: boolean | string | null | undefined): boolean {
    return value === true || value === '' || value === 'true';
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
  private metadataEntryLabels: Record<string, { lang: string, value: string }[]> = {};
  private ngUnsubscribe = new Subject<void>();
  private modelChangeSuppressionDepth = 0;
  private readonly nativeInputHandler = (event: Event): void => this.onFormInput(event);

  constructor(
    public metadataService: MetadataService,
    private cdr: ChangeDetectorRef,
    private elementRef: ElementRef<HTMLElement>
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
        this.setModelFromMetadata(newModel);
      }
    });

    effect(() => {
      const readonly = this.readonlySignal();

      this.runWithoutModelChange(() => {
        this.formState.readonly = readonly;
        this.cdr.detectChanges();
      });
    });

    this.form().valueChanges
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe(value => this.onModelChange(value as Record<string, ModelValue>));
  }

  ngOnInit() {
    const currentProfile = this.profileSignal();
    if (currentProfile) {
      this.loadProfile();
    }
  }

  ngAfterViewInit(): void {
    this.elementRef.nativeElement.addEventListener('input', this.nativeInputHandler, true);
    this.elementRef.nativeElement.addEventListener('change', this.nativeInputHandler, true);
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

    // Read metadata/model untracked: loadProfile runs inside the profile effect,
    // and Angular effects subscribe to every signal read during execution. Without
    // this guard the effect would also depend on metadataSignal (via getMetadata)
    // and model (via setModelFromMetadata), so every keystroke — which sets
    // metadataSignal in onModelChange — re-runs loadProfile and rebuilds the whole
    // formly field tree, detaching the focused input and scrolling the page.
    untracked(() => {
      const currentMetadata = this.getMetadata();
      const newModel = this.mapMetadataValuesToFormlyModel(
        this.findCurrentProfileMetadata(currentMetadata.profiles)
      );
      this.setModelFromMetadata(newModel);
    });
  }

  private setModelFromMetadata(model: Record<string, ModelValue>): void {
    // Formly syncs a new model reference into the form at check time,
    // which fires form.valueChanges outside the suppression window below.
    // Only publish models that actually changed, otherwise the sync loops
    // model -> form -> valueChanges -> onModelChange -> model forever.
    if (ProfileFormComponent.isContentEqual(model, this.model())) return;
    this.runWithoutModelChange(() => {
      this.model.set(model);
      queueMicrotask(() => this.cdr.detectChanges());
    });
  }

  private static isContentEqual(a: unknown, b: unknown): boolean {
    return JSON.stringify(a) === JSON.stringify(b);
  }

  private runWithoutModelChange(action: () => void): void {
    this.modelChangeSuppressionDepth += 1;
    try {
      action();
    } finally {
      queueMicrotask(() => {
        this.modelChangeSuppressionDepth -= 1;
      });
    }
  }

  private findCurrentProfileMetadata(metadata: MetadataProfileValues[] | undefined): MetadataProfileValues | undefined {
    if (!metadata || !metadata.length) return undefined;
    const currentProfile = this.getProfile();
    const byId = metadata.find(data => data.profileId === currentProfile?.id);
    if (byId) return byId;
    return metadata.find(data => (data as any).isCurrent === true);
  }

  private static getFormlyType(entry: MDProfileEntry): string {
    let type: string = entry.type.toUpperCase();
    if (type === 'TEXT' && (entry.parameters as any)?.format?.toUpperCase() === 'MULTILINE') {
      type = 'TEXTAREA';
    } else if (type === 'NUMBER' && (entry.parameters as any)?.isPeriodSeconds) {
      type = 'DURATION';
    } else if (type === 'VOCABULARY' &&
      (entry.parameters as any)?.selectionMode?.toUpperCase().replace('-', '_') === 'IN_FORM') {
      type = 'VOCABULARY_INLINE';
    }
    const typesMapping: Record<string, string> = {
      TEXT: 'input',
      BOOLEAN: 'formlyToggle',
      NUMBER: 'number',
      DURATION: 'duration',
      VOCABULARY: 'chips',
      VOCABULARY_INLINE: 'vocabInline',
      TEXTAREA: 'textarea'
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
  private mapFormlyModelToMetadataValues(model: Record<string, ModelValue>, profileId: string): MetadataProfileValues {
    return this.mapFormlyModelToMetadataValueEntries(Object.entries(model), profileId);
  }

  private mapFormlyModelToMetadataValueEntries(
    allEntries: ModelValueEntry[],
    profileId: string
  ): MetadataProfileValues {
    const currentLanguage = this.getLanguage();
    return {
      entries: allEntries
        .filter(entry => entry[1] !== undefined && entry[1] !== null)
        .map(entry => ({
          id: entry[0],
          label: this.metadataEntryLabels[entry[0]] ?? [{
            lang: currentLanguage,
            value: this.profileItemKeys[entry[0]]?.label ?? ''
          }],
          value: this.mapFormlyModelValueToMetadataValue(entry)
        })),
      profileId,
      order: 0
    };
  }

  private mapFormlyModelValueToMetadataValue(
    modelValueEntry: ModelValueEntry
  ): StoredVocabularyEntry[] | LanguageCodedText[] | SimpleValue {
    const type = this.profileItemKeys[modelValueEntry[0]]?.type;
    const currentLanguage = this.getLanguage();

    if (type === 'TEXT') {
      if (typeof modelValueEntry[1] === 'string') {
        return [{ lang: currentLanguage, value: modelValueEntry[1] }];
      }
      const textWithLanguages = Object.entries(modelValueEntry[1]);
      return textWithLanguages
        .map(twl => ({ lang: twl[0], value: twl[1] as string }));
    }
    if (type === 'VOCABULARY') {
      const result: StoredVocabularyEntry[] = (modelValueEntry[1] as VocabularyEntry[])
        .map(vocabEntry => {
          const entry: StoredVocabularyEntry = {
            id: vocabEntry.id,
            label: vocabEntry.text?.map(t => ({ lang: t.lang, value: t.value })) ?? [],
            // Spec-Feld 'annotation' = SKOS-notation (Nummerierung); Anzeige via hideNumbering.
            annotation: (vocabEntry.notation ?? [])
              .map(n => ({ lang: currentLanguage, value: n }))
          };
          return entry;
        });
      return result;
    }
    if (type === 'BOOLEAN') {
      return {
        raw: modelValueEntry[1].toString(),
        asText: [{
          lang: currentLanguage,
          value: this.getBooleanTypeLabel(modelValueEntry[0], modelValueEntry[1] as boolean)
        }]
      };
    }
    if (type === 'NUMBER') {
      const params = this.profileItemKeys[modelValueEntry[0]]?.parameters as ProfileEntryParametersNumber;
      if (params?.isPeriodSeconds) {
        const duration = DurationService.convertSecondsToMinutes(Number(modelValueEntry[1]));
        return {
          raw: modelValueEntry[1].toString(),
          asText: [{ lang: currentLanguage, value: `${duration.minutes}:${duration.seconds}` }]
        };
      }
      return {
        raw: modelValueEntry[1].toString(),
        asText: [{ lang: currentLanguage, value: modelValueEntry[1].toString() }]
      };
    }
    return {
      raw: modelValueEntry[1].toString(),
      asText: [{ lang: currentLanguage, value: modelValueEntry[1].toString() }]
    };
  }

  private getBooleanTypeLabel(key: string, value: boolean): string {
    const params = this.profileItemKeys[key].parameters as ProfileEntryParametersBoolean;
    const label = value ? params.trueLabel : params.falseLabel;
    if (label) {
      return ProfileFormComponent.extractLabelText(label);
    }
    return value.toString();
  }

  // //////////////////////////////////
  // Metadata Values To Formly Model //
  // //////////////////////////////////

  private mapMetadataValuesToFormlyModel(metadata: MetadataProfileValues | undefined): Record<string, ModelValue> {
    if (!metadata || !metadata.entries) return {};
    return this.mapMetaDataEntriesToFormlyModel(metadata.entries);
  }

  private mapMetaDataEntriesToFormlyModel(entries: MetadataValue[]): Record<string, ModelValue> {
    const model: Record<string, ModelValue> = {};
    let triggerSaving = false;
    entries.forEach((entry: MetadataValue) => {
      if (entry.label?.length) {
        this.metadataEntryLabels[entry.id] = entry.label.map(l => ({ lang: l.lang, value: l.value }));
      }
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

      if (type === 'TEXT' && !(typeof value === 'string' || typeof value === 'object')) return false;

      if (type === 'VOCABULARY' && !Array.isArray(value)) return false;
      if (type === 'BOOLEAN' && !(typeof value === 'boolean')) return false;
      if (type === 'NUMBER' && !(typeof value === 'number')) return false;
    }

    return true;
  }

  private mapMetaDataEntriesValueToFormlyModelValue(
    value: StoredVocabularyEntry[] | LanguageCodedText[] | SimpleValue,
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
            const match = (value as LanguageCodedText[]).find(v => v.lang === currentLang);
            return match?.value || (value as LanguageCodedText[])[0]?.value || '';
          }

          return (value as LanguageCodedText[]).reduce((obj, currentValue) => ({
            ...obj,
            [currentValue.lang]: currentValue.value
          }), {});
        }

        if (hasId) {
          const vocabDict = this.metadataService.vocabulariesIdDictionary();
          const params = entryId ? this.profileItemKeys[entryId]?.parameters as any : null;
          const hideNumbering = params?.hideNumbering || false;
          return (value as StoredVocabularyEntry[]).map(v => {
            const rawLabels = v.label ?? (v as any).text ?? [];
            const textLabels: { lang: string, value: string }[] = rawLabels
              .map((l: any) => ({ lang: l.lang, value: l.value }));
            const dictEntry = vocabDict[v.id];

            if (!dictEntry) {
              const savedLabel = textLabels.find(label => label.lang === 'de')?.value ||
                v.id.split('/').pop() ||
                v.id;
              // Ohne Dictionary die Nummerierung aus dem Spec-Feld 'annotation' rekonstruieren.
              const savedNotation = (v.annotation ?? [])
                .map(a => a.value)
                .filter(n => !!n);
              const savedNotationStr = savedNotation[0] || '';
              return {
                id: v.id,
                name: `${hideNumbering ? '' : savedNotationStr} ${savedLabel}`.trim(),
                notation: savedNotation,
                text: textLabels
              };
            }

            const label = dictEntry.name || '';
            const notation = dictEntry.notation?.[0] || '';
            return {
              id: v.id,
              name: `${hideNumbering ? '' : notation} ${label}`.trim(),
              notation: notation ? [notation] : [] as string[],
              // 'text' aus dem Dictionary als reiner Begriff (heilt alt gespeicherte Kombi-Labels).
              text: [{ lang: 'de', value: label }]
            };
          });
        }
      }
      return [];
    }
    const raw = typeof value === 'string' ? value : (value as SimpleValue).raw;
    if (raw === 'true') return true;
    if (raw === 'false') return false;
    return parseInt(raw, 10);
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
      ...(entry.parameters as any),
      label: ProfileFormComponent.extractLabelText(entry.label)
    };

    if (entry.type.toUpperCase() === 'BOOLEAN' && entry.parameters) {
      const boolParams = entry.parameters as ProfileEntryParametersBoolean;
      if (boolParams.trueLabel) {
        props.trueLabel = ProfileFormComponent.extractLabelText(boolParams.trueLabel);
      }
      if (boolParams.falseLabel) {
        props.falseLabel = ProfileFormComponent.extractLabelText(boolParams.falseLabel);
      }
    }

    if (entry.type.toUpperCase() === 'NUMBER') {
      const params = entry.parameters as any;
      if (ProfileFormComponent.getFormlyType(entry) !== 'duration') {
        props.min = params?.minValue === null ? undefined : params?.minValue;
        props.max = params?.maxValue === null ? undefined : params?.maxValue;
      }
    } else if (entry.type.toUpperCase() === 'TEXT') { //
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
            .map((language: string) => ProfileFormComponent.createFormlyField(
              language,
              entry,
              ProfileFormComponent.withLanguageLabel(props, language)
            ))
        };
      }
    }

    return ProfileFormComponent.createFormlyField(entry.id, entry, props);
  }

  private static withLanguageLabel(props: FormlyConfigProps, language: string): FormlyConfigProps {
    return {
      ...props,
      label: `(${language}) ${props.label}`
    };
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
      type: entry.type.toUpperCase(),
      parameters: entry.parameters
    };
  }

  onModelChange(modelValue?: Record<string, ModelValue>): void {
    if (this.modelChangeSuppressionDepth > 0 || this.readonlySignal()) {
      return;
    }

    const currentModel = modelValue ?? this.form().getRawValue() as Record<string, ModelValue>;
    const currentProfile = this.getProfile();
    const existingMetadata = this.getMetadata();
    const currentMetadata: Partial<UnitMetadataValues> = {
      ...existingMetadata,
      profiles: existingMetadata.profiles ? [...existingMetadata.profiles] : undefined
    };

    if (!currentProfile) return;

    const metadata = this.mapFormlyModelToMetadataValues(currentModel, currentProfile.id);

    if (currentMetadata && currentMetadata.profiles) {
      const index = currentMetadata.profiles!
        .findIndex((data: MetadataProfileValues) => data.profileId === currentProfile.id);
      if (index < 0) {
        currentMetadata.profiles!.push(metadata);
      } else {
        currentMetadata.profiles![index] = metadata;
      }
    } else {
      currentMetadata.profiles = [metadata];
    }

    currentMetadata.profiles = this.assignProfileOrder(currentMetadata.profiles);
    // Re-emitting unchanged metadata would re-trigger the metadata effect
    // (fresh object identity every round) and with it the endless
    // model/form/valueChanges cycle that freezes the tab.
    if (ProfileFormComponent.isContentEqual(currentMetadata, existingMetadata)) return;
    this.metadataSignal.set(currentMetadata);
    this.metadataChange.emit(currentMetadata);
  }

  onFormInput(event: Event): void {
    queueMicrotask(() => this.onModelChange(this.getModelWithDomInputValue(event)));
  }

  private getModelWithDomInputValue(event: Event): Record<string, ModelValue> {
    const currentModel = {
      ...this.model(),
      ...this.form().getRawValue() as Record<string, ModelValue>
    };
    const target = event.target;

    if (!(target instanceof HTMLInputElement) || target.type !== 'number') {
      return currentModel;
    }

    const key = this.getKeyFromInput(target);
    if (!key) return currentModel;

    const type = this.profileItemKeys[key]?.type;
    if (type !== 'NUMBER') return currentModel;

    const params = this.profileItemKeys[key]?.parameters as ProfileEntryParametersNumber | null;
    if (params?.isPeriodSeconds) {
      const durationRoot = target.closest('iqb-formly-duration');
      const durationInputs = Array.from(durationRoot?.querySelectorAll('input[type="number"]') || []);
      const minutes = Number((durationInputs[0] as HTMLInputElement | undefined)?.value || 0);
      const seconds = Number((durationInputs[1] as HTMLInputElement | undefined)?.value || 0);
      return {
        ...currentModel,
        [key]: minutes * 60 + seconds
      };
    }

    return {
      ...currentModel,
      [key]: target.value === '' ? '' : Number(target.value)
    };
  }

  private getKeyFromInput(input: HTMLInputElement): string | undefined {
    const formlyKey = input.id.match(/^formly_\d+_[^_]+_(.+)_\d+$/)?.[1];
    if (formlyKey && this.profileItemKeys[formlyKey]) return formlyKey;

    const fieldText = input.closest('formly-field')?.textContent?.trim().replace(/\s+/g, ' ') || '';
    return Object.entries(this.profileItemKeys)
      .find(([, item]) => item.type === 'NUMBER' && fieldText.startsWith(item.label))?.[0];
  }

  private assignProfileOrder(profiles: MetadataProfileValues[]): MetadataProfileValues[] {
    const currentProfile = this.getProfile();
    return profiles.map((metadata: MetadataProfileValues, index: number) => ({
      ...metadata,
      order: metadata.profileId === currentProfile?.id ? 0 : index + 1
    }));
  }

  ngOnDestroy(): void {
    this.elementRef.nativeElement.removeEventListener('input', this.nativeInputHandler, true);
    this.elementRef.nativeElement.removeEventListener('change', this.nativeInputHandler, true);
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }
}
