import { Vocab, VocabularyEntry } from './vocabulary.class';

export interface VocabularyProvider {
  getVocabularies(): Vocab[];
  getVocabularyDictionary(): Record<string, VocabularyEntry>;
}
