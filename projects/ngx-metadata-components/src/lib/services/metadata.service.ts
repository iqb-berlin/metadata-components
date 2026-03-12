import { Injectable, signal } from '@angular/core';
import { MDProfileGroup } from '@iqbspecs/metadata-profile';
import { VocabularyProvider } from '../models/vocabulary-provider.interface';
import { Vocab, VocabularyEntry } from '../models/vocabulary.class';

@Injectable({
  providedIn: 'root'
})
export class MetadataService {
  private provider = signal<VocabularyProvider | undefined>(undefined);
  unitProfileColumns = signal<MDProfileGroup[]>([]);
  itemProfileColumns = signal<MDProfileGroup>({} as MDProfileGroup);

  setVocabularyProvider(provider: VocabularyProvider): void {
    this.provider.set(provider);
  }

  getVocabularies(): Vocab[] {
    const provider = this.provider();
    if (!provider) {
      return [];
    }
    return provider.getVocabularies() as Vocab[];
  }

  getVocabulariesIdDictionary(): Record<string, VocabularyEntry> {
    const provider = this.provider();
    if (!provider) {
      return {};
    }
    return provider.getVocabularyDictionary() as Record<string, VocabularyEntry>;
  }

  vocabulariesIdDictionary() {
    return this.getVocabulariesIdDictionary();
  }
}
