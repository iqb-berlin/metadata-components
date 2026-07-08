/* eslint-disable no-console */
/* eslint-disable max-len */
/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  Component, OnInit, signal, CUSTOM_ELEMENTS_SCHEMA, effect,
  computed
} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { firstValueFrom } from 'rxjs';
import { bootstrapMetadataWebComponents } from 'ngx-metadata-components';
import { MetadataResolver } from '@iqb/metadata-resolver';
import { MDProfile } from '@iqbspecs/metadata-profile';

interface ProfileData {
  id: string;
  label: any;
  groups: any[];
}

interface MetadataData {
  profiles?: any[];
  items?: any[];
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <div class="demo-shell">
      <h1>Metadata Components Test</h1>

      <div class="demo-load-panel">
        <h3>Load Profile and Metadata</h3>

        <div style="margin-bottom: 15px;">
          <label style="display: block; margin-bottom: 5px; font-weight: bold;">
            Profile URL or Local Path:
          </label>
          <input
            type="text"
            [value]="profileUrl()"
            (input)="profileUrl.set($any($event.target).value)"
            placeholder="https://example.com/profile.json or assets/profile.json"
            style="width: 100%; padding: 8px; font-size: 14px;">
        </div>

        <div style="margin-bottom: 15px;">
          <label style="display: block; margin-bottom: 5px; font-weight: bold;">
            Metadata URL or Local Path:
          </label>
          <input
            type="text"
            [value]="metadataUrl()"
            (input)="metadataUrl.set($any($event.target).value)"
            placeholder="https://example.com/metadata.json or assets/example.vomd.json"
            style="width: 100%; padding: 8px; font-size: 14px;">
        </div>

        <div class="demo-button-row">
          <button
            class="demo-button demo-button-primary"
            (click)="loadData()"
            [disabled]="loading()">
            {{ loading() ? 'Loading...' : 'Load Data' }}
          </button>

          <button
            class="demo-button demo-button-secondary"
            (click)="loadDefaultData()"
            [disabled]="loading()">
            Load Local Examples
          </button>

          <button
            class="demo-button"
            (click)="toggleReadonly()"
            [disabled]="!profileData() || !metadataData()"
            [style.background]="readonly() ? '#ff9800' : '#4caf50'">
            {{ readonly() ? '🔒 Readonly Mode - Click to Edit' : '✏️ Edit Mode - Click to Lock' }}
          </button>
        </div>
      </div>

      @if (loading()) {
        <p>Loading data from URLs...</p>
      }

      @if (loadingVocabularies()) {
        <div style="background: #fff3e0; padding: 10px; margin: 10px 0; border-radius: 4px;">
          ⏳ Loading vocabularies...
        </div>
      }

      @if (error()) {
        <div style="color: red; padding: 10px; border: 1px solid red; margin: 10px 0; border-radius: 4px;">
          <strong>Error:</strong> {{ error() }}
        </div>
      }

