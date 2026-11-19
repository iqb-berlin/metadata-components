/* eslint-disable import/no-extraneous-dependencies */
import { createCustomElement } from '@angular/elements';
import { createApplication } from '@angular/platform-browser';
import { importProvidersFrom, provideZonelessChangeDetection } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { provideHttpClient } from '@angular/common/http';
import { TranslateModule } from '@ngx-translate/core';
import { FormlyModule } from '@ngx-formly/core';
import { FormlyMaterialModule } from '@ngx-formly/material';
import { ProfileFormComponent } from './profile-form/profile-form.component';
import { MetadataService } from './services/metadata.service';
import { metadataFormlyConfig } from './providers/metadata-formly.config';

export async function bootstrapMetadataWebComponents(): Promise<void> {
  const app = await createApplication({
    providers: [
      provideZonelessChangeDetection(),
      provideHttpClient(),
      MetadataService,
      importProvidersFrom(
        TranslateModule.forRoot(),
        ReactiveFormsModule,
        FormlyModule.forRoot(metadataFormlyConfig),
        FormlyMaterialModule
      )
    ]
  });

  const profileFormElement = createCustomElement(ProfileFormComponent, {
    injector: app.injector
  });

  if (!customElements.get('metadata-profile-form')) {
    customElements.define('metadata-profile-form', profileFormElement);
  }
}
