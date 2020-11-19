import axios, {AxiosInstance, AxiosRequestConfig, AxiosResponse} from "axios"
import {ec} from "elliptic"
import {deriveAddress, sign} from "./utils"

export const DEFAULT_URL = {
  AMO_TOKYO: 'http://139.162.116.176:26657',
  AMO_STORAGE: 'http://139.162.111.178:5000'
} as const

interface TmAxiosInstance extends AxiosInstance {
  get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T>

  post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T>
}

class Tendermint {
  private client: TmAxiosInstance

  constructor(client: TmAxiosInstance) {
    this.client = client
  }

  fetchLastBlock() {
    return this.client
      .get<FetchBlockResult>(`/block`)
  }

  fetchBlock(height: string | number) {
    return this.client
      .get<FetchBlockResult>(`/block?height=${height}`)
  }

  fetchBlockHeaders(maxHeight: number, count: number) {
    const minHeight = Math.max(1, maxHeight - count + 1)
    return this.client
      .get<FetchBlockHeadersResult[]>(`/blockchain?maxHeight=${maxHeight}&minHeight=${minHeight}`)
  }

  fetchTx(hash: string) {
    const prefixedHash = hash.startsWith('0x') ? hash : `0x${hash}`
    return this.client
      .get<FetchTxResult>(`/tx?hash=${prefixedHash}`)
  }

  fetchValidators() {
    return this.client
      .get<FetchValidatorsResult>(`/validators`)
  }

  // NOT WORKING
  fetchTxsBySender(sender: string) {
    return this.client
      .get<Tx[]>(`/tx_search?query="default.tx.sender='${sender}'"`)
  }

  // NOT WORKING
  fetchTxsByParcel(parcel: string) {
    return this.client
      .get<Tx[]>(`/tx_search?query="parcel.id='${parcel}'"`)
  }
}

interface QueryAxiosInstance extends TmAxiosInstance {
  abci: <T> (type: string, params?: any) => Promise<T>
}

class Query {
  private client: QueryAxiosInstance

  constructor(client: TmAxiosInstance) {
    (client as QueryAxiosInstance).abci = function <T>(type: string, params: any = null) {
      const data = JSON.stringify(params).replace(/"/g, '\\"')
      return this
        .get<QueryResponse>(`/abci_query?path="/${type}"&data="${data}"`)
        .then(({response: res}) => {
          if (res.code > 0) {
            return Promise.reject(res)
          }

          return Promise.resolve(
            JSON.parse(Buffer.from(res.value, 'base64').toString())
          )
        })
    }

    this.client = (client as QueryAxiosInstance)
  }

  config() {
    return this.client.abci<BlockchainConfig>('config')
  }

  balance(address: string) {
    return this.client.abci<string>('balance', address)
  }

  stake(address: string) {
    return this.client.abci<StakeStorage>('stake', address)
  }

  delegate(address: string) {
    return this.client.abci<DelegateStorage>('delegate', address)
  }

  validator(validatorAddress: string) {
    return this.client.abci<string>('validator', validatorAddress)
  }

  draft(draftId: string) {
    return this.client.abci<object>('draft', draftId)
  }

  storage(storageId: string | number) {
    return this.client.abci<object>('storage', storageId)
  }

  parcel(parcelId: string) {
    return this.client.abci<ParcelStorage>('parcel', parcelId)
  }

  request(buyer: string, target: string) {
    return this.client.abci<RequestStorage>('request', {buyer, target})
  }

  usage(buyer: string, target: string) {
    return this.client.abci<UsageStorage>('usage', {buyer, target})
  }

  incBlock(height: string | number) {
    return this.client.abci<IncentiveRecord[]>('inc_block', height)
  }

  incAddress(address: string) {
    return this.client.abci<IncentiveRecord[]>('inc_address', address)
  }

  inc(height: string | number, address: string) {
    return this.client.abci<IncentiveRecord[]>('inc', {height, address})
  }
}

class Transaction {
  private client: TmAxiosInstance
  private readonly ecKey: ec.KeyPair | undefined
  private readonly address: string | undefined

  constructor(client: TmAxiosInstance, ecKey?: ec.KeyPair) {
    this.client = client
    if (ecKey) {
      this.ecKey = ecKey
      this.address = deriveAddress(ecKey)
    }
  }

