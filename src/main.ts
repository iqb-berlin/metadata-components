import { importProvidersFrom } from '@angular/core';
import { createApplication, BrowserModule } from '@angular/platform-browser';
import { provideAnimations } from '@angular/platform-browser/animations';
import { createCustomElement } from '@angular/elements';
import {AppComponent} from './app/app.component';
import {TranslateModule} from "@ngx-translate/core";
import { FormlyMaterialModule } from '@ngx-formly/material';
import { provideFormlyCore } from '@ngx-formly/core';
import { FormlyWrapperPanel } from '../projects/ngx-metadata-components/src/lib/formly-wrapper-panel/formly-wrapper-panel.component';
import { FormlyChipsComponent } from '../projects/ngx-metadata-components/src/lib/formly-chips/formly-chips.component';
import { FormlyDurationComponent } from '../projects/ngx-metadata-components/src/lib/formly-duration/formly-duration.component';
import { FormlyToggleComponent } from '../projects/ngx-metadata-components/src/lib/formly-toggle/formly-toggle.component';

(async () => {
  const app = await createApplication({
    providers: [
      provideFormlyCore(
        {
          wrappers: [
            {
              name: 'panel',
              component: FormlyWrapperPanel
            }
          ],
          types: [
            {
              name: 'chips',
              wrappers: ['form-field'],
              component: FormlyChipsComponent,
              defaultOptions: {
                defaultValue: []
              }
            },
            {
              name: 'duration',
              component: FormlyDurationComponent
            },
            {
              name: 'formlyToggle',
              wrappers: ['form-field'],
              component: FormlyToggleComponent,
              defaultOptions: {
                defaultValue: false
              }
            },

          ],
          validationMessages: [
            { name: 'required', message: 'This field is required' },
          ],
        }
      ),
      importProvidersFrom([
        BrowserModule,
        FormlyMaterialModule,
        TranslateModule.forRoot({
          defaultLanguage: 'de'
        }),
      ]),
      provideAnimations()]
  });

  const profileForm = createCustomElement(AppComponent, { injector: app.injector });
  customElements.define('app-root', profileForm);
})();
