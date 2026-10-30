import { Injectable, computed, signal } from '@angular/core';
import { APP_SETTINGS, isDemoMode } from '../app.settings';

const STORE_KEY = 'dhcrm.zoho.session';
const STATE_KEY = 'dhcrm.zoho.state';
const RETURN_KEY = 'dhcrm.zoho.return';

interface ZohoSession {
  accessToken: string;
  apiDomain: string;
  expiresAt: number;
}

function readSession(): ZohoSession | null {
  try {
    const raw = sessionStorage.getItem(STORE_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw) as ZohoSession;
    return s.expiresAt > Date.now() + 30_000 ? s : null;
  } catch {
    return null;
  }
}

/**
 * OAuth de Zoho para aplicaciones "client-based" (flujo implícito).
 * El token vive solo en sessionStorage de esta pestaña y dura ~1 hora;
 * al vencer se vuelve a pedir y Zoho no pregunta de nuevo si ya diste permiso.
 */
@Injectable({ providedIn: 'root' })
export class ZohoAuth {
  private readonly session = signal<ZohoSession | null>(readSession());

  readonly isLoggedIn = computed(() => isDemoMode() || !!this.session());

  get accessToken(): string | null {
    const s = this.session();
    if (s && s.expiresAt <= Date.now() + 30_000) {
      this.logout();
      return null;
    }
    return s?.accessToken ?? null;
  }

  get apiDomain(): string {
    return (
      this.session()?.apiDomain ??
      APP_SETTINGS.zoho.accountsUrl.replace('accounts.zoho', 'www.zohoapis')
    );
  }

  get redirectUri(): string {
    return `${location.origin}/auth/callback`;
  }

  login(returnTo = '/'): void {
    const state = crypto.randomUUID();
    try {
      sessionStorage.setItem(STATE_KEY, state);
      sessionStorage.setItem(RETURN_KEY, returnTo);
    } catch {
      /* sessionStorage no disponible */
    }
    const params = new URLSearchParams({
      scope: APP_SETTINGS.zoho.scopes.join(','),
      client_id: APP_SETTINGS.zoho.clientId,
      response_type: 'token',
      redirect_uri: this.redirectUri,
      state,
    });
    location.assign(`${APP_SETTINGS.zoho.accountsUrl}/oauth/v2/auth?${params}`);
  }

  /** Procesa la respuesta de Zoho en /auth/callback. Devuelve la ruta a la que hay que regresar. */
  handleCallback(): string {
    // Zoho puede devolver los datos en el fragmento (#) o en la query (?)
    const raw = location.hash.length > 1 ? location.hash.slice(1) : location.search.slice(1);
    const p = new URLSearchParams(raw);

    const error = p.get('error');
    if (error) throw new Error(`Zoho rechazó el acceso: ${error}`);

    const token = p.get('access_token');
    if (!token) throw new Error('Zoho no devolvió un token de acceso.');

    let expected: string | null = null;
    let returnTo = '/';
    try {
      expected = sessionStorage.getItem(STATE_KEY);
      returnTo = sessionStorage.getItem(RETURN_KEY) || '/';
      sessionStorage.removeItem(STATE_KEY);
      sessionStorage.removeItem(RETURN_KEY);
    } catch {
      /* ignore */
    }
    if (expected && p.get('state') && p.get('state') !== expected) {
      throw new Error('La respuesta de Zoho no coincide con la solicitud (state). Intenta de nuevo.');
    }

    const session: ZohoSession = {
      accessToken: token,
      apiDomain: p.get('api_domain') || this.apiDomain,
      expiresAt: Date.now() + Number(p.get('expires_in') || 3600) * 1000,
    };
    try {
      sessionStorage.setItem(STORE_KEY, JSON.stringify(session));
    } catch {
      /* ignore */
    }
    this.session.set(session);
    return returnTo;
  }

  logout(): void {
    try {
      sessionStorage.removeItem(STORE_KEY);
    } catch {
      /* ignore */
    }
    this.session.set(null);
  }
}
