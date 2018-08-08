/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {
  ChangeDetectionStrategy,
  Component,
  Input,
  Optional,
  ViewEncapsulation,
  OnDestroy,
  ContentChild,
  AfterContentInit,
} from '@angular/core';
import {Subject, Subscription} from 'rxjs';
import {DateAdapter} from './date-adapter';
import {CdkDatepickerInput} from './datepicker-input';
import {CalendarView} from './calendar-view';
import {coerceBooleanProperty} from '@angular/cdk/coercion';

/** Used to generate a unique ID for each datepicker instance. */
let datepickerUid = 0;

/** Component used to wire together the datepicker input and calendar view. */
@Component({
  moduleId: module.id,
  selector: 'cdk-datepicker',
  host: {
    '[id]': 'id',
  },
  template: '<ng-content></ng-content>',
  exportAs: 'cdkDatepicker',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class CdkDatepicker<D> implements OnDestroy, AfterContentInit {
  /** The initial date of the datepicker. */
  @Input()
  get startAt(): D | null {
    // If an explicit startAt is set we start there, otherwise we start at whatever the currently
    // selected value is.
    return this._startAt || (this._datepickerInput ? this._datepickerInput.value : null);
  }
  set startAt(value: D | null) {
    this._startAt = this._getValidDateOrNull(this._dateAdapter.deserialize(value));
    if (this.view) {
      this.view.activeDate = this._startAt;
    }
  }
  private _startAt: D | null;

  /** Whether the datepicker should be disabled. */
  @Input()
  get disabled(): boolean {
    return this._disabled === undefined && this._datepickerInput ?
        this._datepickerInput.disabled : !!this._disabled;
  }
  set disabled(value: boolean) {
    const newValue = coerceBooleanProperty(value);

    if (newValue !== this._disabled) {
      this._disabled = newValue;
      this._disabledChange.next(newValue);
    }
  }
  private _disabled: boolean;

  /** The calendar view displayed in this datepicker. */
  @ContentChild(CalendarView) view: CalendarView<D>;

  /** The id for the datepicker calendar. */
  @Input() id: string = `cdk-datepicker-${datepickerUid++}`;

  /** The currently selected date. */
  _selected: D | null = null;

  /** The minimum selectable date. */
  get _minDate(): D | null {
    return this._datepickerInput && this._datepickerInput.min;
  }
  set minDate(date: D | null) {
    if (this.view) {
      this.view.minDate = date;
    }
  }

  /** The maximum selectable date. */
  get _maxDate(): D | null {
    return this._datepickerInput && this._datepickerInput.max;
  }
  set maxDate(date: D | null) {
    if (this.view) {
      this.view.maxDate = date;
    }
  }

  /** The filter function used to determine which dates are selectable. */
  get _dateFilter(): (date: D | null) => boolean {
    return this._datepickerInput && this._datepickerInput._dateFilter;
  }
  set dateFilter(value: (date: D | null) => boolean) {
    if (this.view) {
      this.view.dateFilter = value;
    }
  }

  /** Subscription to value changes in the associated input element. */
  private _inputSubscription = Subscription.EMPTY;

  /** The input element this datepicker is associated with. */
  _datepickerInput: CdkDatepickerInput<D>;

  /** Emits when the datepicker's disabled state changes. */
  readonly _disabledChange = new Subject<boolean>();

  /** Emits new selected date when selected date changes. */
  readonly _selectedChanged = new Subject<D>();

  constructor(@Optional() protected _dateAdapter: DateAdapter<D>) {
    if (!this._dateAdapter) {
      throw Error('CdkDatepicker: No provider found for DateAdapter.');
    }
  }

  ngAfterContentInit() {
    if (this.view) {
      this.view.selectedChange.subscribe((date: D) => {
        this._selectInInput(date);
      });
    }
  }

  ngOnDestroy() {
    this._inputSubscription.unsubscribe();
    this._disabledChange.complete();
  }

  /** Selects the given date. */
  select(date: D): void {
    this._selectInInput(date);
    this._selectInView(date);
    this._selected = date;
  }

  /** Selects the given date from view in input. */
  private _selectInInput(date: D): void {
    if (!this._dateAdapter.sameDate(this._selected, date)) {
      this._selectedChanged.next(date);
    }
  }

  /** Selects the given date from input in view. */
  private _selectInView(value: D | null): void {
    if (this.view) {
      this.view.selected = value;
    }
  }

  /**
   * Register an input with this datepicker.
   * @param input The datepicker input to register with this datepicker.
   */
  _registerInput(input: CdkDatepickerInput<D>): void {
    if (this._datepickerInput) {
      throw Error('A CdkDatepicker can only be associated with a single input.');
    }
    this._datepickerInput = input;
    this._inputSubscription =
        this._datepickerInput._valueChange.subscribe((value: D | null) => {
          this._selectInView(value);
          this._selected = value;
        });
  }

  /**
   * @param obj The object to check.
   * @returns The given object if it is both a date instance and valid, otherwise null.
   */
  private _getValidDateOrNull(obj: any): D | null {
    return (this._dateAdapter.isDateInstance(obj) && this._dateAdapter.isValid(obj)) ? obj : null;
  }
}
