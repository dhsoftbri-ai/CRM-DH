import { Component, inject } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTimepickerModule } from '@angular/material/timepicker';
import { MeetingInput } from '../core/models';

@Component({
  selector: 'app-meeting-dialog',
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatTimepickerModule,
    MatSelectModule,
    MatIconModule,
  ],
  template: `
    <h2 mat-dialog-title>Agendar reunión</h2>
    <form [formGroup]="form" (ngSubmit)="save()">
      <mat-dialog-content class="grid">
        <mat-form-field class="full">
          <mat-label>Título</mat-label>
          <input matInput formControlName="title" required />
        </mat-form-field>
        <mat-form-field>
          <mat-label>Fecha</mat-label>
          <input matInput [matDatepicker]="dp" formControlName="date" required />
          <mat-datepicker-toggle matIconSuffix [for]="dp" />
          <mat-datepicker #dp />
        </mat-form-field>
        <mat-form-field>
          <mat-label>Hora</mat-label>
          <input matInput [matTimepicker]="tp" formControlName="time" required />
          <mat-timepicker-toggle matIconSuffix [for]="tp" />
          <mat-timepicker #tp interval="30m" />
        </mat-form-field>
        <mat-form-field>
          <mat-label>Duración</mat-label>
          <mat-select formControlName="minutes">
            <mat-option [value]="30">30 min</mat-option>
            <mat-option [value]="60">1 hora</mat-option>
            <mat-option [value]="90">1 h 30 min</mat-option>
            <mat-option [value]="120">2 horas</mat-option>
          </mat-select>
        </mat-form-field>
        <mat-form-field>
          <mat-label>Lugar o liga</mat-label>
          <mat-icon matPrefix>place</mat-icon>
          <input matInput formControlName="venue" placeholder="Google Meet, oficina…" />
        </mat-form-field>
        <mat-form-field class="full">
          <mat-label>Agenda (opcional)</mat-label>
          <textarea matInput formControlName="description" rows="2"></textarea>
        </mat-form-field>
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button mat-button type="button" mat-dialog-close>Cancelar</button>
        <button mat-flat-button type="submit">Agendar</button>
      </mat-dialog-actions>
    </form>
  `,
  styles: `
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 4px 16px; padding-top: 8px !important; }
    .full { grid-column: 1 / -1; }
    @media (max-width: 520px) { .grid { grid-template-columns: 1fr; } }
  `,
})
export class MeetingDialog {
  private readonly ref = inject<MatDialogRef<MeetingDialog, MeetingInput>>(MatDialogRef);
  private readonly data = inject<{ clientName: string }>(MAT_DIALOG_DATA);

  private readonly defaults = (() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(10, 0, 0, 0);
    return d;
  })();

  protected readonly form = inject(NonNullableFormBuilder).group({
    title: [`Reunión con ${this.data.clientName}`, Validators.required],
    date: [this.defaults as Date | null, Validators.required],
    time: [this.defaults as Date | null, Validators.required],
    minutes: [60],
    venue: [''],
    description: [''],
  });

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    const start = new Date(v.date!);
    start.setHours(v.time!.getHours(), v.time!.getMinutes(), 0, 0);
    const end = new Date(start.getTime() + v.minutes * 60_000);
    this.ref.close({ title: v.title.trim(), start, end, venue: v.venue.trim(), description: v.description.trim() });
  }
}
