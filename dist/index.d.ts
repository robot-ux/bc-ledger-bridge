/// <reference types="node" />
import LedgerApp, { Version } from '@binance-chain/javascript-sdk/lib/ledger/ledger-app';
import { Props } from './types';
export declare class LedgerClient {
    private _transportKey;
    private _interactiveTimeout;
    private _nonInteractiveTimeout;
    private _app;
    private _version;
    private _hdPath;
    page: number;
    constructor({ transportKey, interactiveTimeout, nonInteractiveTimeout, }: Props);
    unlock(): Promise<void>;
    getFirstPage(): Promise<string[]>;
    getPreviousPage(): Promise<string[]>;
    getNextPage(): Promise<string[]>;
    setHdPath(hdPath?: Array<number>): void;
    mustHaveApp(): LedgerApp;
    getApp(): LedgerApp | null;
    getVersion(): Promise<Version | undefined>;
    getPublicKey(hdPath: number[]): Promise<import("@binance-chain/javascript-sdk/lib/ledger/ledger-app").PublicKey>;
    getAddress(hdPath: number[]): Promise<string>;
    getAddresses({ hdPathStart, hrp, limit, }: {
        hdPathStart: Array<number>;
        hrp?: string;
        limit?: number;
    }): Promise<string[]>;
    showAddress(hrp?: string, hdPath?: number[]): Promise<import("@binance-chain/javascript-sdk/lib/ledger/ledger-app").ReturnResponse>;
    sign(signBytes: Buffer, hdPath: number[]): Promise<import("@binance-chain/javascript-sdk/lib/ledger/ledger-app").SignedSignature>;
}
