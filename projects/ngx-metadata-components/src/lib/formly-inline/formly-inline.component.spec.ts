import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatRadioModule } from '@angular/material/radio';
import { FormlyInlineComponent } from './formly-inline.component';
import { MetadataService } from '../services/metadata.service';
import { Vocab, VocabularyEntry } from '../models/vocabulary.class';

describe('FormlyInlineComponent', () => {
  let component: FormlyInlineComponent;
  let fixture: ComponentFixture<FormlyInlineComponent>;
  let mockMetadataService: jasmine.SpyObj<MetadataService>;

  const mockVocabularies: Vocab[] = [
    {
      url: 'https://w3id.org/iqb/v24/kh/',
      data: {
        hasTopConcept: [
          {
            id: 'option-1',
            prefLabel: { de: 'Option 1' },
            notation: ['1'],
            narrower: []
          },
          {
            id: 'option-2',
            prefLabel: { de: 'Option 2' },
            notation: ['2'],
            narrower: []
          }
        ]
      }
    }
  ] as unknown as Vocab[];

  beforeEach(async () => {
    mockMetadataService = jasmine.createSpyObj<MetadataService>('MetadataService', ['getVocabularies']);
    mockMetadataService.getVocabularies.and.returnValue(mockVocabularies);

    await TestBed.configureTestingModule({
      imports: [
        ReactiveFormsModule,
        MatCheckboxModule,
        MatRadioModule,
        FormlyInlineComponent
      ],
      providers: [
        { provide: MetadataService, useValue: mockMetadataService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(FormlyInlineComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    component.field = {
      formControl: new FormControl<VocabularyEntry[]>([]),
      props: {
        url: 'https://w3id.org/iqb/v24/kh/',
        allowMultipleValues: true
      }
    };
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('renders checkboxes when allowMultipleValues is true', () => {
    component.field = {
      formControl: new FormControl<VocabularyEntry[]>([]),
      props: {
        url: 'https://w3id.org/iqb/v24/kh/',
        allowMultipleValues: true
      }
    };
    fixture.detectChanges();

    const checkboxes = fixture.nativeElement.querySelectorAll('mat-checkbox');
    const radioButtons = fixture.nativeElement.querySelectorAll('mat-radio-button');

    expect(checkboxes.length).toBe(2);
    expect(radioButtons.length).toBe(0);
  });

  it('renders radio buttons when allowMultipleValues is false', () => {
    component.field = {
      formControl: new FormControl<VocabularyEntry[]>([]),
      props: {
        url: 'https://w3id.org/iqb/v24/kh/',
        allowMultipleValues: false
      }
    };
    fixture.detectChanges();

    const checkboxes = fixture.nativeElement.querySelectorAll('mat-checkbox');
    const radioButtons = fixture.nativeElement.querySelectorAll('mat-radio-button');

    expect(checkboxes.length).toBe(0);
    expect(radioButtons.length).toBe(2);
  });

  it('allows unselecting radio button when clicking on a selected one', () => {
    const control = new FormControl<VocabularyEntry[]>([
      {
        id: 'option-1',
        name: '1 Option 1',
        notation: ['1'],
        text: [{ lang: 'de', value: 'Option 1' }]
      }
    ]);
    component.field = {
      formControl: control,
      props: {
        url: 'https://w3id.org/iqb/v24/kh/',
        allowMultipleValues: false
      }
    };
    fixture.detectChanges();

    const radioButtons = fixture.nativeElement.querySelectorAll('mat-radio-button');
    expect(radioButtons.length).toBe(2);

    // click the first radio button (which is already selected)
    radioButtons[0].click();
    fixture.detectChanges();

    expect(control.value).toEqual([]);
  });

  it('selects radio button when clicking on an unselected one', () => {
    const control = new FormControl<VocabularyEntry[]>([]);
    component.field = {
      formControl: control,
      props: {
        url: 'https://w3id.org/iqb/v24/kh/',
        allowMultipleValues: false
      }
    };
    fixture.detectChanges();

    const radioButtons = fixture.nativeElement.querySelectorAll('mat-radio-button');
    expect(radioButtons.length).toBe(2);

    // click the first radio button
    radioButtons[0].click();
    fixture.detectChanges();

    expect(control.value).toEqual([
      {
        id: 'option-1',
        name: '1 Option 1',
        notation: ['1'],
        text: [{ lang: 'de', value: 'Option 1' }]
      }
    ]);
  });
});
