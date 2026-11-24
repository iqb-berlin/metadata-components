import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslateModule } from '@ngx-translate/core';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatTreeModule } from '@angular/material/tree';
import { NestedTreeComponent } from './nested-tree.component';

describe('NestedTreeNodeComponent', () => {
  let component: NestedTreeComponent;
  let fixture: ComponentFixture<NestedTreeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        MatCheckboxModule,
        MatDialogModule,
        MatTreeModule,
        TranslateModule.forRoot()
      ],
      providers: [
        {
          provide: MAT_DIALOG_DATA,
          useValue: {
            value: null,
            props: {},
            vocabularies: []
          }
        }
      ]

    }).compileComponents();

    fixture = TestBed.createComponent(NestedTreeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('renders translatable action buttons with data-cy hooks', () => {
    const confirm = fixture.nativeElement
      .querySelector('[data-cy="metadata-nested-tree-confirm-button"]');
    const cancel = fixture.nativeElement
      .querySelector('[data-cy="metadata-nested-tree-cancel-button"]');
    // With the default (no-op) TranslateLoader the pipe echoes the key,
    // proving the buttons run through translate instead of a hardcoded label.
    expect(confirm?.textContent?.trim()).toBe('confirm');
    expect(cancel?.textContent?.trim()).toBe('cancel');
  });
});

describe('NestedTreeComponent with a term already chosen', () => {
  const url = 'https://w3id.org/iqb/v85/dt/';
  const chosenId = `${url}3`;

  it('keeps the whole label of a chosen term without numbering', async () => {
    await TestBed.configureTestingModule({
      imports: [MatCheckboxModule, MatDialogModule, MatTreeModule, TranslateModule.forRoot()],
      providers: [
        {
          provide: MAT_DIALOG_DATA,
          useValue: {
            // As the form hands it over when the field hides the numbering: the name is the bare label.
            value: [{
              id: chosenId,
              name: 'Umfrage- und Aggregatedaten',
              notation: [],
              text: [{ lang: 'de', value: 'Umfrage- und Aggregatedaten' }]
            }],
            props: {
              url, allowMultipleValues: true, maxLevel: 0, hideNumbering: true, hideTitle: false
            },
            vocabularies: [{
              url,
              data: {
                hasTopConcept: [
                  {
                    id: `${url}1`, prefLabel: { de: 'Kompetenz- und Leistungsdaten' }, notation: [], narrower: []
                  },
                  {
                    id: chosenId, prefLabel: { de: 'Umfrage- und Aggregatedaten' }, notation: [], narrower: []
                  }
                ]
              }
            }]
          }
        }
      ]
    }).compileComponents();

    const fixture = TestBed.createComponent(NestedTreeComponent);
    fixture.detectChanges();

    // What the confirm button hands to the form, which saves the label as the term's text.
    expect(fixture.componentInstance.selectedNodesList.map(node => node.label))
      .toEqual(['Umfrage- und Aggregatedaten']);
    expect(fixture.nativeElement.textContent).toContain('Umfrage- und Aggregatedaten');
  });
});
