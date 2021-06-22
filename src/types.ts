export const TRANSPORT_KEYS = ['u2f', 'node', 'wble'] as const;

export type TransportKeys = typeof TRANSPORT_KEYS[number];


export interface Props {
  transportKey: TransportKeys;
  interactiveTimeout?: number;
  nonInteractiveTimeout?: number;
}
