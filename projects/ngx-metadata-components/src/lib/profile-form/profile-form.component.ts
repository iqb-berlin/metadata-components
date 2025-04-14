import {
  Component, EventEmitter, Input, OnChanges, OnDestroy, Output, SimpleChanges
} from '@angular/core';
import { FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import {
  MDProfile,
  MDProfileEntry,
  MDProfileGroup,
  ProfileEntryParametersBoolean,
  ProfileEntryParametersNumber
} from '@iqb/metadata';
import { Subject } from 'rxjs';
import { ProfileEntryParametersText, ProfileEntryParametersVocabulary }
  from '@iqb/metadata/md-profile-entry';
import { TextWithLanguage } from '@iqb/metadata/md-main';
import { TextsWithLanguageAndId } from '@iqb/metadata/md-values';
import { DurationService } from '../services/duration.service';
import { Vocab, VocabIdDictionaryValue, VocabularyEntry } from '../models/vocabulary.class';
import {MetadataService} from "../services/metadata.service";
import {FormlyFieldConfig, FormlyModule} from "@ngx-formly/core";

export class MetadataValuesEntry {
  id!: string;
  label!: TextWithLanguage[];
  value!: TextsWithLanguageAndId[] | TextWithLanguage[] | string;
  valueAsText!: TextWithLanguage | TextWithLanguage[];
}

export class MetadataValues {
  entries?: MetadataValuesEntry[];
  profileId?: string;
  isCurrent?: boolean;
}

export class ProfileMetadataValues {
  profiles?: MetadataValues[];
}

export class ItemsMetadataValues extends ProfileMetadataValues {
  id?: string;
  description?: string;
  variableId?: string;
  variableReadOnlyId?: string;
  weighting?: number;
  [key: string]: string | number | MetadataValues[] | undefined;
}

export class UnitMetadataValues extends ProfileMetadataValues {
  items?: ItemsMetadataValues[];
}

interface FormlyConfigProps {
  label: string;
  min?: number;
  max?: number;
  autosize?: boolean;
  autosizeMinRows?: number;
  autosizeMaxRows?: number;
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
  providers:[MetadataService],
  standalone: true,
})
export class ProfileFormComponent implements OnDestroy, OnChanges {

  constructor(
  public metadataService: MetadataService,
  ) {}
  @Output() metadataChange: EventEmitter<Partial<UnitMetadataValues>> = new EventEmitter();
  @Input() language!: string;
  @Input() metadata!: Partial<UnitMetadataValues>;
  @Input() formlyWrapper!: string;
  @Input() panelExpanded!: boolean;
  @Input() profile!: MDProfile;
  @Input() vocabularies !: Vocab[];
  @Input() vocabulariesIdDictionary !: Record<string, VocabIdDictionaryValue>;
  @Input() unitProfileColumns:MDProfileGroup[] = [];
  @Input() itemProfileColumns:MDProfileGroup = {} as MDProfileGroup;

  form = new FormGroup({});
  fields!: FormlyFieldConfig[];
  model: Record<string, ModelValue> = {};