  broadcast(tx: SignedTx): Promise<TxResult> {
    const escaped = JSON.stringify(tx).replace(/"/g, '\\"')
    return this
      .client
      .post<TxResult>(`/broadcast_tx_commit?tx="${escaped}"`)
      .then((result) => {
        if (result.check_tx.code > 0) {
          return Promise.reject(result.check_tx)
        } else if (result.deliver_tx.code > 0) {
          return Promise.reject(result.deliver_tx)
        } else {
          return result
        }
      })
  }

  singTx(tx: UnsignedTx): SignedTx {
    if (this.ecKey === undefined) {
      throw new Error("ecKey")
    }

    const signObject = {
      ...tx
    }

    const sig_bytes = sign(JSON.stringify(signObject), this.ecKey)

    return {
      ...signObject,
      signature: {
        sig_bytes,
        pubKey: this.ecKey.getPublic('hex')
      }
    }
  }

  buildTx(payload: object, type: string) {
    if (this.address === undefined) {
      throw new Error("ecKey")
    }

    this
      .client
      .get(`/status`)
      .then(({sync_info}) => {
        const tx: UnsignedTx = {
          type,
          payload,
          sender: this.address!
        }

        tx.fee = '0'
        tx.last_height = sync_info.latest_block_height
        return tx
      })
      .then((res: any) => this.singTx(res))
  }

  transfer(recipient: string, amount: string) {
    return this.buildTx({
      amount,
      to: recipient
    }, 'transfer')
  }

  stake(validatorAddress: string, amount: string) {
    return this.buildTx({
      amount,
      validator: validatorAddress
    }, 'stake')
  }

  withdraw(amount: string) {
    return this.buildTx({
      amount
    }, 'withdraw')
  }

  delegate(delegatee: string, amount: string) {
    return this.buildTx({
      amount,
      to: delegatee
    }, 'delegate')
  }

  retract(amount: string) {
    return this.buildTx({
      amount
    }, 'retract')
  }

  propose(draftId: string, config: object, desc?: string) {
    return this.buildTx({
      draftId,
      config,
      desc
    }, 'propose')
  }

  vote(draftId: string, approve: boolean) {
    return this.buildTx({
      draftId,
      approve
    }, 'vote')
  }

  setup(storageId: string, url: string, registrationFee: string, hostingFee: string) {
    return this.buildTx({
      url,
      storage: storageId,
      registration_fee: registrationFee,
      hosting_fee: hostingFee
    }, 'setup')
  }

  close(storageId: string) {
    return this.buildTx({
      storage: storageId
    }, 'close')
  }

  register(parcel: Parcel) {
    return this.buildTx({
      target: parcel.id,
      custody: parcel.custody
    }, 'register')
  }

  discard(target: string) {
    return this.buildTx({
      target
    }, 'discard')
  }

  request(payment: string, target: string) {
    return this.buildTx({
      payment,
      target
    }, 'request')
  }

  cancel(target: string) {
    return this.buildTx({
      target
    }, 'cancel')
  }

  grant(parcel: Parcel, grantee: string) {
    return this.buildTx({
      target: parcel.id,
      grantee,
      custody: parcel.custody
    }, 'grant')
  }

  revoke(target: string, grantee: string) {
    return this.buildTx({
      target,
      grantee
    }, 'revoke')
  }

  issue(udc: string, operators: string, amount: string, desc?: string) {
    return this.buildTx({
      desc,
      operators,
      amount,
      udc
    }, 'issue')
  }

  lock(udc: string, holder: string, amount: string) {
    return this.buildTx({
      holder,
      amount,
      udc
    }, 'lock')
  }

  burn(udc: string, amount: string) {
    return this.buildTx({
      amount,
      udc
    }, 'burn')
  }

}

class AMO {
  private client: TmAxiosInstance
  tm: Tendermint
  query: Query
  tx: Transaction

  constructor(endpoint: string = DEFAULT_URL.AMO_TOKYO, ecKey?: ec.KeyPair) {
    const defaultConfig: AxiosRequestConfig = {
      baseURL: endpoint
    }

    const client = axios.create(defaultConfig)
    const queryClient = axios.create(defaultConfig)

    const onFulfilled = function (res: AxiosResponse) {
      const {data} = res
      if ('error' in data) {
        return Promise.reject(data.error)
      }

      return Promise.resolve(data.result)
    }

    client.interceptors.response.use(onFulfilled)
    queryClient.interceptors.response.use(onFulfilled)

    this.tm = new Tendermint(client)
    this.query = new Query(queryClient)
    this.tx = new Transaction(client, ecKey)
    this.client = client
  }
}

export default AMO
