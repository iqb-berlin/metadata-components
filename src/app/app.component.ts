import {Component, OnInit} from "@angular/core";
import {ProfileFormComponent} from "../../projects/ngx-metadata-components/src/lib/profile-form/profile-form.component";
import exampleProfileJson from '../../projects/ngx-metadata-components/src/lib/profile.json';
import {MDProfile} from "@iqb/metadata";
import {ProfileEntryParametersText} from "@iqb/metadata/md-profile-entry";

@Component({
  selector: 'app-root',
  template: `
<h1>Profile-Form</h1>
<iqb-profile-form
  [profile]="profile"
  [metadata]={}
  [vocabularies]=[]
  [vocabulariesIdDictionary]={}
  [language]="'de'"
  [formlyWrapper]="'panel'"
  [panelExpanded]="true"
  ></iqb-profile-form>
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
export class AppComponent implements OnInit{
  profile: MDProfile = {
    id: 'test-profile',
    groups: [
      {
        label: 'Testgruppe',
        entries: [
          {
            id: 'feld1',
            label: 'Feld 1',
            type: 'duration',
            parameters: new ProfileEntryParametersText({textLanguages: ['de']})
          },
          {
            id: 'feld2',
            label: 'Feld 2',
            type: 'formlyToggle',
            parameters: new ProfileEntryParametersText({textLanguages: ['de']})
          }
        ]
      },{
        label: 'Testgruppe2',
        entries: [
          {
            id: 'feld2',
            label: 'Feld 2',
            type: 'chips',
            parameters: new ProfileEntryParametersText({textLanguages: ['de']})
          }
        ]
      },

    ],
    label: ""
  };
  sampleProfile: any = JSON.parse(JSON.stringify(exampleProfileJson));

  ngOnInit(): void {
    console.log(this.sampleProfile);

  }
}
