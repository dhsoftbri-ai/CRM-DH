import { CdkDrag, CdkDragDrop, CdkDragPlaceholder, CdkDropList, CdkDropListGroup } from '@angular/cdk/drag-drop';
import { Component, computed, inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { RouterLink } from '@angular/router';
import { CrmStore } from '../core/crm-store';
import { Client } from '../core/models';
import { initials, statusColor } from '../shared/ui';

@Component({
  selector: 'app-pipeline-page',
  imports: [CdkDropListGroup, CdkDropList, CdkDrag, CdkDragPlaceholder, RouterLink, MatIconModule, MatMenuModule, MatButtonModule],
  template: `
    <div class="head">
      <h1>Pipeline</h1>
      <span class="sub">{{ total() }} clientes · arrastra una tarjeta o usa ⋮ para cambiar su estatus</span>
    </div>

    <div class="board" cdkDropListGroup>
      @for (status of store.pipelineStatuses(); track status) {
        @let list = store.byStatus().get(status) ?? [];
        <section class="column">
          <header>
            <span class="dot" [style.background]="color(status)"></span>
            <h2>{{ status }}</h2>
            <span class="count">{{ list.length }}</span>
          </header>
          <div class="cards" cdkDropList [cdkDropListData]="status" (cdkDropListDropped)="drop($event)">
            @for (c of list; track c.id) {
              <article class="card" cdkDrag [cdkDragData]="c" [cdkDragStartDelay]="{ touch: 300, mouse: 0 }">
                <div class="card-placeholder" *cdkDragPlaceholder></div>
                <a class="card-link" [routerLink]="['/clientes', c.id]">
                  <span class="avatar" [style.background]="color(status)">{{ initials(c.fullName) }}</span>
                  <span class="txt">
                    <strong>{{ c.fullName }}</strong>
                    <span>{{ c.company }}</span>
                  </span>
                </a>
                <button mat-icon-button class="more" [matMenuTriggerFor]="move" [matMenuTriggerData]="{ c }" aria-label="Mover a otro estatus">
                  <mat-icon>more_vert</mat-icon>
                </button>
              </article>
            } @empty {
              <p class="empty">Sin clientes</p>
            }
          </div>
        </section>
      }
    </div>

    <mat-menu #move="matMenu">
      <ng-template matMenuContent let-c="c">
        <span class="menu-title">Mover a…</span>
        @for (s of store.pipelineStatuses(); track s) {
          <button mat-menu-item [disabled]="s === c.status" (click)="store.setStatus(c, s)">
            <span class="dot inline" [style.background]="color(s)"></span>{{ s }}
          </button>
        }
      </ng-template>
    </mat-menu>
  `,
  styleUrl: './pipeline.page.scss',
})
export class PipelinePage {
  protected readonly store = inject(CrmStore);
  protected readonly initials = initials;
  protected readonly total = computed(() => this.store.clients().length);

  protected color(status: string): string {
    return statusColor(status, this.store.statuses());
  }

  drop(e: CdkDragDrop<string, string, Client>): void {
    if (e.previousContainer !== e.container) this.store.setStatus(e.item.data, e.container.data);
  }
}
