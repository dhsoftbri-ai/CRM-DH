import { Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { CrmStore } from '../core/crm-store';
import { Client } from '../core/models';

@Component({
  selector: 'app-new-client-dialog',
  imports: [ReactiveFormsModule, MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatIconModule],
  template: `
    <h2 mat-dialog-title>Nuevo cliente</h2>
    <form [formGroup]="form" (ngSubmit)="save()">
      <mat-dialog-content class="grid">
        <mat-form-field>
          <mat-label>Nombre</mat-label>
          <input matInput formControlName="firstName" autocomplete="given-name" />
        </mat-form-field>
        <mat-form-field>
          <mat-label>Apellidos</mat-label>
          <input matInput formControlName="lastName" autocomplete="family-name" required />
          @if (form.controls.lastName.hasError('required')) { <mat-error>Requerido por Zoho</mat-error> }
        </mat-form-field>
        <mat-form-field class="full">
          <mat-label>Empresa</mat-label>
          <mat-icon matPrefix>business</mat-icon>
          <input matInput formControlName="company" autocomplete="organization" required />
          @if (form.controls.company.hasError('required')) { <mat-error>Requerido por Zoho</mat-error> }
        </mat-form-field>
        <mat-form-field>
          <mat-label>Correo</mat-label>
          <mat-icon matPrefix>mail</mat-icon>
          <input matInput type="email" formControlName="email" autocomplete="email" />
          @if (form.controls.email.hasError('email')) { <mat-error>Correo no válido</mat-error> }
        </mat-form-field>
        <mat-form-field>
          <mat-label>Teléfono</mat-label>
          <mat-icon matPrefix>call</mat-icon>
          <input matInput type="tel" formControlName="phone" autocomplete="tel" />
        </mat-form-field>
        <mat-form-field>
          <mat-label>Estatus</mat-label>
          <mat-select formControlName="status">
            @for (s of store.statuses(); track s) { <mat-option [value]="s">{{ s }}</mat-option> }
          </mat-select>
        </mat-form-field>
        <mat-form-field>
          <mat-label>¿Cómo llegó?</mat-label>
          <input matInput formControlName="source" placeholder="Recomendación, sitio web…" />
        </mat-form-field>
        <mat-form-field class="full">
          <mat-label>Descripción</mat-label>
          <textarea matInput formControlName="description" rows="3" placeholder="¿Qué necesita?"></textarea>
        </mat-form-field>
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button mat-button type="button" mat-dialog-close>Cancelar</button>
        <button mat-flat-button type="submit" [disabled]="saving()">{{ saving() ? 'Guardando…' : 'Guardar' }}</button>
      </mat-dialog-actions>
    </form>
  `,
  styles: `
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 4px 16px; padding-top: 8px !important; }
    .full { grid-column: 1 / -1; }
    @media (max-width: 520px) { .grid { grid-template-columns: 1fr; } }
  `,
})
export class NewClientDialog {
  protected readonly store = inject(CrmStore);
  private readonly ref = inject<MatDialogRef<NewClientDialog, Client | null>>(MatDialogRef);
  protected readonly saving = signal(false);

  protected readonly form = inject(NonNullableFormBuilder).group({
    firstName: [''],
    lastName: ['', Validators.required],
    company: ['', Validators.required],
    email: ['', Validators.email],
    phone: [''],
    status: [this.store.pipelineStatuses()[0] ?? ''],
    source: [''],
    description: [''],
  });

  async save(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    const v = this.form.getRawValue();
    const created = await this.store.create({
      ...v,
      firstName: v.firstName.trim(),
      lastName: v.lastName.trim(),
      company: v.company.trim(),
      email: v.email.trim(),
      phone: v.phone.trim(),
    });
    this.saving.set(false);
    if (created) this.ref.close(created);
  }
}
