import {Component} from "@angular/core";
import {ProfileFormComponent} from "../../projects/ngx-metadata-components/src/lib/profile-form/profile-form.component";
import { TranslateService } from '@ngx-translate/core';

export function formlyValidationConfig(translate: TranslateService) {
  return {
    validationMessages: [
      {
        name: 'required',
        message() {
          return translate.stream('metadata.formly-field-required');
        }
      }
    ]
  };
}

@Component({
  selector: 'app-root',
  template: `
          <h1>Profile-Form</h1>
          <iqb-profile-form></iqb-profile-form>
  `,
  styles: [
    `
      :host {
        height:100%;
        display: block;
      }
        .coder-body {
          position: absolute;
          width: 100%;
          height: 100%;
          top: 0;
          bottom: 0;
          padding: 0;
          margin: 0;
          flex-direction: row;
          justify-content: space-between;
          align-items: stretch;
        }
      `,
    `
        .drawer-button {
          flex: 0 0 40px;
        }
      `,
    `
        .drawer-schemer {
          flex: 1 1 auto;
        }
      `,
    `
        .drawer-content {
          padding: 0;
          display: flex;
          flex-direction: row;
          justify-content: space-between;
          align-items: stretch;
          overflow: unset;
        }
      `
  ],
  standalone: true,
  providers: [ ],
  imports: [ ProfileFormComponent],
})
export class AppComponent {
  constructor(
  ) {}
}
