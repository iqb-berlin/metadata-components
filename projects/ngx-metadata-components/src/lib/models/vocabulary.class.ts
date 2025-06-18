// eslint-disable-next-line max-classes-per-file
import {ProfileEntryParametersVocabulary} from "@iqb/metadata/md-profile-entry";
import {TextWithLanguage} from "@iqb/metadata/md-main";

export class TopConcept {
  notation!: string[];
  prefLabel!: { de: string };
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
  prefLabel?: {
    de: string
  },
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
  title!: { de: string };
  hasTopConcept!: Array<NotationNode>;
}

export type DialogData = {
  value: VocabularyEntry[],
  props: NestedTreeParameters,
  vocabularies: Vocab[]
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
  text: TextWithLanguage[],
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

export class VocabIdDictionaryValue extends ProfileEntryParametersVocabulary {
  labels!: Record<'de', string>;
  notation!: string[];
}
