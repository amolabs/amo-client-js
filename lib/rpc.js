import axios from 'axios'

const BC_NODE = '139.162.116.176:26657'

const httpURL = `http://${BC_NODE}`

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

// async/await 사용 가능
export function fetchLastBlockPromise () {
  return axios
    .get(`${httpURL}/block`)
    .then(res => formatBlockHeader(res.data.result.block_meta))
}

// async/await 사용 불가
export function fetchLastBlock (callback) {
  axios
    .get(`${httpURL}/block`)
    .then(res =>
      callback(formatBlockHeader(res.data.result.block_meta))
    )
}
