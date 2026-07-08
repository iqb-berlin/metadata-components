import { LanguageCodedText } from '@iqbspecs/metadata-profile';
import {
  MetadataProfileValues,
  MetadataValue,
  SimpleValue,
  VocabularyEntry as StoredVocabularyEntry
} from '@iqbspecs/metadata-values';

export type {
  MetadataProfileValues,
  MetadataValue,
  SimpleValue,
  StoredVocabularyEntry
};

export type { LanguageCodedText };

export interface UnitMetadataValues {
  profiles?: MetadataProfileValues[];
}
