import axios from 'axios'
import { createHash } from 'crypto'

export const url = {
  BC_NODE_AMO_TOKYO: 'http://139.162.116.176:26657',
  AMO_STORAGE: 'http://139.162.111.178:5000'
}

/***
 *
 * @param blk: {BlockMeta}
 * @returns {FormattedBlockHeader}
 */
function formatBlockHeader (blk) {
  return {
    chain: blk.header.chain_id,
    hash: blk.block_id.hash,
    height: blk.header.height,
    proposer: blk.header.proposer_address,
    numTx: blk.header.num_txs,
    timestamp: blk.header.time
  }
}

function sha256 (b) {
  return createHash('sha256').update(b).digest()
}

/***
 *
 * @param blk: {Block}
 * @returns {FormattedBlock}
 */
function formatBlock (blk) {
  return {
    ...formatBlockHeader(blk.block_meta),
    txs: blk.block.data.txs.map(tx => {
      const decoded = Buffer.from(tx, 'base64')
      const hash = sha256(decoded).toString('hex')
      return {
        ...JSON.parse(decoded.toString()),
        hash
      }
    })
  }
}

function decodeBase64 (encoded) {
  return Buffer.from(encoded, 'base64').toString()
}

function fromBase64 (encoded) {
  return JSON.parse(decodeBase64(encoded))
}

function parseTxs (data) {
  if (!data.error && 'txs' in data.result) {
    return data.result.txs.map(tx => {
      return fromBase64(tx.tx)
    })
  } else {
    return []
  }
}

export class AmoClient {
  _client
  _storageClient

  constructor (config, storageConfig) {
    if (!config) {
      config = {
        baseURL: url.BC_NODE_AMO_TOKYO
      }
    }

    if (!config.baseURL) {
      config.baseURL = url.BC_NODE_AMO_TOKYO
    }

    if (!storageConfig) {
      storageConfig = {
        baseURL: url.AMO_STORAGE,
        headers: {
          'content-type': 'application/json'
        }
      }
    }

    if (!storageConfig.baseURL) {
      storageConfig.baseURL = url.AMO_STORAGE
    }

    if (!storageConfig.headers) {
      storageConfig.headers = {
        'content-type': 'application/json'
      }
    }

    this._client = axios.create(config)
    this._storageClient = axios.create(storageConfig)
  }

  fetchLastBlock () {
    return this._client
      .get('/block')
      .then(({ data: { result } }) => {
        return formatBlockHeader(result.block_meta)
      })
  }

  fetchBlock (height) {
    return this._client
      .get(`/block?height=${height}`)
      .then(({ data }) => {
        if ('error' in data) {
          return Promise.reject(data)
        }

        return formatBlock(data.result)
      })
  }

  fetchBlockHeaders (maxHeight, count) {
    const minHeight = Math.max(1, maxHeight - count + 1)
    return this._client
      .get(`/blockchain?maxHeight=${maxHeight}&minHeight=${minHeight}`)
      .then(({ data: { result } }) => {
        return result.block_metas.map(formatBlockHeader)
      })
  }

  fetchRecentBlockHeaders () {
    return this._client
      .get('/blockchain')
      .then(({ data: { result } }) => {
        return result.block_metas.map(formatBlockHeader)
      })
  }

  // TODO Consider return 'tx_result' with result
  fetchTx (hash) {
    hash = hash.startsWith('0x') ? hash : `0x${hash}`
    return this._client
      .get(`/tx?hash=${hash}`)
      .then(({ data }) => {
        if ('error' in data) {
          return Promise.reject(data)
        }

        return JSON.parse(
          Buffer.from(data.result.tx, 'base64').toString()
        )
      })
  }

  fetchValidators () {
    return this._client
      .get('/validators')
      .then(({ data: { result } }) => {
        return result.validators
      })
  }

  fetchTxsByAccount (address) {
    return this._client
      .get(`/tx_search?query="default.tx.sender='${address}'"`)
      .then(({ data }) => {
        return parseTxs(data)
      })
  }

  fetchTxsByParcel (parcel) {
    return this._client
      .get(`/tx_search?query="parcel.id='${parcel}'"`)
      .then(({ data }) => {
        return parseTxs(data)
      })
  }

