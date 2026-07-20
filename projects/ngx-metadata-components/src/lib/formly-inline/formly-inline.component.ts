import { Component, OnInit, OnDestroy } from '@angular/core';
import { FieldType } from '@ngx-formly/material';
import { FieldTypeConfig, FormlyFieldProps } from '@ngx-formly/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatCheckbox } from '@angular/material/checkbox';
import { interval, Subject, takeUntil } from 'rxjs';
import { MetadataService } from '../services/metadata.service';
import { VocabularyEntry, Vocab, TopConcept } from '../models/vocabulary.class';

interface VocabOption {
  id: string;
  label: string;
  notation: string[];
  description: string;
  level: number;
}

interface FormlyVocabInlineProps extends FormlyFieldProps {
  url?: string;
  allowMultipleValues?: boolean;
  hideNumbering?: boolean;
  hideTitle?: boolean;
  hideDescription?: boolean;
  maxLevel?: number;
}

@Component({
  selector: 'iqb-formly-inline',
  templateUrl: './formly-inline.component.html',
  styleUrls: ['./formly-inline.component.scss'],
  standalone: true,
  imports: [FormsModule, ReactiveFormsModule, MatCheckbox]
})
export class FormlyInlineComponent
  extends FieldType<FieldTypeConfig<FormlyVocabInlineProps>> implements OnInit, OnDestroy {
  options_: VocabOption[] = [];
  private ngUnsubscribe = new Subject<void>();

  constructor(public metadataService: MetadataService) {
    super();
  }

  ngOnInit(): void {
    this.options_ = this.buildOptions();

    if (this.options_.length === 0) {
      interval(200).pipe(takeUntil(this.ngUnsubscribe)).subscribe(() => {
        this.options_ = this.buildOptions();
        if (this.options_.length > 0) {
          this.ngUnsubscribe.next();
        }
      });
    }
  }

  override ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

  get selectedIds(): string[] {
    const value = this.formControl.value;
    if (!Array.isArray(value)) return [];
    return value.map((v: VocabularyEntry) => v.id);
  }

  isSelected(optionId: string): boolean {
    return this.selectedIds.includes(optionId);
  }

  onCheckboxChange(option: VocabOption, checked: boolean): void {
    if (this.props.allowMultipleValues) {
      const current: VocabularyEntry[] = Array.isArray(this.formControl.value) ?
        [...this.formControl.value] :
        [];

      if (checked) {
        if (!current.find(v => v.id === option.id)) {
          current.push(this.toVocabularyEntry(option));
        }
      } else {
        const index = current.findIndex(v => v.id === option.id);
        if (index >= 0) current.splice(index, 1);
      }

      this.formControl.setValue(current);
    } else if (checked) {
      this.formControl.setValue([this.toVocabularyEntry(option)]);
    } else {
      this.formControl.setValue([]);
    }

    this.formControl.markAsTouched();
  }

  private toVocabularyEntry(option: VocabOption): VocabularyEntry {
    const hideNumbering = this.props.hideNumbering || false;
    const notation = option.notation?.[0] || '';
    const name = `${hideNumbering ? '' : notation} ${option.label}`.trim();

    return {
      id: option.id,
      name,
      notation: option.notation,
      // 'text' = reiner Begriff; die Nummerierung wandert beim Speichern nach 'annotation'.
      text: [{ lang: 'de', value: option.label }]
    };
  }

  private buildOptions(): VocabOption[] {
    const url = this.props.url;
    if (!url) return [];

    const vocabularies = this.metadataService.getVocabularies();
    const vocab = vocabularies.find((v: Vocab) => v.url === url) ||
      vocabularies.find((v: Vocab) => v.url.toLowerCase() === url.toLowerCase());
    if (!vocab?.data?.hasTopConcept) return [];

    const maxLevel = this.props.maxLevel || 0;
    const result: VocabOption[] = [];
    this.flattenConcepts(vocab.data.hasTopConcept, result, 0, maxLevel);
    return result;
  }

  private flattenConcepts(
    concepts: TopConcept[],
    result: VocabOption[],
    currentLevel: number,
    maxLevel: number
  ): void {
    concepts.forEach(concept => {
      result.push({
        id: concept.id,
        label: concept.prefLabel?.de || '',
        notation: concept.notation || [],
        description: '',
        level: currentLevel
      });

      if (concept.narrower?.length && (maxLevel === 0 || currentLevel + 1 < maxLevel)) {
        this.flattenConcepts(concept.narrower, result, currentLevel + 1, maxLevel);
      }
    });
  }
}
