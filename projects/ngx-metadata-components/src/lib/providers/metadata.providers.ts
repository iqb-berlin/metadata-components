import {
  EnvironmentProviders,
  makeEnvironmentProviders,
  provideZonelessChangeDetection
} from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { MetadataService } from '../services/metadata.service';
import { DurationService } from '../services/duration.service';

export function provideMetadataComponents(): EnvironmentProviders {
  return makeEnvironmentProviders([
    provideZonelessChangeDetection(),
    provideHttpClient(),
    MetadataService,
    DurationService
  ]);
}
