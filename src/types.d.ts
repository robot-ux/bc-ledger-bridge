export declare const TRANSPORT_KEYS: readonly ["u2f", "node", "wble"];
export declare type TransportKeys = typeof TRANSPORT_KEYS[number];
export interface Props {
    transportKey: TransportKeys;
    interactiveTimeout?: number;
    nonInteractiveTimeout?: number;
}
