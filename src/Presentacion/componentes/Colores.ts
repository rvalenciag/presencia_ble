export const Tonos = {
  exito: { solido: '#34C759', suave: 'rgba(52, 199, 89, 0.16)' },
  error: { solido: '#FF3B30', suave: 'rgba(255, 59, 48, 0.14)' },
  advertencia: { solido: '#FF9500', suave: 'rgba(255, 149, 0, 0.16)' },
  informacion: { solido: '#208AEF', suave: 'rgba(32, 138, 239, 0.16)' },
  neutro: { solido: '#8E8E93', suave: 'rgba(142, 142, 147, 0.18)' },
} as const;

export type Tono = keyof typeof Tonos;
