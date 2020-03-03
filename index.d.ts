import {AxiosRequestConfig} from "axios"
import {eddsa} from "elliptic"

declare class AmoClient {
    constructor()
    constructor(config: AxiosRequestConfig)

    fetchLastBlock(): Promise<FormattedBlockHeader>

    fetchBlock(height: number | string): Promise<FormattedBlock>

    fetchBlockHeaders(maxHeight: number, count: number): Promise<FormattedBlockHeader[]>

    fetchRecentBlockHeaders(): Promise<FormattedBlockHeader[]>

    fetchTx(hash: string): Promise<Tx>

    fetchRecentTxs(): Promise<Tx[]>

    fetchValidators(): Promise<Validator[]>

    fetchTxsByAccount(address: string): Promise<Tx[]>

    fetchTxsByParcel(parcel: string): Promise<Tx[]>

    abciQuery<T>(type: string, params: object | string): Promise<T>

    fetchBalance(address: string): Promise<string>

    fetchStake(address: string): Promise<StakeStorage | null>

    fetchStakeHolder(address: string): Promise<string | null>

    fetchDelegate(address: string): Promise<DelegateStorage | null>

    fetchParcel(id: string): Promise<ParcelStorage | null>

    fetchRequest(buyer, target): Promise<RequestStorage | null>

    fetchUsage(buyer, target): Promise<UsageStorage | null>

    transfer(recipient: string, amount: string, sender: Sender): Promise<TxResult>

    delegate(delegatee: string, amount: string, sender: Sender): Promise<TxResult>

    retract(amount: string, sender: Sender): Promise<TxResult>

    registerParcel(parcel: Parcel, sender: Sender): Promise<TxResult>

    discardParcel(parcel: Parcel, sender: Sender): Promise<TxResult>

    requestParcel(parcel: Parcel, payment: string, sender: Sender): Promise<TxResult>

    cancelRequest(parcel: Parcel, sender: Sender): Promise<TxResult>

    grantParcel(parcel: Parcel, grantee: Grantee, custody: Buffer, sender: Sender): Promise<TxResult>

    revokeGrant(parcel: Parcel, grantee: Grantee, sender: Sender): Promise<TxResult>
}

// TODO Check type
interface TxResult {

}

// FIXME Check type
interface Grantee {
    address: string
}

// FIXME Check type
interface Parcel {
    id: string
    custody: Buffer
}

declare const url: {
    BC_NODE_AMO_TOKYO: string
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
    type: 'transfer' | 'stake' | 'withdraw' | 'delegate' | 'retract' | 'propose' | 'vote' | 'setup' | 'close' | 'register' | 'request' | 'grant' | 'discard' | 'cancel' | 'revoke' | 'issue' | 'lock' | 'burn'
    sender: string,
    fee: string,
    last_height: string,
    payload: object
    signature?: Signature
    hash?: string
}

interface TransferTx extends Tx {
    type: 'transfer'
    payload: {
        udc?: string
        to: string
        amount: string
    }
}

interface StakeTx extends Tx {
    type: 'stake'
    payload: {
        validator: string,
        amount: string
    }
}

interface WithdrawTx extends Tx {
    type: 'withdraw'
    payload: {
        amount: string
    }
}

interface DelegateTx extends Tx {
    type: 'delegate'
    payload: {
        to: string
        amount: string
    }
}

interface RetractTx extends Tx {
    type: 'retract'
    payload: {
        amount: string
    }
}

interface ProposeTx extends Tx {
    type: 'propose'
    payload: {
        draft_id: string
        config: object
        desc: string
    }
}

interface VoteTx extends Tx {
    type: 'vote'
    payload: {
        draft_id: string
        approve: boolean
    }
}

interface SetupTx extends Tx {
    type: 'setup'
    payload: {
        storage: string,
        url: string,
        registration_fee: string,
        hosting_fee: string
    }
}

interface CloseTx extends Tx {
    type: 'close'
    payload: {
        storage: string
    }
}

interface RegisterTx extends Tx {
    type: 'register'
    payload: {
        target: string,
        custody: string,
        proxy_account?: string,
        extra?: object
    }
}

interface RequestTx extends Tx {
    type: 'request'
    payload: {
        target: string
        payment: string
        dealer?: string
        dealer_fee?: string
        extra?: object
    }
}

interface GrantTx extends Tx {
    type: 'grant'
    payload: {
        target: string
        grantee: string
        custody: string
        extra?: object
    }
}

interface DiscardTx extends Tx {
    type: 'discard'
    payload: {
        target: string
    }
}

interface CancelTx extends Tx {
    type: 'cancel'
    payload: {
        target: string
    }
}

interface RevokeTx extends Tx {
    type: 'revoke'
    payload: {
        target: string
        grantee: string
    }
}

interface IssueTx extends Tx {
    type: 'issue'
    payload: {
        udc: string
        desc: string
        operations: string[]
        amount: string
    }
}

interface LockTx extends Tx {
    type: 'lock'
    payload: {
        udc: string
        holder: string
        amount: string
    }
}

interface BurnTx extends Tx {
    type: 'burn'
    payload: {
        udc: string
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

interface StakeStorage {
    validator: number[]
    amount: string
}

interface DelegateStorage {
    delegatee: string
    amount: string
}

interface ParcelStorage {
    owner: string
    custody: string
    proxy_account: string
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

interface Sender {
    address: string
    ecKey: eddsa.KeyPair
}
