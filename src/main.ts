import { importProvidersFrom } from '@angular/core';
import { createApplication } from '@angular/platform-browser';
import { provideAnimations } from '@angular/platform-browser/animations';
import { createCustomElement } from '@angular/elements';
import {AppComponent, formlyValidationConfig} from './app/app.component';
import 'zone.js';
import {FORMLY_CONFIG, FormlyModule} from "@ngx-formly/core";
import {
  FormlyWrapperPanel
} from "../projects/ngx-metadata-components/src/lib/formly-wrapper-panel/formly-wrapper-panel.component";
import {FormlyChipsComponent} from "../projects/ngx-metadata-components/src/lib/formly-chips/formly-chips.component";
import {FormlyToggleComponent} from "../projects/ngx-metadata-components/src/lib/formly-toggle/formly-toggle.component";
import {TranslateService} from "@ngx-translate/core";

(async () => {
  const app = await createApplication({
    providers: [
      {
        provide: FORMLY_CONFIG,
        multi: true,
        useFactory: formlyValidationConfig,
        deps: [TranslateService]
      },

      importProvidersFrom([
        FormlyModule.forRoot({
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
              name: 'formlyToggle',
              wrappers: ['form-field'],
              component: FormlyToggleComponent,
              defaultOptions: {
                defaultValue: false
              }
            },

          ]
        }),
      ]),
      provideAnimations()]
  });

  const profileForm = createCustomElement(AppComponent, { injector: app.injector });
  customElements.define('app-root', profileForm);
})();
