import axios from 'axios'
import { createHash } from 'crypto'

export const url = {
  BC_NODE_AMO_TOKYO: '139.162.116.176:26657'
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

export class AmoClient {

  _client

  /**
   *
   * @param config {AxiosRequestConfig}
   */
  constructor (config) {
    if (!config) {
      config = {
        baseURL: url.BC_NODE_AMO_TOKYO
      }
    }

    if (!config.baseURL) {
      config.baseURL = `http://${url.BC_NODE_AMO_TOKYO}`
    }

    this._client = axios.create(config)
  }

  /**
   *
   * @returns {Promise<FormattedBlockHeader> | PromiseLike<FormattedBlockHeader>}
   */
  fetchLastBlock () {
    return this._client
      .get(`/block`)
      .then(({ data: { result } }) => {
        return formatBlockHeader(result.block_meta)
      })
  }

  /**
   *
   * @param height {number | string} Height of block
   * @returns {Promise<FormattedBlock> | PromiseLike<FormattedBlock>}
   */
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
      .get(`/blockchain`)
      .then(({ data: { result } }) => {
        return result.block_metas.map(formatBlockHeader)
      })
  }

}
