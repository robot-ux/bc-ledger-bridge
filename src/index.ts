import { ChromeLedgerBridge } from './chrome'
import { FirefoxLedgerBridge } from './firefox'

const isFirefox = /firefox/i.test(navigator.userAgent);

export type BcLedgerBridge =  FirefoxLedgerBridge | ChromeLedgerBridge;
export const BcLedgerBridge = isFirefox ? FirefoxLedgerBridge : ChromeLedgerBridge;

