import { Component, inject } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { toDateOnly } from '../core/crm-backend';
import { TaskInput, TaskPriority } from '../core/models';

@Component({
  selector: 'app-task-dialog',
  imports: [ReactiveFormsModule, MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatDatepickerModule, MatButtonToggleModule],
  template: `
    <h2 mat-dialog-title>Nueva tarea</h2>
    <form [formGroup]="form" (ngSubmit)="save()">
      <mat-dialog-content class="col">
        <mat-form-field>
          <mat-label>¿Qué hay que hacer?</mat-label>
          <input matInput formControlName="subject" required placeholder="Llamar para dar seguimiento" />
        </mat-form-field>
        <div class="quick">
          <button mat-stroked-button type="button" (click)="setDue(0)">Hoy</button>
          <button mat-stroked-button type="button" (click)="setDue(1)">Mañana</button>
          <button mat-stroked-button type="button" (click)="setDue(7)">En una semana</button>
        </div>
        <mat-form-field>
          <mat-label>Fecha límite</mat-label>
          <input matInput [matDatepicker]="picker" formControlName="due" />
          <mat-datepicker-toggle matIconSuffix [for]="picker" />
          <mat-datepicker #picker />
        </mat-form-field>
        <label class="lbl">Prioridad</label>
        <mat-button-toggle-group formControlName="priority" hideSingleSelectionIndicator>
          <mat-button-toggle value="Low">Baja</mat-button-toggle>
          <mat-button-toggle value="Normal">Normal</mat-button-toggle>
          <mat-button-toggle value="High">Alta</mat-button-toggle>
        </mat-button-toggle-group>
        <mat-form-field class="mt">
          <mat-label>Detalle (opcional)</mat-label>
          <textarea matInput formControlName="description" rows="2"></textarea>
        </mat-form-field>
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button mat-button type="button" mat-dialog-close>Cancelar</button>
        <button mat-flat-button type="submit">Crear tarea</button>
      </mat-dialog-actions>
    </form>
  `,
  styles: `
    .col { display: flex; flex-direction: column; gap: 8px; padding-top: 8px !important; min-width: min(420px, 80vw); }
    .quick { display: flex; gap: 8px; flex-wrap: wrap; }
    .lbl { font: var(--mat-sys-label-large); color: var(--mat-sys-on-surface-variant); }
    .mt { margin-top: 8px; }
  `,
})
export class TaskDialog {
  private readonly ref = inject<MatDialogRef<TaskDialog, TaskInput>>(MatDialogRef);
  protected readonly form = inject(NonNullableFormBuilder).group({
    subject: ['', Validators.required],
    due: [this.daysAhead(1) as Date | null],
    priority: ['Normal' as TaskPriority],
    description: [''],
  });

  private daysAhead(n: number): Date {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + n);
    return d;
  }

  setDue(n: number): void {
    this.form.controls.due.setValue(this.daysAhead(n));
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    this.ref.close({
      subject: v.subject.trim(),
      dueDate: v.due ? toDateOnly(v.due) : null,
      priority: v.priority,
      description: v.description.trim(),
    });
  }
}
