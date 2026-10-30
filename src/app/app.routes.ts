import { inject } from '@angular/core';
import { CanActivateFn, Router, Routes } from '@angular/router';
import { ZohoAuth } from './core/zoho-auth.service';

const authGuard: CanActivateFn = () => {
  const auth = inject(ZohoAuth);
  return auth.isLoggedIn() ? true : inject(Router).parseUrl('/login');
};

export const routes: Routes = [
  { path: 'login', loadComponent: () => import('./pages/login.page').then((m) => m.LoginPage) },
  { path: 'auth/callback', loadComponent: () => import('./pages/auth-callback.page').then((m) => m.AuthCallbackPage) },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./layout/shell').then((m) => m.Shell),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'pipeline' },
      { path: 'pipeline', title: 'Pipeline · DH CRM', loadComponent: () => import('./pages/pipeline.page').then((m) => m.PipelinePage) },
      { path: 'clientes', title: 'Clientes · DH CRM', loadComponent: () => import('./pages/clients.page').then((m) => m.ClientsPage) },
      { path: 'clientes/:id', title: 'Cliente · DH CRM', loadComponent: () => import('./pages/client-detail.page').then((m) => m.ClientDetailPage) },
      { path: 'agenda', title: 'Agenda · DH CRM', loadComponent: () => import('./pages/agenda.page').then((m) => m.AgendaPage) },
    ],
  },
  { path: '**', redirectTo: '' },
];
