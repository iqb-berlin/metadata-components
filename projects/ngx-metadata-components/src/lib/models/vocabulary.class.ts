// eslint-disable-next-line max-classes-per-file
import { ProfileEntryParametersVocabulary } from '@iqbspecs/metadata-profile';

export class TopConcept {
  notation!: string[];
  /** The term by language, e.g. `{ de: 'Längsschnitt', en: 'Longitudinal' }`. */
  prefLabel!: Record<string, string>;
  narrower!: TopConcept[];
  id!: string;
}

export type NotationNode = {
  id: string,
  notation: string[],
  description?: string,
  label?: string,
  level?: number,
  checked?: boolean,
  name?: string,
  indeterminate?: boolean,
  children?: NotationNode[] | [],
  prefLabel?: Record<string, string>,
  parent?: NotationNode,
  selected?: boolean,
  narrower?: NotationNode[]
};

export class NestedTreeParameters {
  url!: string;
  allowMultipleValues!: boolean;
  maxLevel!: number;
  hideNumbering!: boolean;
  hideTitle!: boolean;
}

export class Vocabulary {
  id!: string;
  type!: string;
  title!: Record<string, string>;
  hasTopConcept!: Array<NotationNode>;
}

export type DialogData = {
  value: VocabularyEntry[],
  props: NestedTreeParameters,
  vocabularies: Vocab[],
  /** The language to show the terms in where the vocabulary brings it; else its first language. */
  language?: string
};

export class VocabNode {
  children!: VocabNode[];
  id!: string;
  label!: string;
  notation!: string[];
  description!: string;
}

/** Flat to-do item node with expandable and level information */
export class VocabFlatNode {
  id!: string;
  label!: string;
  notation!: string[];
  level!: number;
  description!: string;
  expandable!: boolean;
}

export interface VocabularyEntry {
  id: string
  name: string;
  notation: string[],
  description?: string,
  text: { lang: string, value: string } [],
}

export class VocabData {
  hasTopConcept?: TopConcept[];
  id?: string;
  title?: Record<string, string>;
  type?: string;
}

export class Vocab {
  data!: VocabData;
  url!: string;
}

export class VocabIdDictionaryValue implements ProfileEntryParametersVocabulary {
  url!: string;
  allowMultipleValues!: boolean;
  selectionMode!: 'IN_FORM' | 'DIALOG';
  maxLevel!: number;
  hideNumbering!: boolean;
  hideDescription!: boolean;
  hideTitle!: boolean;
  addTextLanguages!: string[];
  name!: string;
  notation!: string[];
  text!: { lang: string, value: string } [];
}
