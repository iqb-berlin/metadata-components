import { importProvidersFrom } from '@angular/core';
import { createApplication } from '@angular/platform-browser';
import { provideAnimations } from '@angular/platform-browser/animations';
import { createCustomElement } from '@angular/elements';
import {AppComponent} from './app/app.component';
import 'zone.js';
import {TranslateModule} from "@ngx-translate/core";

(async () => {
  const app = await createApplication({
    providers: [
      importProvidersFrom([
        TranslateModule.forRoot({
          defaultLanguage: 'de'
        }),
      ]),
      provideAnimations()]
  });

  const profileForm = createCustomElement(AppComponent, { injector: app.injector });
  customElements.define('app-root', profileForm);
})();
