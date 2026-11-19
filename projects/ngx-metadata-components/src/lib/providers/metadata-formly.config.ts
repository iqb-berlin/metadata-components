import { ConfigOption } from '@ngx-formly/core';
import { FormlyChipsComponent } from '../formly-chips/formly-chips.component';
import { FormlyToggleComponent } from '../formly-toggle/formly-toggle.component';
import { FormlyDurationComponent } from '../formly-duration/formly-duration.component';
import { FormlyWrapperPanel } from '../formly-wrapper-panel/formly-wrapper-panel.component';
import { FormlyInlineComponent } from '../formly-inline/formly-inline.component';

export const metadataFormlyConfig = {
  types: [
    { name: 'chips', component: FormlyChipsComponent, wrappers: ['form-field'] },
    { name: 'formlyToggle', component: FormlyToggleComponent, wrappers: ['form-field'] },
    { name: 'duration', component: FormlyDurationComponent, wrappers: ['form-field'] },
    { name: 'vocabInline', component: FormlyInlineComponent, wrappers: ['form-field'] }
  ],
  wrappers: [
    { name: 'panel', component: FormlyWrapperPanel }
  ]
} satisfies ConfigOption;
