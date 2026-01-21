/* eslint-disable import/no-extraneous-dependencies */
import { createCustomElement } from '@angular/elements';
import { createApplication } from '@angular/platform-browser';
import { importProvidersFrom, provideZonelessChangeDetection } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { provideHttpClient } from '@angular/common/http';
import { FormlyModule } from '@ngx-formly/core';
import { FormlyMaterialModule } from '@ngx-formly/material';
import { ProfileFormComponent } from './profile-form/profile-form.component';
import { MetadataService } from './services/metadata.service';
import { FormlyChipsComponent } from './formly-chips/formly-chips.component';
import { FormlyToggleComponent } from './formly-toggle/formly-toggle.component';
import { FormlyDurationComponent } from './formly-duration/formly-duration.component';
import { FormlyWrapperPanel } from './formly-wrapper-panel/formly-wrapper-panel.component';

export async function bootstrapMetadataWebComponents(): Promise<void> {
  const app = await createApplication({
    providers: [
      provideZonelessChangeDetection(),
      provideHttpClient(),
      MetadataService,
      importProvidersFrom(
        ReactiveFormsModule,
        FormlyModule.forRoot({
          types: [
            { name: 'chips', component: FormlyChipsComponent, wrappers: ['form-field'] },
            { name: 'formlyToggle', component: FormlyToggleComponent, wrappers: ['form-field'] },
            { name: 'duration', component: FormlyDurationComponent, wrappers: ['form-field'] }
          ],
          wrappers: [
            { name: 'panel', component: FormlyWrapperPanel }
          ]
        }),
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
