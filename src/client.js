import axios from 'axios'
import { createHash } from 'crypto'

export const url = {
  BC_NODE_AMO_TOKYO: 'http://139.162.116.176:26657'
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
      const hash = createHash('sha256').update(decoded).digest().toString('hex')
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

  constructor (config) {
    if (!config) {
      config = {
        baseURL: url.BC_NODE_AMO_TOKYO
      }
    }

    if (!config.baseURL) {
      config.baseURL = url.BC_NODE_AMO_TOKYO
    }

    this._client = axios.create(config)
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
}
