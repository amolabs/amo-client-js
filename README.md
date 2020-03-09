# amo-client-js
Reference library for AMO client for javascript. This document is available in
[Korean](README.ko.md) also(not yet).

## Introduction
AMO Labs provides a client software library as a reference implementation. This
library or package intereact with AMO blockchain nodes over HTTP(S) using
[AMO client RPC specification](https://github.com/amolabs/docs/blob/master/rpc.md).

## Using this package

### Install
`npm install amo-client` or `yarn add amo-client`

### Usage
```javascript
import { AMOClient } from 'amo-client'

// Create client
const client = new AMOClient({
  baseURL: '<AMO node rpc endpoint>' // by default: url.BC_NODE_AMO_TOKYO 
  // ... extra config from AxiosRequestConfig
}, {
  baseURL: '<AMO Storage url>'
  // ... extra config from AxiosRequestConfig
}, 'ws://...')

(async () => {
  const lastBlock = await client.fetchLastBlock()
  console.log(JSON.stringify(lastBlock, null, 4))
})()
```

## Remote servers
Since every AMO client is a client program, it needs remote server addresses to
perform user requests. That is AMO blockchain RPC node.

**AMO blockchain RPC node** is any AMO blockchain node which is connected to
AMO blockchain network and provides an RPC service. You can connect to any
publicly available nodes or run your own dedicated node for your clients. An
RPC node address is composed of an IP address and a port number. The default
port number is 26657. Make sure the firewall of your network does not block
this port number.

TBA: Public RPC node addresses provided by AMO Labs

## About user keys
**NOTE:** This issue is not relevant when you want to use this library in
purely read-only opertions. However, if you want to use this library for
web-based wallet or similar kind of software which emits transactions signed
with the user private key, you must be cautious dealing with seeds and keys.

This client library or package does not provide a feature handling private keys
store in local disk or some kind of permanent memory. This library or package
provides 3 methods to handle user private key:
* generate private key and public key pair from user-supplied seed bytes
* generate public key from user-supplied private key bytes
* no generation of anything, just use the user-supplied public key

The third option is relevant when you are planning to implement read-only
inspection features.

## API

Requests can be made by passing the releavant paramaters to `AmoClient`.

You can check types in `index.d.ts`

## Types
```typescript
// Uppercase Hex encoded address
type HexEncodedAddress = string

// Uppercase Hex encoded id
type HexEncodedParcelID = string

// DecimalString represents number as string
// e.g 1000 -> "1000"
type DecimalString = string
```
## AmoClient

AmoClient uses [Axios](https://github.com/axios/axios#request-config) internally for making requests 

```typescript
import { AxiosRequestConfig } from "axios"

class AmoClient {
    constructor(
        // Config for Tendermint REST API and ABCI query
        nodeClient?: AxiosRequestConfig,
        // Config for AMO storage API
        storageClient?: AxiosRequestConfig,
        // WebSocket URL for newBlock event
        wsURL?: string
    )

```
Return type of AmoClient method is `Promise<T>`

## Tendermint REST API
AMO blockchain is based on [Tendermint](https://github.com/tendermint/tendermint).
We provide basic Tendermint [RPCs](https://docs.tendermint.com/master/rpc/).

### fetchLastBlock()

- Fetch latest block header

### fetchBlock(height)

- Fetch Block of specific height

### fetchBlockHeaders(maxHeight, count)

- Fetch Block headers 

### fetchRecentBlockHeaders()

- Fetch recent 20 block headers

### fetchTx(hash)

- Fetch transaction by hash

### fetchValidators()

- Fetch validators of latest block

### fetchTxsBySender(sender)

- Fetch transactions by sender address

### fetchTxsByParcel(parcel)

- Fetch transactions by parcel id

## ABCI Query
Query indexed or stored data from AMO Blockchain. 

https://github.com/amolabs/docs/blob/master/protocol.md#data-stores

ABCI Query returns default value when request fails.

- `DecimalString` -> `"0"`
- `Object` -> `null`
- `Array` -> `[]`

### queryConfig()

- Query config using in AMO Blockchain governance

### queryBalance(address)

- Query balance of address

### queryStake(address)

- Query stake

### queryDelegate(address)

- Query delegation

### queryValidator(validatorAddress)

- Query holder account of validator

### queryDraft(draftId)

- Query draft

### queryStorage(storageId)

- Query storage

### queryParcel(parcelId)

- Query parcel

### queryRequest(buyer, target)

- Query request

### queryUsage(buyer, target)

- Query usage

### queryIncBlock(height)

- Query incentive block

### queryIncAddress(address)

- Query incentive address

### queryInc(height, address)

- Query incentive

## Transaction

Signing transaction needs `elliptic` package.

All Transaction method returns `Promise<TxResult>`.

Information about transactions is in AMO blockchain [document](https://github.com/amolabs/docs/blob/master/protocol.md#transaction).

```typescript
import {ec} from 'elliptic'

interface Account {
    address: string
    ecKey: ec.KeyPair
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

interface TxResult {
    check_tx: TxProcess
    deliver_tx: TxProcess
    hash: string
    height: string
}
```

### sendTransfer(recipient, amount, sender)
### sendStake(validatorAddress, amount, sender)
### sendWithdraw(amount, sender)
### sendDelegate(delegatee, amount, sender)
### sendRetract(amount, sender)
### sendPropose(draftId, config, desc, sender)
### sendVote(draftId, approve, sender)
### sendSetup(storageId, url, registrationFee, hostingFee, sender)
### sendClose(storageId, sender)
### sendRegisterParcel(parcel, sender)
### sendDiscardParcel(parcel, sender)
### sendRequestParcel(parcel, payment, sender)
### sendCancelRequest(parcel, sender)
### sendGrantParcel(parcel, grantee, custody, sender)
### sendRevokeGrant(parcel, grantee, sender)
### sendIssue(udcId, desc, operations, amount, sender)
### sendLock(udcId, holder, amount, sender)

## AMO storage

### uploadParcel(owner, content)

- TODO

### downloadParcel(buyer, id)

- TODO

### inspectParcel(id)

- TODO

### removeParcel(id)

- TODO

