import { Injectable, signal } from '@angular/core';
import { MDProfileGroup } from '@iqb/metadata';
import { MetadataResolver } from '@iqb/metadata-resolver';
import { Vocab, VocabularyEntry } from '../models/vocabulary.class';

@Injectable({
  providedIn: 'root'
})
export class MetadataService {
  private resolver = signal<MetadataResolver | undefined>(undefined);
  unitProfileColumns = signal<MDProfileGroup[]>([]);
  itemProfileColumns = signal<MDProfileGroup>({} as MDProfileGroup);

  setResolver(resolver: MetadataResolver): void {
    this.resolver.set(resolver);
    console.log('Resolver set in MetadataService');
  }

  /**
   * Get vocabularies from resolver
   */
  getVocabularies(): Vocab[] {
    const resolver = this.resolver();
    if (!resolver) {
      console.warn('Resolver not set in MetadataService');
      return [];
    }
    return resolver.getVocabularies() as Vocab[];
  }

  /**
   * Get vocabulary dictionary from resolver
   */
  getVocabulariesIdDictionary(): Record<string, VocabularyEntry> {
    const resolver = this.resolver();
    if (!resolver) {
      console.warn('Resolver not set in MetadataService');
      return {};
    }
    return resolver.getVocabularyDictionary() as Record<string, VocabularyEntry>;
  }

  /**
   * For backward compatibility - check if vocabularies are loaded
   */
  vocabulariesIdDictionary() {
    return this.getVocabulariesIdDictionary();
  }
}
