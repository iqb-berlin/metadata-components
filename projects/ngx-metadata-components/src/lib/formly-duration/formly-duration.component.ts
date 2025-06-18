import { Component, OnDestroy, OnInit } from '@angular/core';
import { FieldTypeConfig, FormlyFieldProps } from '@ngx-formly/core';
import { FieldType } from '@ngx-formly/material';
import { Subject, takeUntil } from 'rxjs';
import { MatInput } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { DurationService } from '../services/duration.service';
import { Duration } from '../models/duration.interface';

interface FormlyDurationProps extends FormlyFieldProps {
  minValue?: number;
  maxValue?: number;
}

@Component({
  selector: 'iqb-formly-duration',
  templateUrl: './formly-duration.component.html',
  styleUrls: ['./formly-duration.component.scss'],
  standalone: true,
  imports: [MatFormField, MatLabel, FormsModule, MatInput]
})
export class FormlyDurationComponent
  extends FieldType<FieldTypeConfig<FormlyDurationProps>> implements OnInit, OnDestroy {
  duration: Duration = { minutes: '0', seconds: '0' };
  minSeconds = 0;
  maxSeconds!: number;
  minMinutes = 0;
  maxMinutes!: number;

  private ngUnsubscribe = new Subject<void>();
  ngOnInit(): void {
    this.convertSecondsToMinutes(this.formControl.value || 0);
    this.setMinMaxValues();
    this.formControl.valueChanges
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe(v => this.convertSecondsToMinutes(v || 0));
  }

  private setMinMaxValues(): void {
    const calculateMinOrMax = (value: number): [number, number] => {
      if (value < 60) {
        return [value, 0];
      } else {
        return [0, Math.floor(value / 60)];
      }
    };

    const minValue = Number(this.props.minValue) || 0;
    [this.minSeconds, this.minMinutes] = calculateMinOrMax(minValue);

    const maxValue = Number(this.props.maxValue) || 0;
    if (maxValue) {
      [this.maxSeconds, this.maxMinutes] = calculateMinOrMax(maxValue);
      if (this.maxMinutes > 0) this.maxSeconds = 60;
    } else {
      this.maxSeconds = 0;
      this.maxMinutes = 0;
    }
  }

  private convertSecondsToMinutes(totalSeconds: number): void {
    this.duration = DurationService.convertSecondsToMinutes(totalSeconds);
  }

  private convertMinutesToSeconds(): number {
    const minutes = Number(this.duration.minutes);
    const seconds: number = Number(this.duration.seconds);
    return minutes * 60 + seconds;
  }

  durationChange() {
    const total = this.convertMinutesToSeconds();
    this.convertSecondsToMinutes(total);
    this.formControl.setValue(total);
  }

  override ngOnDestroy(): void {
    super.ngOnDestroy();
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }
}
