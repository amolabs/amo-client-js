type BlockId = {
  hash: string,
  parts: {
    total: string,
    hash: string
  }
}

type Signature = {
  block_id_flag: number,
  validator_address: string,
  timestamp: string,
  signature: string | null
}

type Block = {
  header: {
    version: {
      block: string
      app: string
    }
    chain_id: string
    height: string
    time: string
    last_block_id: BlockId
    last_commit_Hash: string
    data_hash: string
    validators_Hash: string
    next_validators_hash: string
    consensus_hash: string
    app_hash: string
    last_results_hash: string
    evidence_hash: string
    proposer_address: string
  }
  data: {
    txs: string[]
  }
  evidence: {
    evidence: object | null
  }
  last_commit: {
    height: string
    round: string
    block_id: BlockId
    signatures: Signature[]
  }
}

interface FetchBlockResult {
  block_id: BlockId
  block: Block
}

type FetchBlockHeadersResult = {
  last_height: string
  block_metas: {
    block_id: Block
    block_size: string
    num_txs: string
  } & Pick<Block, 'header'>
}

interface FetchTxResult {
  hash: string
  height: string
  index: number
  tx_result: {
    code: number
    data: object | null
    log: string
    info: string
    gasWanted: string
    gasUsed: string
    events: {
      type: string
      attributes: {
        key: string
        value: string
      }[]
    }[]
    codespace: string
  }
  tx: string
}

interface FetchValidatorsResult {
  block_height: string
  validators: {
    address: string
    pub_key: {
      type: string
      value: string
    }
    voting_power: string
    proposer_priority: string
  }[]
}

interface QueryResponse {
  response: {
    code: number
    log: string
    info: string
    index: string
    key: string
    value: string
    proof: object | null
    height: string
    codespace: string
  }
}


interface UnsignedTx {
  type: string
  sender: string
  fee?: string
  last_height?: string
  payload: object
}

interface SignedTx extends UnsignedTx {
  signature: {
    sig_bytes: string
    pubKey: string
  }
}

interface Parcel {
  id: string,
  custody: string
}

interface Tx {
  type: 'transfer' | 'stake' | 'withdraw' | 'delegate' | 'retract' | 'propose' | 'vote' | 'setup' | 'close' | 'register' | 'request' | 'grant' | 'discard' | 'cancel' | 'revoke' | 'issue' | 'lock' | 'burn'
  sender: string,
  fee: string,
  last_height: string,
  payload: object
  signature?: Signature
  hash?: string
}

interface BlockchainConfig {
  max_validators: number,
  weight_validator: number,
  weight_delegator: number,
  min_staking_unit: string,
  blk_reward: string,
  tx_reward: string,
  penalty_ratio_m: number,
  penalty_ratio_l: number,
  laziness_counter_window: number,
  laziness_threshold: number,
  block_binding_window: number,
  lockup_period: number,
  draft_open_count: number,
  draft_close_count: number,
  draft_apply_count: number,
  draft_deposit: string,
  draft_quorum_rate: number,
  draft_pass_rate: number,
  draft_refund_rate: number
}

interface DelegateStorage {
  delegatee: string
  delegator: string
  amount: string
}

interface StakeStorage {
  validator: number[]
  delegates: DelegateStorage[]
  amount: string
}

interface ParcelStorage {
  owner: string
  custody: string
  proxy_account?: string
  extra?: object
}

interface RequestStorage {
  payment: string
  dealer?: string
  dealer_fee?: string
  extra?: object
}

interface UsageStorage {
  custody: string
  extra?: object
}

interface IncentiveRecord {
  block_height: number
  address: string
  amount: string
}

interface TxResult {
  check_tx: TxProcess
  deliver_tx: TxProcess
  hash: string
  height: string
}

interface TxProcess {
  code: number
  data: string
  log: string
  gas_used: string
  gas_wanted: string
  info: string
  tags: object
}
