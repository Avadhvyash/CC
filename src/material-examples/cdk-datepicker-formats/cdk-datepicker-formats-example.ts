import {Component, Input} from '@angular/core';
import {FormControl} from '@angular/forms';
import {MomentDateAdapter} from '@angular/material-moment-adapter';
import {DateAdapter, CDK_DATE_FORMATS, CDK_DATE_LOCALE, CalendarView} from '@angular/cdk/datetime';

// Depending on whether rollup is used, moment needs to be imported differently.
// Since Moment.js doesn't have a default export, we normally need to import using the `* as`
// syntax. However, rollup creates a synthetic default module and we thus need to import it using
// the `default as` syntax.
import * as _moment from 'moment';
// tslint:disable-next-line:no-duplicate-imports
import {default as _rollupMoment, Moment} from 'moment';

const moment = _rollupMoment || _moment;

/**
 * Collection of formats the datepicker uses when displaying and parsing dates.
 */
export const MY_CDK_FORMATS = {
  parse: {
    dateInput: 'LL',
  },
  display: {
    dateInput: 'LL',
  },
};

/** @title CDK Datepicker with custom formats */
@Component({
  selector: 'cdk-datepicker-formats-example',
  templateUrl: 'cdk-datepicker-formats-example.html',
  styleUrls: ['cdk-datepicker-formats-example.css'],
  providers: [
    // `MomentDateAdapter` can be automatically provided by importing `MomentDateModule` in your
    // application's root module. We provide it at the component level here, due to limitations of
    // our example generation script.
    {provide: DateAdapter, useClass: MomentDateAdapter, deps: [CDK_DATE_LOCALE]},

    {provide: CDK_DATE_FORMATS, useValue: MY_CDK_FORMATS},
  ],
})
export class CdkDatepickerFormatsExample {
  date = new FormControl(moment());
  dates: Moment[] = [];

  constructor() {
    this.dates.push(moment([2018, 8, 8]));
    this.dates.push(moment([2018, 9, 20]));
    this.dates.push(moment([2018, 10, 3]));
  }
}


@Component({
  selector: 'my-formats-calendar',
  outputs: ['selectedChange'],
  styles: [`
    .calendar {
      width: 400px;
      height: 150px;
      margin-top: 20px;
      margin-left: 15px;
      overflow: auto;
      background-color: #eee;
      border-radius: 5px;
      padding: 10px;
    }
  `],
  template: `
    <div class="calendar">
      <div>Date: {{selected}}</div>
      <br>
      <div>Choose an appointment date:</div>
      <div *ngFor="let date of dates">
        <button (click)="_selected(date)">{{date}}</button>
      </div>
    </div>
  `,
  providers: [{provide: CalendarView, useExisting: MyFormatsCalendar}],
})
export class MyFormatsCalendar<D> extends CalendarView<D> {
  @Input() dates: D[];

  activeDate: D | null = null;
  minDate = null;
  maxDate = null;
  selected: D | null = null;
  dateFilter: (date: D) => boolean;

  _selected(date: D) {
    this.selected = date;
    this.selectedChange.emit(date);
  }
}
