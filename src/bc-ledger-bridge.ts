import { ledger as Ledger, crypto } from '@binance-chain/javascript-sdk';
import LedgerApp, {
  Version,
} from '@binance-chain/javascript-sdk/lib/ledger/ledger-app';
import {
  DEFAULT_LEDGER_INTERACTIVE_TIMEOUT,
  DEFAULT_LEDGER_NONINTERACTIVE_TIMEOUT,
} from './constants';

export class BcLedgerBridge {
  private app: LedgerApp | null;
  private transport: any;

  constructor() {
    this.addEventListeners();
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
              this.signTransaction(
                replyAction,
                params.hdPath,
                params.tx,
                params.to
              );
              break;
            case 'ledger-sign-personal-message':
              this.signPersonalMessage(
                replyAction,
                params.hdPath,
                params.message
              );
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
      const transInst = await transImpl.create(15000);
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

  async unlock(replyAction, hdPath) {
    try {
      await this.makeApp();
      const res = await this.app.getAddress(hdPath, false, true);

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
}
