import {AxiosRequestConfig} from "axios"
import {ec} from "elliptic"

type HexEncodedAddress = string
type HexEncodedParcelId = string
type DecimalString = string

declare class AmoClient {
    constructor(config?: AxiosRequestConfig, storageClient?: AxiosRequestConfig, wsURL?: string)

    fetchLastBlock(): Promise<FormattedBlockHeader>

    fetchBlock(height: number | string): Promise<FormattedBlock>

    fetchBlockHeaders(maxHeight: number, count: number): Promise<FormattedBlockHeader[]>

    fetchRecentBlockHeaders(): Promise<FormattedBlockHeader[]>

    fetchTx(hash: string): Promise<Tx>

    fetchValidators(): Promise<Validator[]>

    fetchTxsBySender(sender: HexEncodedAddress): Promise<Tx[]>

    fetchTxsByParcel(parcel: HexEncodedParcelId): Promise<Tx[]>

    abciQuery<T>(type: string, params: object | string): Promise<T>

    fetchBalance(address: HexEncodedAddress): Promise<DecimalString>

    fetchStake(address: HexEncodedAddress): Promise<StakeStorage | null>

    fetchStakeHolder(address: HexEncodedAddress): Promise<HexEncodedAddress | null>

    fetchDelegate(address: HexEncodedAddress): Promise<DelegateStorage | null>

    fetchParcel(id: HexEncodedParcelId): Promise<ParcelStorage | null>

    fetchRequest(buyer: HexEncodedAddress, target): Promise<RequestStorage | null>

    fetchUsage(buyer: HexEncodedAddress, target): Promise<UsageStorage | null>

    transfer(recipient: HexEncodedAddress, amount: DecimalString, sender: Account): Promise<TxResult>

    delegate(delegatee: HexEncodedAddress, amount: DecimalString, sender: Account): Promise<TxResult>

    retract(amount: DecimalString, sender: Account): Promise<TxResult>

    registerParcel(parcel: Parcel, sender: Account): Promise<TxResult>

    discardParcel(parcel: Parcel, sender: Account): Promise<TxResult>

    requestParcel(parcel: Parcel, payment: DecimalString, sender: Account): Promise<TxResult>

    cancelRequest(parcel: Parcel, sender: Account): Promise<TxResult>

    grantParcel(parcel: Parcel, grantee: Grantee, custody: Buffer, sender: Account): Promise<TxResult>

    revokeGrant(parcel: Parcel, grantee: Grantee, sender: Account): Promise<TxResult>

    authParcel(address: HexEncodedAddress, operation: object): Promise<string>

    uploadParcel(owner: Account, content: Buffer): Promise<HexEncodedParcelId>

    // FIXME return type
    downloadParcel(buyer: Account, id: HexEncodedParcelId): Promise<object>

    // FIXME return type
    inspectParcel(id: HexEncodedParcelId): Promise<object>

    // FIXME return type
    removeParcel(id: HexEncodedParcelId): Promise<object>
}

interface TxResult {
    check_tx: TxProcess
    deliver_tx: TxProcess
    hash: string
    height: DecimalString
}

interface TxProcess {
    code: number
    data: string
    log: string
    gas_used: DecimalString
    gas_wanted: DecimalString
    info: string
    tags: object
}

interface Grantee {
    address: HexEncodedAddress
}

interface Parcel {
    id: string
    custody?: Buffer
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
    height: DecimalString
    time: string
    num_txs: DecimalString
    total_txs: DecimalString
    proposer_address: HexEncodedAddress
}

interface FormattedBlockHeader {
    chain: string,
    hash: string,
    height: DecimalString,
    proposer: HexEncodedAddress,
    numTx: DecimalString,
    timestamp: DecimalString
}

interface FormattedBlock extends FormattedBlockHeader {
    txs?: Tx[]
}

interface Tx {
    type: 'transfer' | 'stake' | 'withdraw' | 'delegate' | 'retract' | 'propose' | 'vote' | 'setup' | 'close' | 'register' | 'request' | 'grant' | 'discard' | 'cancel' | 'revoke' | 'issue' | 'lock' | 'burn'
    sender: HexEncodedAddress,
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
        to: HexEncodedAddress
        amount: DecimalString
    }
}

interface StakeTx extends Tx {
    type: 'stake'
    payload: {
        validator: string,
        amount: DecimalString
    }
}

interface WithdrawTx extends Tx {
    type: 'withdraw'
    payload: {
        amount: DecimalString
    }
}

interface DelegateTx extends Tx {
    type: 'delegate'
    payload: {
        to: HexEncodedAddress
        amount: DecimalString
    }
}

interface RetractTx extends Tx {
    type: 'retract'
    payload: {
        amount: DecimalString
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
        dealer?: HexEncodedAddress
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
        amount: DecimalString
    }
}

interface LockTx extends Tx {
    type: 'lock'
    payload: {
        udc: string
        holder: HexEncodedAddress
        amount: DecimalString
    }
}

interface BurnTx extends Tx {
    type: 'burn'
    payload: {
        udc: string
        amount: DecimalString
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
    address: HexEncodedAddress
    pub_key: PubKey
    voting_power: DecimalString
    proposer_priority: DecimalString
}

interface StakeStorage {
    validator: number[]
    amount: DecimalString
}

interface DelegateStorage {
    delegatee: HexEncodedAddress
    amount: DecimalString
}

interface ParcelStorage {
    owner: HexEncodedAddress
    custody: string
    proxy_account?: HexEncodedAddress
    extra?: object
}

interface RequestStorage {
    payment: HexEncodedAddress
    dealer?: DecimalString
    dealer_fee?: string
    extra?: object
}

interface UsageStorage {
    custody: string
    extra?: object
}

interface Account {
    address: HexEncodedAddress
    ecKey: ec.KeyPair
}

interface SyncInfo {
    latest_block_height: DecimalString
    latest_block_hash: DecimalString
}

interface StatusResponse {
    sync_info: SyncInfo
    // TODO
}
