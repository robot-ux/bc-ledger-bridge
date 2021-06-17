import { crypto, Transaction } from '@binance-chain/javascript-sdk';
import EventEmitter from 'events';

const DEFAULT_HD_PATH = [44, 714, 0, 0, 0];
const BRIDGE_URL = 'https://robot-ux.github.io/bc-ledger-bridge';

class BcLedgerBridge extends EventEmitter {
  hdPath: Array<number>;
  page: number;
  perPage: number;
  iframe: any;
  bridgeUrl: string;
  hrp: string;
  iframeLoaded: boolean;
  delayedPromise: any;

  constructor() {
    super();
    this.page = 0;
    this.perPage = 5;
    this.iframe = null;
    this.hdPath = DEFAULT_HD_PATH;
    this.bridgeUrl = BRIDGE_URL;
    this.hrp = 'bnb';
    this.iframeLoaded = false;
    this.delayedPromise = {};

    this._setupIframe();
  }

  setHdPath(hdPath: Array<number>) {
    this.hdPath = hdPath;
  };

  setHrp(hrp: string) {
    this.hrp = hrp;
  };

  unlock(): Promise<Array<string>> {
    return new Promise( (resolve, reject) => {
      this._sendMessage({
        action: 'ledger-unlock',
        params: {
          hdPath: this.hdPath.toString(),
          hrp: this.hrp
        }
      }, function ({ success, payload }: { success: boolean, payload: any }) {
        if (success) {
          resolve(payload);
        } else {
          reject(payload.error || 'Unknown error');
        }
      });
    });
  };

  signTransaction(tx: Transaction, hdPath: Array<number>): Promise<Transaction> {
    return new Promise((resolve, reject) => {
      const signBytes = tx.getSignBytes();

      this._sendMessage({
        action: 'ledger-sign-transaction',
        params: {
          tx: signBytes.toString('hex'),
          hdPath: hdPath.toString(),
          hrp: this.hrp
        }
      }, ({ success, payload }: any) => {
        if (success) {
          var pubKey = crypto.getPublicKey(payload.pubkey);
          tx.addSignature(pubKey, Buffer.from(payload.signature, 'hex'));
          resolve(tx);
        } else {
          reject(new Error(payload.error || 'Ledger: Unknown error while signing transaction'));
        }
      });
    });
  };

  updateTransportMethod (useLedgerLive = false) {
    return new Promise((resolve, reject) => {
      // If the iframe isn't loaded yet, let's store the desired useLedgerLive value and
      // optimistically return a successful promise
      if (!this.iframeLoaded) {
        this.delayedPromise = {
          resolve,
          reject,
          useLedgerLive,
        }
        return
      }

      this._sendMessage({
        action: 'ledger-update-transport',
        params: { useLedgerLive },
      }, ({ success }: { success: boolean }) => {
        if (success) {
          resolve(true)
        } else {
          reject(new Error('Ledger transport could not be updated'))
        }
      })
    })
  }

  getFirstPage() {
    this.page = 0;
    return this.__getPage(1);
  };

  getNextPage() {
    return this.__getPage(1);
  };

  getPreviousPage() {
    return this.__getPage(-1);
  };

  async __getPage (increment: number) {

    this.page += increment

    if (this.page <= 0) {
      this.page = 1
    }
    const from = (this.page - 1) * this.perPage
    this.hdPath.splice(this.hdPath.length - 1, 1, from);

    const accounts = await this.unlock() as []
    return accounts.map((address, index) => {
      return {
        address: address,
        index: index,
        balance: null
      };
    })
  }

  _setupIframe() {
    this.iframe = document.createElement('iframe');
    this.iframe.src = this.bridgeUrl;
    this.iframe.contentWindow.onload = async () => {
      // If the ledger live preference was set before the iframe is loaded,
      // set it after the iframe has loaded
      this.iframeLoaded = true
      if (this.delayedPromise) {
        try {
          const result = await this.updateTransportMethod(
            this.delayedPromise.useLedgerLive,
          )
          this.delayedPromise.resolve(result)
        } catch (e) {
          this.delayedPromise.reject(e)
        } finally {
          delete this.delayedPromise
        }
      }
    }
    document.head.appendChild(this.iframe);
  };

  _getOrigin() {
    var tmp = this.bridgeUrl.split('/');
    tmp.splice(-1, 1);
    return tmp.join('/');
  };

  _sendMessage(msg: any, cb: any) {
    msg.target = 'BC-LEDGER-IFRAME';
    this.iframe.contentWindow.postMessage(msg, '*');

    const eventListener = ({ origin, data }: any) => {
      if (origin !== this._getOrigin()) {
        return false;
      }

      if (data && data.action && data.action === msg.action + "-reply") {
        cb(data);
        return undefined;
      }

      window.removeEventListener('message', eventListener);
      return undefined;
    };

    window.addEventListener('message', eventListener);
  };
}

export { BcLedgerBridge };
