import { bootstrapApplication } from '@angular/platform-browser';
import { provideZonelessChangeDetection, importProvidersFrom } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { FormlyModule } from '@ngx-formly/core';
import { FormlyMaterialModule } from '@ngx-formly/material';
import { ReactiveFormsModule } from '@angular/forms';
import {
  FormlyChipsComponent,
  FormlyToggleComponent,
  FormlyDurationComponent,
  FormlyWrapperPanel
} from 'ngx-metadata-components';
import { AppComponent } from './app/app.component';

bootstrapApplication(AppComponent, {
  providers: [
    provideZonelessChangeDetection(),
    provideHttpClient(),
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
}).catch(err => console.error(err));