      @if (profileData() && metadataData()) {
        <div class="demo-status">
          <strong>✅ Profile Loaded:</strong> {{ profileData()?.id }}
          @if (vocabularyCount() > 0) {
            <br><strong>📚 Vocabularies:</strong> {{ vocabularyCount() }} loaded
            ({{ dictionarySize() }} total entries)
          }
          <br><strong>🔒 Readonly Mode:</strong> {{ readonly() ? 'ENABLED' : 'DISABLED' }}
        </div>

        @if (!hasMetadataEntries()) {
          <div class="demo-empty-state">
            No metadata values found for this data set. The form is ready for new entries.
          </div>
        }

        <metadata-profile-form
          id="metadata-form"
          language="de">
        </metadata-profile-form>

        <div style="margin-top: 20px;">
          <h3>Current Metadata:</h3>
          <pre style="background: #f5f5f5; padding: 10px; overflow: auto; max-height: 400px; border-radius: 4px;">{{ currentMetadata() | json }}</pre>
        </div>
      }
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
    .demo-shell {
      margin: 50px auto;
      max-width: 1200px;
      padding: 20px;
    }
    .demo-load-panel {
      background: #f0f0f0;
      border-radius: 8px;
      margin-bottom: 20px;
      padding: 20px;
    }
    .demo-button-row {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
    }
    .demo-button {
      border: none;
      border-radius: 4px;
      color: white;
      cursor: pointer;
      font-size: 16px;
      padding: 10px 20px;
    }
    .demo-button-primary {
      background: #1976d2;
    }
    .demo-button-secondary {
      background: #666;
    }
    .demo-status {
      background: #e8f5e9;
      border-radius: 4px;
      margin: 10px 0;
      padding: 10px;
    }
    .demo-empty-state {
      background: #eef5ff;
      border: 1px solid #90caf9;
      border-radius: 4px;
      color: #0d47a1;
      margin: 10px 0;
      padding: 10px;
    }
    button:hover:not(:disabled) {
      opacity: 0.9;
    }
    button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    @media (max-width: 600px) {
      .demo-shell {
        margin: 24px auto;
        padding: 16px;
      }
      .demo-button {
        width: 100%;
      }
    }
  `]
})
export class AppComponent implements OnInit {
  loading = signal(false);
  loadingVocabularies = signal(false);
  error = signal<string | null>(null);
  profileUrl = signal('assets/profile.json');
  metadataUrl = signal('assets/example.vomd.json');
  profileData = signal<ProfileData | null>(null);
  metadataData = signal<MetadataData | null>(null);
  currentMetadata = signal<any>(null);
  readonly = signal(false);
  private webComponentInitialized = false;

  protected readonly Object = Object;
  vocabularyCount = computed(() => this.resolver.getVocabularies().length);
  dictionarySize = computed(() => Object.keys(this.resolver.getVocabularyDictionary()).length);
  hasMetadataEntries = computed(() => {
    const metadata = this.metadataData();
    if (!metadata) return false;

    const currentProfileMetadata = this.findCurrentProfileMetadata(metadata.profiles);

    return Boolean(currentProfileMetadata?.entries?.length);
  });

  resolver = new MetadataResolver({
    cache: true
  });

  private readonly metadataChangeHandler = (event: Event): void => {
    this.currentMetadata.set((event as CustomEvent).detail);
  };

  constructor(private http: HttpClient) {
    effect(() => {
      const profile = this.profileData();
      const metadata = this.metadataData();

      if (profile && metadata && !this.webComponentInitialized) {
        setTimeout(() => this.initializeWebComponent(), 0);
      }
    });

    effect(() => {
      const isReadonly = this.readonly();
      const form = document.getElementById('metadata-form') as any;

      if (form && this.webComponentInitialized) {
        form.readonly = isReadonly;
      }
    });
  }

  async ngOnInit(): Promise<void> {
    try {
      await bootstrapMetadataWebComponents();

      await this.loadDefaultData();
    } catch (err) {
      this.error.set(`Initialization failed: ${(err as Error).message}`);
      console.error('Error:', err);
    }
  }

  async loadDefaultData(): Promise<void> {
    this.profileUrl.set('assets/profile.json');
    this.metadataUrl.set('assets/example.vomd.json');
    await this.loadData();
  }

  async loadData(): Promise<void> {
    this.loading.set(true);
    this.loadingVocabularies.set(false);
    this.error.set(null);
    this.profileData.set(null);
    this.metadataData.set(null);
    this.currentMetadata.set(null);
    this.webComponentInitialized = false;

    try {
      const profileData = await this.loadFromUrl<ProfileData>(this.profileUrl());
      const profile = profileData as MDProfile;

      const metadata = await this.loadFromUrl<MetadataData>(this.metadataUrl());

      this.loadingVocabularies.set(true);
      await this.resolver.loadVocabularies(profile as any);
      this.loadingVocabularies.set(false);

      this.profileData.set(profile);
      this.metadataData.set(metadata);
      this.currentMetadata.set(metadata);

      this.loading.set(false);
    } catch (err) {
      this.error.set(`Failed to load data: ${(err as Error).message}`);
      this.loading.set(false);
      this.loadingVocabularies.set(false);
      console.error('Error loading data:', err);
    }
  }

  toggleReadonly(): void {
    this.readonly.set(!this.readonly());
  }

  private async loadFromUrl<T>(url: string): Promise<T> {
    try {
      const data = await firstValueFrom(
        this.http.get<T>(url)
      );

      return data;
    } catch (err) {
      throw new Error(`Failed to load from ${url}: ${(err as Error).message}`);
    }
  }

  private findCurrentProfileMetadata(metadata: any[] | undefined): any | undefined {
    if (!metadata?.length) return undefined;

    const currentProfile = this.profileData();
    const byId = metadata.find(profile => profile.profileId === currentProfile?.id);

    if (byId) return byId;

    return metadata.find(profile => profile.isCurrent === true);
  }

  initializeWebComponent(): void {
    const form = document.getElementById('metadata-form') as any;

    if (!form) {
      console.error('Web component element not found');
      this.error.set('Could not find web component element');
      return;
    }

    try {
      form.profileData = JSON.stringify(this.profileData());
      form.metadataValues = JSON.stringify(this.metadataData());
      form.language = 'de';
      form.vocabularyProvider = this.resolver;
      form.readonly = this.readonly();

      form.removeEventListener('metadataChange', this.metadataChangeHandler);
      form.addEventListener('metadataChange', this.metadataChangeHandler);

      this.webComponentInitialized = true;
    } catch (err) {
      console.error(' Error initializing web component:', err);
      this.error.set(`Failed to initialize web component: ${(err as Error).message}`);
    }
  }
}
