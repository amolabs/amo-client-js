import axios from 'axios'
import { createHash } from 'crypto'

export const url = {
  BC_NODE_AMO_TOKYO: 'http://139.162.116.176:26657',
  BC_NODE_WS: 'ws://139.162.116.176:26657/websocket',
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
  _wsURL
  _ws

  constructor (config, storageConfig, wsURL) {
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
    this._wsURL = wsURL || url.BC_NODE_WS
  }

  startSubscribe (onNewBlock, onError) {
    if (WebSocket === undefined) {
      throw new Error('websocket not supported')
    }

    this._ws = new WebSocket(this._wsURL)
    this._ws.onopen = () => {
      this._ws.send(
        JSON.stringify({
          jsonrpc: '2.0',
          method: 'subscribe',
          id: 'newBlock',
          params: {
            query: 'tm.event=\'NewBlock\''
          }
        })
      )
    }
    this._ws.onmessage = e => {
      const message = JSON.parse(e.data)
      if (message.id === 'newBlock#event') {
        const blockHeader = message.result.data.value.block.header
        onNewBlock(blockHeader.height)
      }
    }
    this._ws.onerror = onError
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

  fetchTxsBySender (sender) {
    return this._client
      .get(`/tx_search?query="default.tx.sender='${sender}'"`)
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

  queryConfig () {
    return this._buildAbciQuery('config', null, null)
  }

  queryBalance (address) {
    return this._buildAbciQuery('balance', address, '0')
  }

  queryStake (address) {
    return this._buildAbciQuery('stake', address, null)
  }

  queryDelegate (address) {
    return this._buildAbciQuery('delegate', address, null)
  }

  queryValidator (validatorAddress) {
    return this._buildAbciQuery('validator', validatorAddress, null)
  }

  queryDraft (draftId) {
    return this._buildAbciQuery('draft', draftId, null)
  }

  queryStorage (storageId) {
    return this._buildAbciQuery('storage', storageId, null)
  }

  queryParcel (id) {
    return this._buildAbciQuery('parcel', id, null)
  }

  queryRequest (buyer, target) {
    return this._buildAbciQuery('request', { buyer, target }, null)
  }

  queryUsage (buyer, target) {
    return this._buildAbciQuery('usage', { buyer, target }, null)
  }

  queryIncBlock (height) {
    return this._buildAbciQuery('inc_block', height, [])
  }

  queryIncAddress (address) {
    return this._buildAbciQuery('inc_address', address, [])
  }

  queryInc (height, address) {
    return this._buildAbciQuery('inc', { height, address }, [])
  }

  sendTx (tx, ecKey) {
    return this._client
      .get('/status')
      .then(({ data }) => {
        tx.fee = '0'
        tx.last_height = data.result.sync_info.latest_block_height
        const rawTx = JSON.stringify(this._signTx(tx, ecKey))
        return this.sendRawTx(rawTx)
      })
  }

  _sign (sb, key) {
    const sig = key.sign(sha256(sb))
    const r = ('0000' + sig.r.toString('hex')).slice(-64)
    const s = ('0000' + sig.s.toString('hex')).slice(-64)
    return r + s
  }

  _signTx (tx, key) {
    const txToSign = {
      type: tx.type,
      sender: tx.sender,
      fee: tx.fee,
      last_height: tx.last_height,
      payload: tx.payload
    }

    const sig = this._sign(JSON.stringify(txToSign), key)
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
      return Promise.reject(new Error('no sender key'))
    }

    const tx = {
      type,
      payload,
      sender: sender.address.toUpperCase()
    }

    return this.sendTx(tx, sender.ecKey)
  }

  sendTransfer (recipient, amount, sender) {
    return this._buildTxSend({
      amount,
      to: recipient.toUpperCase()
    }, 'transfer', sender)
  }

  sendStake (validatorAddress, amount, sender) {
    return this._buildTxSend({
      amount,
      validator: validatorAddress
    }, 'stake', sender)
  }

  sendWithdraw (amount, sender) {
    return this._buildTxSend({
      amount
    }, 'withdraw', sender)
  }

  sendDelegate (delegatee, amount, sender) {
    return this._buildTxSend({
      amount,
      to: delegatee.toUpperCase()
    }, 'delegate', sender)
  }

  sendRetract (amount, sender) {
    return this._buildTxSend({
      amount
    }, 'retract', sender)
  }

  sendPropose (draftId, config, desc, sender) {
    return this._buildTxSend({
      draftId,
      config,
      desc
    }, 'propose', sender)
  }

  sendVote (draftId, approve, sender) {
    return this._buildTxSend({
      draftId,
      approve
    }, 'vote', sender)
  }

  sendSetup (storageId, url, registrationFee, hostingFee, sender) {
    return this._buildTxSend({
      url,
      storage: storageId,
      registration_fee: registrationFee,
      hosting_fee: hostingFee
    }, 'setup', sender)
  }

  sendClose (storageId, sender) {
    return this._buildTxSend({
      storage: storageId
    }, 'close', sender)
  }

  sendRegisterParcel (parcel, sender) {
    return this._buildTxSend({
      target: parcel.id.toUpperCase(),
      custody: parcel.custody.toString('hex').toUpperCase()
    }, 'register', sender)
  }

  sendDiscardParcel (parcel, sender) {
    return this._buildTxSend({
      target: parcel.id.toUpperCase()
    }, 'discard', sender)
  }

  sendRequestParcel (parcel, payment, sender) {
    return this._buildTxSend({
      payment,
      target: parcel.id.toUpperCase()
    }, 'request', sender)
  }

  sendCancelRequest (parcel, sender) {
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
   * @returns {Promise<TxResult>}
   */
  sendGrantParcel (parcel, grantee, custody, sender) {
    return this._buildTxSend({
      target: parcel.id.toUpperCase(),
      grantee: grantee.address.toUpperCase(),
      custody: custody.toString('hex').toUpperCase()
    }, 'grant', sender)
  }

  sendRevokeGrant (parcel, grantee, sender) {
    return this._buildTxSend({
      target: parcel.id.toUpperCase(),
      grantee: grantee.address.toUpperCase()
    }, 'revoke', sender)
  }

  sendIssue (udcId, desc, operators, amount, sender) {
    return this._buildTxSend({
      desc,
      operators,
      amount,
      udc: udcId
    }, 'issue', sender)
  }

  sendLock (udcId, holder, amount, sender) {
    return this._buildTxSend({
      holder,
      amount,
      udc: udcId
    }, 'lock', sender)
  }

  sendBurn (udcId, amount, sender) {
    return this._buildTxSend({
      amount,
      udc: udcId
    }, 'burn', sender)
  }

  authParcel (address, operation) {
    return this._storageClient
      .post('/api/v1/auth', {
        user: address,
        operation
      })
      .then(({ data }) => {
        if ('error' in data) {
          return Promise.reject(data.error)
        } else {
          return data.token
        }
      })
  }

  _makeAuthHeaders (token, account) {
    return {
      'X-Auth-Token': token,
      'X-Public-Key': account.ecKey.getPublic().encode('hex'),
      'X-Signature': this._sign(token, account.ecKey)
    }
  }

  uploadParcel (owner, content) {
    return this.authParcel(owner.address, {
      name: 'upload',
      hash: sha256(content).toString('hex')
    })
      .then((token) => {
        return this._storageClient
          .post('/api/v1/parcels', {
            owner: owner.address,
            metadata: {
              owner: owner.address
            },
            data: content.toString('hex')
          }, {
            headers: this._makeAuthHeaders(token, owner)
          })
      })
      .then(({ data }) => {
        if ('error' in data) {
          return Promise.reject(data.error)
        }
        return data.id
      })
  }

  downloadParcel (buyer, id) {
    return this.authParcel(buyer.address, {
      name: 'download',
      id
    })
      .then((token) => {
        return this._storageClient
          .get(`/api/v1/parcels/${id}`, {
            headers: this._makeAuthHeaders(token, buyer)
          })
      })
      .then(({ data }) => {
        if ('error' in data) {
          return Promise.reject(data.error)
        }
        return data.data
      })
  }

  inspectParcel (id) {
    return this._storageClient
      .get(`/api/v1/parcels/${id}?key=metadata`)
      .then(({ data }) => {
        if ('error' in data) {
          return Promise.reject(data.error)
        }
        return data.metadata
      })
  }

// TODO
  removeParcel (id) { return Promise.reject(new Error('implement me')) }
}
