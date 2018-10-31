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
  ElementRef,
  EventEmitter,
  Input,
  NgZone,
  Output,
  ViewEncapsulation,
} from '@angular/core';
import {
  DateAdapter,
  DateRange,
  MAT_SINGLE_DATE_SELECTION_MODEL_PROVIDER,
  MatDateSelectionModel
} from '@angular/material/core';
import {take} from 'rxjs/operators';

/**
 * An internal class that represents the data corresponding to a single calendar cell.
 * @docs-private
 * @breaking-change 9.0.0 remove default
 */
export class MatCalendarCell<D = any> {
  constructor(public value: number,
              public displayValue: string,
              public ariaLabel: string,
              public enabled: boolean,
              public range: DateRange<D>) {}
}


/**
 * An internal component used to display calendar data in a table.
 * @docs-private
 */
@Component({
  moduleId: module.id,
  selector: '[mat-calendar-body]',
  templateUrl: 'calendar-body.html',
  styleUrls: ['calendar-body.css'],
  host: {
    'class': 'mat-calendar-body',
    'role': 'grid',
    'aria-readonly': 'true'
  },
  exportAs: 'matCalendarBody',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [MAT_SINGLE_DATE_SELECTION_MODEL_PROVIDER],
})
export class MatCalendarBody<D> {
  /** The label for the table. (e.g. "Jan 2017"). */
  @Input() label: string;

  /** The cells to display in the table. */
  @Input() rows: MatCalendarCell<D>[][];

  /** The value in the table that corresponds to today. */
  @Input() todayValue: number;

  /**
   * The value in the table that is currently selected.
   * @deprecated use `selectionModel`
   * @breaking-change 9.0.0 remove selected value.
   */
  @Input()
  get selectedValue(): number {
    const date = this._selectionModel.getFirstSelectedDate();
    return date ? this._dateAdapter.getDate(date) : NaN;
  }
  set selectedValue(value: number) {
    const date = this._selectionModel.getFirstSelectedDate();
    if (date) {
      const year = this._dateAdapter.getYear(date);
      const month = this._dateAdapter.getMonth(date);
      const clone = this._dateAdapter.createDate(year, month, value);
      this._selectionModel.add(clone);
    }
  }

  /** The minimum number of free cells needed to fit the label in the first row. */
  @Input() labelMinRequiredCells: number;

  /** The number of columns in the table. */
  @Input() numCols = 7;

  /** The cell number of the active cell in the table. */
  @Input() activeCell = 0;

  /**
   * The aspect ratio (width / height) to use for the cells in the table. This aspect ratio will be
   * maintained even as the table resizes.
   */
  @Input() cellAspectRatio = 1;

  /** Emits when a new value is selected. */
  @Output() readonly selectedValueChange: EventEmitter<number> = new EventEmitter<number>();

  constructor(private _elementRef: ElementRef<HTMLElement>,
              private _ngZone: NgZone,
              private _dateAdapter: DateAdapter<D>,
              readonly _selectionModel: MatDateSelectionModel<D>) { }

  _cellClicked(cell: MatCalendarCell<D>): void {
    if (cell.enabled) {
      this.selectedValueChange.emit(cell.value);
    }
  }

  /** The number of blank cells to put at the beginning for the first row. */
  get _firstRowOffset(): number {
    return this.rows && this.rows.length && this.rows[0].length ?
        this.numCols - this.rows[0].length : 0;
  }

  _isActiveCell(rowIndex: number, colIndex: number): boolean {
    let cellNumber = rowIndex * this.numCols + colIndex;

    // Account for the fact that the first row may not have as many cells.
    if (rowIndex) {
      cellNumber -= this._firstRowOffset;
    }

    return cellNumber == this.activeCell;
  }

  _isSelected(item: MatCalendarCell<D>): boolean {
    return this._selectionModel.overlaps(item.range);
  }

  /** Focuses the active cell after the microtask queue is empty. */
  _focusActiveCell() {
    this._ngZone.runOutsideAngular(() => {
      this._ngZone.onStable.asObservable().pipe(take(1)).subscribe(() => {
        const activeCell: HTMLElement | null =
            this._elementRef.nativeElement.querySelector('.mat-calendar-body-active');

        if (activeCell) {
          activeCell.focus();
        }
      });
    });
  }
}
