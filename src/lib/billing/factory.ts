import { IBillingProvider } from './types';
import { NubefactAdapter } from './providers/nubefact';
import { EfactAdapter } from './providers/efact';

export interface BillingConfig {
  provider: 'nubefact' | 'efact' | string;
  endpoint?: string;
  token?: string;
}

/**
 * Fábrica de Proveedores de Facturación Electrónica de Viw-Carta.
 * Resuelve e instancia dinámicamente el adaptador adecuado basado en la configuración del restaurante.
 */
export function getBillingProvider(config: BillingConfig): IBillingProvider {
  const providerName = config.provider.trim().toLowerCase();

  switch (providerName) {
    case 'nubefact':
      if (!config.endpoint || !config.token) {
        throw new Error('getBillingProvider: Faltan las credenciales requeridas (endpoint, token) para Nubefact.');
      }
      return new NubefactAdapter(config.endpoint, config.token);

    case 'efact':
      // Se instancia con las credenciales de Efact (opcionales por ahora mientras se homologa La K)
      return new EfactAdapter(config.endpoint, config.token);

    default:
      throw new Error(`getBillingProvider: El proveedor de facturación "${config.provider}" no es soportado actualmente en Viw-Carta.`);
  }
}
