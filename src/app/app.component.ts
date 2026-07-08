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
    <div style="max-width: 1200px; margin: 50px auto; padding: 20px;">
      <h1>Metadata Components Test</h1>

      <div style="background: #f0f0f0; padding: 20px; margin-bottom: 20px; border-radius: 8px;">
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

        <button
          (click)="loadData()"
          [disabled]="loading()"
          style="background: #1976d2; color: white; padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer; font-size: 16px;">
          {{ loading() ? 'Loading...' : 'Load Data' }}
        </button>

        <button
          (click)="loadDefaultData()"
          [disabled]="loading()"
          style="background: #666; color: white; padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer; font-size: 16px; margin-left: 10px;">
          Load Local Examples
        </button>

        <button
          (click)="toggleReadonly()"
          [disabled]="!profileData() || !metadataData()"
          [style.background]="readonly() ? '#ff9800' : '#4caf50'"
          style="color: white; padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer; font-size: 16px; margin-left: 10px;">
          {{ readonly() ? '🔒 Readonly Mode - Click to Edit' : '✏️ Edit Mode - Click to Lock' }}
        </button>
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
        <div style="background: #e8f5e9; padding: 10px; margin: 10px 0; border-radius: 4px;">
          <strong>✅ Profile Loaded:</strong> {{ profileData()?.id }}
          @if (vocabularyCount() > 0) {
            <br><strong>📚 Vocabularies:</strong> {{ vocabularyCount() }} loaded
            ({{ dictionarySize() }} total entries)
          }
          <br><strong>🔒 Readonly Mode:</strong> {{ readonly() ? 'ENABLED' : 'DISABLED' }}
        </div>

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
    button:hover:not(:disabled) {
      opacity: 0.9;
    }
    button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
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

  resolver = new MetadataResolver({
    cache: true
  });

  constructor(private http: HttpClient) {
    effect(() => {
      const profile = this.profileData();
      const metadata = this.metadataData();

      if (profile && metadata && !this.webComponentInitialized) {
        setTimeout(() => this.initializeWebComponent(), 0);
      }
    });

    // React to readonly changes
    effect(() => {
      const isReadonly = this.readonly();
      const form = document.getElementById('metadata-form') as any;

      if (form && this.webComponentInitialized) {
        console.log('Readonly changed to:', isReadonly);
        form.readonly = isReadonly;
      }
    });
  }

  async ngOnInit(): Promise<void> {
    try {
      console.log('Starting initialization...');
      await bootstrapMetadataWebComponents();
      console.log('✅ Web components registered');

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
    this.error.set(null);
    this.webComponentInitialized = false;

    try {
      console.log(`Loading profile from: ${this.profileUrl()}`);
      console.log(`Loading metadata from: ${this.metadataUrl()}`);

      const profileData = await this.loadFromUrl<ProfileData>(this.profileUrl());
      const profile = profileData as MDProfile;
      this.profileData.set(profile);
      console.log('Profile loaded:', profile.id);

      const metadata = await this.loadFromUrl<MetadataData>(this.metadataUrl());
      this.metadataData.set(metadata);
      this.currentMetadata.set(metadata);
      console.log('Metadata loaded');

      console.log('Loading vocabularies...');
      await this.resolver.loadVocabularies(profile as any);

      console.log(`Loaded ${this.resolver.getVocabularies().length} vocabularies`);
      console.log(`Dictionary: ${Object.keys(this.resolver.getVocabularyDictionary()).length} entries`);

      this.loading.set(false);
    } catch (err) {
      this.error.set(`Failed to load data: ${(err as Error).message}`);
      this.loading.set(false);
      console.error('Error loading data:', err);
    }
  }

  toggleReadonly(): void {
    const newValue = !this.readonly();
    console.log('Toggle readonly:', newValue);
    this.readonly.set(newValue);
  }

  private async loadFromUrl<T>(url: string): Promise<T> {
    try {
      const isRelativePath = !url.startsWith('http://') && !url.startsWith('https://');

      if (isRelativePath) {
        console.log(`Loading local file: ${url}`);
      } else {
        console.log(`Loading remote URL: ${url}`);
      }

      const data = await firstValueFrom(
        this.http.get<T>(url)
      );

      return data;
    } catch (err) {
      throw new Error(`Failed to load from ${url}: ${(err as Error).message}`);
    }
  }

  initializeWebComponent(): void {
    const form = document.getElementById('metadata-form') as any;

    if (!form) {
      console.error('Web component element not found');
      this.error.set('Could not find web component element');
      return;
    }

    try {
      console.log('Initializing web component...');
      console.log('   Profile:', this.profileData()?.id);
      console.log('   Vocabularies:', this.resolver.getVocabularies().length);
      console.log('   Dictionary entries:', Object.keys(this.resolver.getVocabularyDictionary()).length);
      console.log('   Readonly:', this.readonly());

      form.profileData = JSON.stringify(this.profileData());
      form.metadataValues = JSON.stringify(this.metadataData());
      form.language = 'de';
      form.vocabularyProvider = this.resolver;
      form.readonly = this.readonly();

      form.addEventListener('metadataChange', (event: CustomEvent) => {
        console.log('Metadata changed:', event.detail);
        this.currentMetadata.set(event.detail);
      });

      this.webComponentInitialized = true;
      console.log('Web component initialized successfully');

      // Debug: Check if readonly attribute is set
      setTimeout(() => {
        console.log('Web component readonly attribute:', form.getAttribute('readonly'));
        console.log('Web component readonly property:', form.readonly);
      }, 100);
    } catch (err) {
      console.error(' Error initializing web component:', err);
      this.error.set(`Failed to initialize web component: ${(err as Error).message}`);
    }
  }
}
