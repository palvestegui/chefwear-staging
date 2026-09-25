import { PricingData } from '../types';
import { 
  DEFAULT_RALEO_DISCOUNT_RULES, 
  DEFAULT_B2B_DISCOUNT_RULES, 
  DEFAULT_UDI_DISCOUNT_RULES 
} from './discountRulesUtils';

export const DEFAULT_FALLBACK_ACCOUNT = {
  id: 'ACC-000',
  accountId: 'ACC-000',
  name: 'Clientes Particulares',
  accountName: 'Clientes Particulares',
  category: 'PARTICULAR',
  accountType: 'Particular / Individuo',
  pricingTier: 'Estándar Raleo'
};

export const DEFAULT_PRICING: PricingData = {
  garments: {
    'Filipina': {
      'Drill de 8oz': { priceRaleo: 120, priceB2B: 100 },
      'Gabardina de 2da': { priceRaleo: 110, priceB2B: 95 },
      'Tornado (Bull Denim)': { priceRaleo: 130, priceB2B: 110 }
    },
    'Pantalón': {
      'Drill de 8oz': { priceRaleo: 110, priceB2B: 90 },
      'Gabardina de 2da': { priceRaleo: 100, priceB2B: 85 },
      'Tornado (Bull Denim)': { priceRaleo: 120, priceB2B: 100 }
    },
    'Mandil': {
      'Drill de 8oz': { priceRaleo: 65, priceB2B: 50 },
      'Gabardina de 2da': { priceRaleo: 60, priceB2B: 45 },
      'Tornado (Bull Denim)': { priceRaleo: 75, priceB2B: 60 }
    },
    'Gorro': {
      'Drill de 8oz': { priceRaleo: 35, priceB2B: 25 }
    }
  },
  services: [
    { name: 'Bordado Nombre/Texto', price: 15, type: 'Bordado Simple' },
    { name: 'Bordado Logo Delantero', price: 25, type: 'Escala de Volumen (Logos)' },
    { name: 'Logo Espalda Grande', price: 40, type: 'Escala de Volumen (Logos)' },
    { name: 'Bolsillo Extra Filipina', price: 10, type: 'Opción de Confección' }
  ],
  udiPricing: {
    'Filipina': { 'Drill de 8oz': 110 },
    'Pantalón': { 'Drill de 8oz': 100 },
    'Mandil': { 'Drill de 8oz': 55 }
  },
  specialPresets: {
    'UDI Especial': {
      'Filipina': { 'Drill de 8oz': 110 },
      'Pantalón': { 'Drill de 8oz': 100 },
      'Mandil': { 'Drill de 8oz': 55 }
    }
  },
  discountRulesByTier: {
    'Estándar Raleo': DEFAULT_RALEO_DISCOUNT_RULES,
    'Estándar B2B': DEFAULT_B2B_DISCOUNT_RULES,
    'UDI Especial': DEFAULT_UDI_DISCOUNT_RULES,
    'Contrato Institucional': DEFAULT_UDI_DISCOUNT_RULES
  }
};