  abciQuery (type, params) {
    const data = JSON.stringify(params).replace(/"/g, '\\"')
    return this._client
      .get(`/abci_query?path="/${type}"&data="${data}"`)
      .then(({ data }) => {
        if (data.error) {
          return Promise.reject(data.error)
        }
        if (data.result.response.code) {
          return Promise.reject(data.result.response.log)
        }
        return data.result.response.value
      })
  }

  _buildAbciQuery (type, param, fallbackValue) {
    return this.abciQuery(type, param)
      .then(fromBase64)
      .catch(() => Promise.resolve(fallbackValue))
  }

  fetchBalance (address) {
    return this._buildAbciQuery('balance', address, 0)
  }

  fetchStake (address) {
    return this._buildAbciQuery('stake', address, null)
  }

  fetchStakeHolder (address) {
    return this._buildAbciQuery('validator', address, 0)
  }

  fetchDelegate (address) {
    return this._buildAbciQuery('delegate', address, null)
  }

  fetchParcel (id) {
    return this._buildAbciQuery('parcel', id, null)
  }

  fetchRequest (buyer, target) {
    return this._buildAbciQuery('request', { buyer, target }, null)
  }

  fetchUsage (buyer, target) {
    return this._buildAbciQuery('usage', { buyer, target }, null)
  }

  sendTx (tx, ecKey) {
    return this._client
      .get('/status')
      .then(({ data }) => {
        tx.fee = '0'
        tx.last_height = data.result.sync_info.lastest_block_height
        const rawTx = JSON.stringify(this._singTx(tx, ecKey))
        return this.sendRawTx(rawTx)
      })
  }

  _sing (sb, key) {
    const sig = key.sign(sha256(sb))
    const r = ('0000' + sig.r.toString('hex')).slice(-64)
    const s = ('0000' + sig.s.toString('hex')).slice(-64)
    return r + s
  }

  _singTx (tx, key) {
    const txToSign = {
      type: tx.type,
      sender: tx.sender,
      fee: tx.fee,
      last_height: tx.last_height,
      payload: tx.payload
    }

    const sig = this._sing(JSON.stringify(txToSign), key)
    txToSign.signature = {
      pubKey: key.getPublic().encode('hex'),
      sig_bytes: sig
    }

    return txToSign
  }

  sendRawTx (tx) {
    const escaped = tx.replace(/"/g, '\\"')
    return this._client
      .post(`/broadcast_tx_commit?tx="${escaped}"`)
      .then(({ data }) => {
        if (data.error) {
          return Promise.reject(data.error)
        } else if (data.result.check_tx.code > 0) {
          console.log('check_tx error:', data.result.check_tx.code)
          console.log(data.result.check_tx.info)
          return Promise.reject(data.result.check_tx)
        } else if (data.result.deliver_tx.code > 0) {
          console.log('deliver_tx error:', data.result.deliver_tx.code)
          console.log(data.result.deliver_tx.info)
          return Promise.reject(data.result.deliver_tx)
        } else {
          return data
        }
      })
  }

  _buildTxSend (payload, type, sender) {
    if (!sender || !sender.ecKey) {
      return Promise.reject('no sender key')
    }

    const tx = {
      type,
      payload,
      sender: sender.address.toUpperCase()
    }

    return this.sendTx(tx, sender.ecKey)
  }

  transfer (recipient, amount, sender) {
    return this._buildTxSend({
      amount,
      to: recipient.toUpperCase()
    }, 'transfer', sender)
  }

  delegate (delegatee, amount, sender) {
    return this._buildTxSend({
      amount,
      to: delegatee.toUpperCase(),
    }, 'delegate', sender)
  }

  retract (amount, sender) {
    return this._buildTxSend({
      amount
    }, 'retract', sender)
  }

  registerParcel (parcel, sender) {
    return this._buildTxSend({
      target: parcel.id.toUpperCase(),
      custody: parcel.custody.toString('hex').toUpperCase()
    }, 'register', sender)
  }

  discardParcel (parcel, sender) {
    return this._buildTxSend({
      target: parcel.id.toUpperCase()
    }, 'discard', sender)
  }

  requestParcel (parcel, payment, sender) {
    return this._buildTxSend({
      payment,
      target: parcel.id.toUpperCase(),
    }, 'request', sender)
  }

  cancelRequest (parcel, sender) {
    return this._buildTxSend({
      target: parcel.id.toUpperCase()
    }, 'cancel', sender)
  }

  /**
   *
   * @param parcel
   * @param grantee
   * @param custody {Buffer}
   * @param sender
   * @returns {Promise<never>}
   */
  grantParcel (parcel, grantee, custody, sender) {
    return this._buildTxSend({
      target: parcel.id.toUpperCase(),
      grantee: grantee.address.toUpperCase(),
      custody: custody.toString('hex').toUpperCase()
    }, 'grant', sender)
  }

  revokeGrant (parcel, grantee, sender) {
    return this._buildTxSend({
      target: parcel.id.toUpperCase(),
      grantee: grantee.address.toUpperCase()
    }, 'revoke', sender)
  }

}
