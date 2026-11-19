import { bootstrapApplication } from '@angular/platform-browser';
import { provideZonelessChangeDetection, importProvidersFrom } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { FormlyModule } from '@ngx-formly/core';
import { FormlyMaterialModule } from '@ngx-formly/material';
import { ReactiveFormsModule } from '@angular/forms';
import { metadataFormlyConfig } from 'ngx-metadata-components';
import { AppComponent } from './app/app.component';

bootstrapApplication(AppComponent, {
  providers: [
    provideZonelessChangeDetection(),
    provideHttpClient(),
    importProvidersFrom(
      ReactiveFormsModule,
      FormlyModule.forRoot(metadataFormlyConfig),
      FormlyMaterialModule
    )
  ]
}).catch(error => {
  setTimeout(() => {
    throw error;
  });
});
