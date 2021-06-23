import { ChromeLedgerBridge } from './chrome'
import { FirefoxLedgerBridge } from './firefox'

const isChrome = /chrome/i.test(navigator.userAgent);

export type BcLedgerBridge =  FirefoxLedgerBridge | ChromeLedgerBridge;
export const BcLedgerBridge = isChrome ? ChromeLedgerBridge : FirefoxLedgerBridge;

