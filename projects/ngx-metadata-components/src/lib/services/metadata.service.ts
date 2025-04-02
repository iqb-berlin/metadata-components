import { Injectable } from '@angular/core';
import {Vocab, VocabIdDictionaryValue} from "../models/vocabulary.class";

@Injectable({
  providedIn: 'root'
})

export class MetadataService {
  private vocabularies: Vocab[] = [];
  private vocabulariesIdDictionary: Record<string, VocabIdDictionaryValue> = {};

  storeVocabularies(vocabularies: Vocab[]): void {
    this.vocabularies = vocabularies;
  }

  getVocabularies(): Vocab[] {
    return this.vocabularies;
  }

  storevocabulariesIdDictionary(vocabularies: Record<string, VocabIdDictionaryValue>): void {
    this.vocabulariesIdDictionary = vocabularies;
  }

  getvocabulariesIdDictionary(): Record<string, VocabIdDictionaryValue> {
    return this.vocabulariesIdDictionary;
  }
}
