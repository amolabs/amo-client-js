import {AxiosRequestConfig} from "axios"

declare module 'amo-clinet-js' {
    interface AmoClient {
        new(config: AxiosRequestConfig)

        fetchLastBlock(): Promise<FormattedBlockHeader>

        fetchBlock(height: number | string): Promise<FormattedBlock>

        fetchBlockHeaders(maxHeight: number, count: number): Promise<FormattedBlockHeader[]>

        fetchRecentBlockHeaders(): Promise<FormattedBlockHeader[]>

        fetchTx(hash): Promise<Tx>

        fetchRecentTxs(): Promise<Tx[]>

        fetchValidators(): Promise<Validator[]>
    }
}

interface TendermintBlock {
    block_meta: BlockMeta
    block: Block
}

interface Block {
    header: BlockHeader
    data: BlockData
}

interface BlockData {
    txs?: string[]
}

interface BlockMeta {
    block_id: BlockId
    header: BlockHeader
}

interface BlockId {
    hash: string
}

interface BlockHeader {
    chain_id: string
    height: string
    time: string
    num_txs: string
    total_txs: string
    proposer_address: string
}

interface FormattedBlockHeader {
    chain: string,
    hash: string,
    height: string,
    proposer: string,
    numTx: string,
    timestamp: string
}

interface FormattedBlock extends FormattedBlockHeader {
    txs?: Tx[]
}

interface Tx {
    type: 'transfer'
    sender: string,
    fee: string,
    last_height: string,
    payload: object
    signature: Signature
    hash: string
}

interface TransferTx extends Tx {
    type: 'transfer'
    payload: {
        to: string
        amount: string
    }
}

interface Signature {
    pubkey: string,
    sig_bytes: string
}

interface BlockchainResponse {
    last_height: string
    block_metas: BlockMeta[]
}

interface TxResponse {
    tx: string
}

interface PubKey {
    type: string
    value: string
}

interface ValidatorsResponse {
    validators: Validator[]
}

interface Validator {
    address: string
    pub_key: PubKey
    voting_power: string
    proposer_priority: string
}
