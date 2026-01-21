import { TextsWithLanguageAndId } from '@iqb/metadata/md-values';
import { TextWithLanguage } from '@iqb/metadata/md-main';

export interface MetadataValuesEntry {
  id: string;
  label: TextWithLanguage[];
  value: TextsWithLanguageAndId[] | TextWithLanguage[] | string;
  valueAsText: TextWithLanguage | TextWithLanguage[];
}

export interface MetadataValues {
  entries?: MetadataValuesEntry[];
  profileId?: string;
  isCurrent?: boolean;
}

export interface UnitMetadataValues {
  profiles?: MetadataValues[];
}