  private profileItemKeys: Record<string, ProfileItemKeyValue> = {};
  private ngUnsubscribe = new Subject<void>();

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['vocabularies'] && changes['vocabularies'].currentValue) {
      this.metadataService.storeVocabularies(this.vocabularies)
    }

    if (changes['vocabulariesIdDictionary'] && changes['vocabulariesIdDictionary'].currentValue) {
      this.metadataService.storeVocabulariesIdDictionary(this.vocabulariesIdDictionary)
    }

    const metadata = 'metadata';
    if (changes[metadata] &&
      !changes[metadata].firstChange &&
      changes[metadata].previousValue !== changes[metadata].currentValue &&
      this.profile) {
      this.model = this.mapMetadataValuesToFormlyModel(
        this.findCurrentProfileMetadata(this.metadata.profiles)
      );
    }

    const profile = 'profile';
    if (changes[profile] &&
      !changes[profile].firstChange &&
      changes[profile].previousValue !== changes[profile].currentValue) {
      this.fields = this.mapProfileToFormlyFieldConfig(this.profile);
    }
  }

  private findCurrentProfileMetadata(metadata: MetadataValues[] | undefined): MetadataValues | undefined {
    if (!metadata || !metadata.length) return {};
    return metadata.find(data => data.profileId === this.profile.id);
  }

  private static getFormlyType(entry: MDProfileEntry): string {
    let type: string = entry.type;
    if (entry.parameters instanceof ProfileEntryParametersText) {
      if (entry.parameters.format === 'multiline') {
        type = 'textarea';
      }
    } else if (entry.parameters instanceof ProfileEntryParametersNumber) {
      if (entry.parameters.isPeriodSeconds) {
        type = 'duration';
      }
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

  // //////////////////////////////////
  // Formly Model To Metadata Values //
  // //////////////////////////////////
  private mapFormlyModelToMetadataValues(model: Record<string, ModelValue>, profileId: string): MetadataValues {
    return this.mapFormlyModelToMetadataValueEntries(Object.entries(model), profileId);
  }

  private mapFormlyModelToMetadataValueEntries(allEntries: ModelValueEntry[], profileId: string) : MetadataValues {
    return {
      entries: [
        ...allEntries
          .map(entry => ({
            id: entry[0],
            label: [{
              lang: this.language,
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
        lang: this.language,
        value: this.getBooleanTypeLabel(modelValueEntry[0], modelValueEntry[1] as boolean)
      };
    }
    if (type === 'number') {
      if ((this.profileItemKeys[modelValueEntry[0]].parameters as ProfileEntryParametersNumber).isPeriodSeconds) {
        const duration = DurationService.convertSecondsToMinutes(Number(modelValueEntry[1]));
        return {
          lang: this.language,
          value: `${duration.minutes}:${duration.seconds}`
        };
      }
    }
    return {
      lang: this.language,
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
      const storedValue = this.mapMetaDataEntriesValueToFormlyModelValue(entry.value);
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
    if (value === undefined) {
      return true; // Kein Wert, daher als valide betrachtet
    }
    if (!type) {
      return false; // Ungültig, wenn der Typ nicht existiert
    }
    switch (type) {
      case 'text':
        return typeof value === 'object';
      case 'vocabulary':
        return Array.isArray(value);
      case 'boolean':
        return typeof value === 'boolean';
      case 'number':
        return typeof value === 'number';
      default:
        return false; // Für unbekannte Typen
    }
  }

  private mapMetaDataEntriesValueToFormlyModelValue(
    value: TextsWithLanguageAndId[] | TextWithLanguage[] | string | null
  ): ModelValue {
    if (Array.isArray(value)) {
      if (value.length) {
        const valueElement = value[0];
        const hasLanguage = Object.prototype.hasOwnProperty.call(valueElement, 'lang');
        const hasId = Object.prototype.hasOwnProperty.call(valueElement, 'id');
        if (hasLanguage) {
          return (value as TextWithLanguage[]).reduce((obj, currentValue) => ({
            ...obj,
            [currentValue.lang]: currentValue.value
          }), {});
        }
        if (hasId) {
          return (value as TextsWithLanguageAndId[]).map(v => {
            const name = this.vocabulariesIdDictionary[v.id]?.labels.de;
            const notation = this.vocabulariesIdDictionary[v.id]?.notation[0] || '';
            return {
              name: `${this.vocabulariesIdDictionary[v.id]?.hideNumbering ? '' : notation} ${name} `,
              notation: notation ? [notation] : [],
              text: v.text,
              id: v.id
            };
          });
        }
      }
      return [];
    }
    // must be a boolean or number
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
      if (groups[0].label === 'Item') {
        this.itemProfileColumns = groups[0];
      } else {
        this.unitProfileColumns = groups;
      }

      return groups?.map((group: MDProfileGroup) => ({
        wrappers: this.formlyWrapper ? [this.formlyWrapper] : undefined,
        props: {
          label: group.label,
          expanded: this.panelExpanded
        },
        fieldGroup: group.entries
          .map((entry: MDProfileEntry) => {
            // this.checkStoredValueForField(entry);
            this.registerProfileItem(entry);
            return ProfileFormComponent.getFormlyField(entry);
          })
      }));
    } return [];
  }

  private static getFormlyField(entry: MDProfileEntry): FormlyFieldConfig {
    const props: FormlyConfigProps = {
      ...entry.parameters,
      label: entry.label
    };
    if (entry.parameters instanceof ProfileEntryParametersNumber) {
      if (ProfileFormComponent.getFormlyType(entry) !== 'duration') {
        props.min = entry.parameters.minValue === null ? undefined : entry.parameters.minValue;
        props.max = entry.parameters.maxValue === null ? undefined : entry.parameters.maxValue;
      }
    } else if (entry.parameters instanceof ProfileEntryParametersText) {
      if (ProfileFormComponent.getFormlyType(entry) === 'textarea') {
        props.autosize = true;
        props.autosizeMinRows = 3;
        props.autosizeMaxRows = 10;
      }
      return {
        key: entry.id,
        fieldGroup: entry.parameters.textLanguages
          .map(language => ProfileFormComponent.createFormlyField(language, entry, props))
      };
    }
    return ProfileFormComponent.createFormlyField(entry.id, entry, props);
  }

  private static createFormlyField(key: string, entry: MDProfileEntry, props: FormlyConfigProps): FormlyFieldConfig {
    return {
      key,
      type: ProfileFormComponent.getFormlyType(entry),
      props
    };
  }

  private registerProfileItem(entry: MDProfileEntry): void {
    this.profileItemKeys[entry.id] = {
      label: entry.label,
      type: entry.type,
      parameters: entry.parameters
    };
  }

  onModelChange(): void {
    const metadata = this.mapFormlyModelToMetadataValues(this.model, this.profile.id);
    if (this.metadata && this.metadata.profiles) {
      const index = this.metadata.profiles!
        .findIndex((data: MetadataValues) => data.profileId === this.profile.id);
      if (index < 0) {
        this.metadata.profiles!.push(metadata);
      } else {
        this.metadata.profiles![index] = metadata;
      }
    } else {
      this.metadata.profiles = [metadata];
    }
    this.metadata.profiles = this.defineCurrentProfile();
    this.metadataChange.emit(this.metadata);
  }

  private defineCurrentProfile(): MetadataValues[] {
    return this.metadata.profiles!.map((metadata: MetadataValues) => ({
      ...metadata,
      isCurrent: metadata.profileId === this.profile.id
    }));
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }
}
