/**
 * Configuración de DH CRM.
 *
 * Mientras `zoho.clientId` esté vacío la app corre en MODO DEMO con datos de ejemplo
 * guardados en tu navegador. Al poner tu Client ID se conecta a tu Zoho CRM real.
 */
export const APP_SETTINGS = {
  zoho: {
    /** Client ID de tu app tipo "Client-based Application" en https://api-console.zoho.com */
    clientId: '',

    /**
     * Servidor de cuentas de tu centro de datos de Zoho.
     * Estados Unidos / México: https://accounts.zoho.com
     * Europa: https://accounts.zoho.eu · India: https://accounts.zoho.in
     */
    accountsUrl: 'https://accounts.zoho.com',

    scopes: [
      'ZohoCRM.modules.ALL',
      'ZohoCRM.settings.fields.READ',
      'ZohoCRM.coql.READ',
      'ZohoCRM.users.READ',
    ],
  },

  crm: {
    /** Módulo donde viven tus clientes. Por defecto Leads (Prospectos). */
    clientsModule: 'Leads',
    /** Campo de lista de selección que define las columnas del pipeline. */
    statusField: 'Lead_Status',
    /** Valores del estatus que se ocultan del pipeline (siguen visibles en la lista). */
    hiddenStatuses: ['-None-'],
  },
} as const;

export const isDemoMode = (): boolean => !APP_SETTINGS.zoho.clientId;
