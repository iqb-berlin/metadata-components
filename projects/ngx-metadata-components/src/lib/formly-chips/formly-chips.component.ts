import { Component, OnDestroy } from '@angular/core';
import { FieldType } from '@ngx-formly/material';
import { MatDialog } from '@angular/material/dialog';
import { Subject, takeUntil } from 'rxjs';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FieldTypeConfig } from '@ngx-formly/core';
import { MatIcon } from '@angular/material/icon';

import {
  MatChipGrid, MatChipRow, MatChipRemove, MatChipInput
} from '@angular/material/chips';
import { NotationNode } from '../models/vocabulary.class';
import { NestedTreeComponent } from '../nested-tree/nested-tree.component';
import { MetadataService } from '../services/metadata.service';

@Component({
  selector: 'iqb-formly-chips',
  templateUrl: './formly-chips.component.html',
  styleUrls: ['./formly-chips.component.scss'],
  standalone: true,
  imports: [MatChipGrid, MatChipRow, MatChipRemove, MatIcon, FormsModule, MatChipInput, ReactiveFormsModule]
})
export class FormlyChipsComponent extends FieldType<FieldTypeConfig> implements OnDestroy {
  private ngUnsubscribe = new Subject<void>();
  itemControl = new FormControl();

  constructor(
    private vocabsDialog: MatDialog,
    public metadataService: MetadataService
  ) {
    super();
  }

  override ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

  override get empty() {
    return this.formControl.value.length === 0;
  }

  remove(index: number): void {
    const value = Array.isArray(this.formControl.value) ? [...this.formControl.value] : [];

    if (value && index >= 0 && index < value.length) {
      value.splice(index, 1); // Entfernt das Element direkt
      this.formControl.setValue(value);
      this.formControl.markAsTouched();
    }
  }

  onBlur(): void {
    this.formControl.markAsTouched();
    this.field.focus = false;
  }

  showNodeTree(): void {
    const dialogRef = this.vocabsDialog.open(NestedTreeComponent, {
      autoFocus: false,
      data: {
        value: this.formControl.value,
        props: this.props,
        vocabularies: this.metadataService.getVocabularies()
      },
      width: '1000px'
    });

    dialogRef.afterClosed()
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((results: { nodes: NotationNode[], hideNumbering: boolean }) => {
        if (results) {
          const selectedVocabularyEntries = this.processVocabularyEntries(results);
          this.formControl.setValue(selectedVocabularyEntries);
        }
      });
  }

  private processVocabularyEntries(results: { nodes: NotationNode[], hideNumbering: boolean }): any[] {
    const vocabulariesIdDictionary = this.metadataService.getVocabulariesIdDictionary();

    return results.nodes
      .map((node: NotationNode) => this.createVocabularyEntry(node, results.hideNumbering, vocabulariesIdDictionary))
      .sort(this.sortVocabularyEntries);
  }

  private createVocabularyEntry(node: NotationNode, hideNumbering: boolean, vocabulariesIdDictionary: any): any {
    const entry = vocabulariesIdDictionary[node.id];
    // const label = vocabulariesIdDictionary[node.id]?.labels?.de || '';
    const label = entry?.label || node.label || '';
    const notation = node.notation;
    const name = `${hideNumbering ? '' : notation} ${label}`.trim();

    return {
      name,
      id: node.id,
      notation,
      text: [{ lang: 'de', value: `${hideNumbering ? '' : notation} ${label}`.trim() }]
    };
  }

  private sortVocabularyEntries(a: { name: string }, b: { name: string }): number {
    const nameA = a.name.toUpperCase();
    const nameB = b.name.toUpperCase();
    return nameA.localeCompare(nameB);
  }
}
