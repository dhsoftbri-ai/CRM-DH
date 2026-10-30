import { registerLocaleData } from '@angular/common';
import localeEsMx from '@angular/common/locales/es-MX';
import { ApplicationConfig, LOCALE_ID, provideBrowserGlobalErrorListeners } from '@angular/core';
import { MAT_DATE_LOCALE, provideNativeDateAdapter } from '@angular/material/core';
import { MAT_FORM_FIELD_DEFAULT_OPTIONS } from '@angular/material/form-field';
import { provideRouter, withComponentInputBinding, withHashLocation } from '@angular/router';
import { isDemoMode } from './app.settings';
import { routes } from './app.routes';
import { CrmBackend } from './core/crm-backend';
import { DemoBackend } from './core/demo-backend';
import { ZohoBackend } from './core/zoho-backend';

registerLocaleData(localeEsMx);

/** Solo lo define la configuración `demo-hosted` (demo publicada); en tu despliegue normal se usan rutas limpias. */
declare const HASH_ROUTING: boolean | undefined;
const hashRouting = typeof HASH_ROUTING !== 'undefined' && HASH_ROUTING;

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    hashRouting
      ? provideRouter(routes, withComponentInputBinding(), withHashLocation())
      : provideRouter(routes, withComponentInputBinding()),
    provideNativeDateAdapter(),
    { provide: LOCALE_ID, useValue: 'es-MX' },
    { provide: MAT_DATE_LOCALE, useValue: 'es-MX' },
    { provide: MAT_FORM_FIELD_DEFAULT_OPTIONS, useValue: { appearance: 'outline', subscriptSizing: 'dynamic' } },
    isDemoMode() ? DemoBackend : ZohoBackend,
    { provide: CrmBackend, useExisting: isDemoMode() ? DemoBackend : ZohoBackend },
  ],
};
