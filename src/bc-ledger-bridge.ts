import { ledger as Ledger, crypto } from '@binance-chain/javascript-sdk';
import LedgerApp from '@binance-chain/javascript-sdk/lib/ledger/ledger-app';
import {
  DEFAULT_GET_ADDRESSES_LIMIT,
  DEFAULT_LEDGER_INTERACTIVE_TIMEOUT,
  DEFAULT_LEDGER_NONINTERACTIVE_TIMEOUT,
} from './constants';

export class BcLedgerBridge {
  private app: LedgerApp | null;
  private transport: any;

  constructor() {
    this.addEventListeners();
    this.app = null;
    this.transport = null;
  }

  addEventListeners() {
    window.addEventListener(
      'message',
      async e => {
        if (e && e.data && e.data.target === 'BC-LEDGER-IFRAME') {
          const { action, params } = e.data;
          const replyAction = `${action}-reply`;
          switch (action) {
            case 'ledger-unlock':
              this.unlock(replyAction, params.hdPath);
              break;
            case 'ledger-sign-transaction':
              this.signTransaction(replyAction, params.hdPath, params.tx);
              break;
          }
        }
      },
      false
    );
  }

  sendMessageToExtension(msg: any) {
    window.parent.postMessage(msg, '*');
  }

  async makeApp() {
    try {
      let transImpl = Ledger.transports['u2f'];
      const transInst = await transImpl.create(30000);
      this.transport = transInst;
      this.app = new Ledger.app(
        transInst,
        DEFAULT_LEDGER_INTERACTIVE_TIMEOUT,
        DEFAULT_LEDGER_NONINTERACTIVE_TIMEOUT
      );
    } catch (e) {
      console.log('LEDGER:::CREATE APP ERROR', e);
    }
  }

  cleanUp() {
    this.app = null;
    this.transport.close();
  }

  async unlock(replyAction: any, hdPath: any) {
    try {
      console.log('start make ledger app');
      await this.makeApp();
      const res = await this.getAddresses({ hdPathStart: hdPath });
      console.log('addresses: ');
      console.log(res);

      this.sendMessageToExtension({
        action: replyAction,
        success: true,
        payload: res,
      });
    } catch (err) {
      console.log('error');
      console.log(err);
      const e = this.ledgerErrToMessage(err);

      this.sendMessageToExtension({
        action: replyAction,
        success: false,
        payload: { error: e.toString() },
      });
    } finally {
      this.cleanUp();
    }
  }

  async signTransaction(replyAction: string, hdPath: any, tx: any) {
    try {
      await this.makeApp();
      const res = this.mustHaveApp().sign(tx, hdPath);
      this.sendMessageToExtension({
        action: replyAction,
        success: true,
        payload: res,
      });
    } catch (err) {
      const e = this.ledgerErrToMessage(err);
      this.sendMessageToExtension({
        action: replyAction,
        success: false,
        payload: { error: e.toString() },
      });
    } finally {
      this.cleanUp();
    }
  }

  mustHaveApp() {
    if (this.app === null) {
      throw new Error('LedgerClient: Call makeApp() first');
    }
    return this.app;
  }

  async getPublicKey(hdPath: number[]) {
    return this.mustHaveApp().getPublicKey(hdPath);
  }

  async getAddresses({
    hdPathStart,
    hrp = 'bnb',
    limit = DEFAULT_GET_ADDRESSES_LIMIT,
  }: {
    hdPathStart: Array<number>;
    hrp?: string;
    limit?: number;
  }) {
    if (!Array.isArray(hdPathStart) || hdPathStart.length < 5) {
      throw new Error(
        'hdPathStart must be an array containing at least 5 path nodes'
      );
    }

    const addresses = [];
    let hdPath = hdPathStart;
    for (let i = 0; i < limit; i++) {
      if (Number(hdPath[hdPath.length - 1]) > 0x7fffffff) break;

      const response = await this.getPublicKey(hdPath);
      const { pk } = response;
      const address = crypto.getAddressFromPublicKey(
        (pk as Buffer).toString('hex'),
        hrp
      );
      addresses.push(address);

      hdPath = hdPathStart.slice();
      hdPath[hdPath.length - 1] = i + hdPath[hdPath.length - 1] + 1;
    }
    return addresses;
  }

  ledgerErrToMessage(err: any) {
    const isU2FError = (err: any) => !!err && !!err.metaData;
    const isStringError = (err: any) => typeof err === 'string';
    const isErrorWithId = (err: any) =>
      err.hasOwnProperty('id') && err.hasOwnProperty('message');

    // https://developers.yubico.com/U2F/Libraries/Client_error_codes.html
    if (isU2FError(err)) {
      // Timeout
      if (err.metaData.code === 5) {
        return 'LEDGER_TIMEOUT';
      }

      return err.metaData.type;
    }

    if (isStringError(err)) {
      // Wrong app logged into
      if (err.includes('6804')) {
        return 'LEDGER_WRONG_APP';
      }
      // Ledger locked
      if (err.includes('6801')) {
        return 'LEDGER_LOCKED';
      }

      return err;
    }

    if (isErrorWithId(err)) {
      // Browser doesn't support U2F
      if (err.message.includes('U2F not supported')) {
        return 'U2F_NOT_SUPPORTED';
      }
    }

    // Other
    return err.toString();
  }
}
