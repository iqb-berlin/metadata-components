import { provideHttpClient } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AppComponent } from './app.component';

describe('AppComponent', () => {
  let fixture: ComponentFixture<AppComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [provideHttpClient()]
    }).compileComponents();

    fixture = TestBed.createComponent(AppComponent);
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should only count entries from the currently rendered profile', () => {
    const component = fixture.componentInstance;

    component.profileData.set({
      id: 'current-profile',
      label: [],
      groups: []
    });
    component.metadataData.set({
      profiles: [
        {
          profileId: 'current-profile',
          isCurrent: true,
          entries: []
        },
        {
          profileId: 'other-profile',
          entries: [{ id: 'other-entry' }]
        }
      ],
      items: [
        {
          profiles: [
            {
              profileId: 'item-profile',
              entries: [{ id: 'item-entry' }]
            }
          ]
        }
      ]
    });

    expect(component.hasMetadataEntries()).toBeFalse();

    component.metadataData.set({
      profiles: [
        {
          profileId: 'current-profile',
          entries: [{ id: 'current-entry' }]
        }
      ],
      items: []
    });

    expect(component.hasMetadataEntries()).toBeTrue();
  });

  it('should use isCurrent metadata as fallback when profile ids do not match', () => {
    const component = fixture.componentInstance;

    component.profileData.set({
      id: 'current-profile',
      label: [],
      groups: []
    });
    component.metadataData.set({
      profiles: [
        {
          profileId: 'legacy-profile',
          isCurrent: true,
          entries: [{ id: 'legacy-entry' }]
        }
      ],
      items: []
    });

    expect(component.hasMetadataEntries()).toBeTrue();
  });
});
