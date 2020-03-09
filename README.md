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

Requests can be made by passing the relevant parameters to `AmoClient`.

```typescript
// Type alias for convenience
// Uppercase Hex encoded address
type HexEncodedAddress = string

// Uppercase Hex encoded id
type HexEncodedParcelId = string

// DecimalString represents number as string
// e.g 1000 -> "1000"
type DecimalString = string
```

## AmoClient

AmoClient uses [Axios](https://github.com/axios/axios#request-config) internally for making requests 

```javascript
class AmoClient {
    constructor(
        // Config for Tendermint API and ABCI query
        // Axios instance config
        nodeClient,
        // Config for AMO storage API
        // Axios instance config
        storageClient,
        // WebSocket URL for newBlock event
        // String
        wsURL
    )
}
```
Return type of AmoClient method is `Promise`. 
When request fails, client will reject with error object in response of AMO blockchain 
[RPC](https://github.com/amolabs/docs/blob/master/rpc.md).

## Tendermint API
AMO blockchain is based on [Tendermint](https://github.com/tendermint/tendermint).
AmoClient provides basic Tendermint [RPCs](https://docs.tendermint.com/master/rpc/).

As mentioned above, some return types are parsed from RPC response format. 
If you want to see actual response format of AMO blockchain, 
check out [RPC document](https://github.com/amolabs/docs/blob/master/rpc.md).

### fetchLastBlock()
Fetch latest block header

### fetchBlock(height)
Fetch Block of specific height

- height: `DecimalString` or `number`

### fetchBlockHeaders(maxHeight, count)
Fetch Block headers 

- maxHeight: `number`
- count: `number`

### fetchRecentBlockHeaders()
Fetch recent 20 block headers

### fetchTx(hash)
Fetch transaction by hash

- hash: `HexEncodedHash`

### fetchValidators()
Fetch validators of latest block

### fetchTxsBySender(sender)
Fetch transactions by sender address

- sender: `HexEncodedAddress`

### fetchTxsByParcel(parcel)
Fetch transactions by parcel id

- parcel: `HexEncodedPArcelId`

## ABCI Query
Query indexed or stored data from AMO Blockchain. 

Return types of query are defined in AMO Blockchain [protocol document](https://github.com/amolabs/docs/blob/master/protocol.md#data-stores)

ABCI Query returns default value when request fails.

- `DecimalString` -> `"0"`
- `Object` -> `null`
- `Array` -> `[]`

### queryConfig()
Query config using in AMO Blockchain governance

- return: [`BlockchainConfig`](https://github.com/amolabs/docs/blob/master/protocol.md#top-level-data)

### queryBalance(address)
Query balance of address

- address: `HexEncodedAddress`

### queryStake(address)
Query stake

- address: `HexEncodedAddress`

### queryDelegate(address)
Query delegation

- address: `HexEncodedAddress`

### queryValidator(validatorAddress)
Query holder account of validator

- validatorAddress: `HexEncodedAddress`

### queryDraft(draftId)
Query draft

- draftId: `DecimalString`

### queryStorage(storageId)
Query storage

- storageId: `DecimalString`

### queryParcel(parcelId)
Query parcel

- parcelId: `HexEncodedParcelId`

### queryRequest(buyer, target)
Query request

- buyer: `HexEncodedAddress`
- target: `HexEncodedParcelId`

### queryUsage(buyer, target)
Query usage

- buyer: `HexEncodedAddress`
- target: `HexEncodedParcelId`

### queryIncBlock(height)
Query incentive block

- height: `DecimalString` or `number`

### queryIncAddress(address)
Query incentive address

- address: `HexEncodedAddress`

### queryInc(height, address)
Query incentive

- height: `DecimalString` or `number`
- address: `HexEncodedAddress`

## Transaction

Signing transaction needs [`elliptic`](https://www.npmjs.com/package/elliptic) package.

All Transaction method returns `Promise<TxResult>`.

Information about transactions is in AMO blockchain [document](https://github.com/amolabs/docs/blob/master/protocol.md#transaction).

### Response schema (TxResult)
```js
{
    "check_tx": {
        "code": 0, // O
        "data": "...",
        "info": "...",
        "tags": {
            "...": "..."
        }       
    },
    "deliver_tx": {
        // same as check_tx
    }
    "hash": "E5683994A2498CDBC12C129C8FB31068845952E67964152052DFA1E49DD5BFA9",
    "height": "1234"
}
```

Every transaction method needs `sender` for signing transaction
### Sender schema
```js
{
    "address": "<HexEncodedAddress>"
    "ecKey": {
        // ec.KeyPair from elliptic
    } 
}
```

### Coins and stakes
- sendTransfer(recipient, amount, sender)
    - recipient: `HexEncodedAddress`
    - amount: `DecimalString`
- sendStake(validatorAddress, amount, sender)
    - validatorAddress: `HexEncodedAddress`
    - amount: `DecimalString`
- sendWithdraw(amount, sender)
    - amount: `DecimalString`
- sendDelegate(delegatee, amount, sender)
    - delegatee: `HexEncodedAddresss`
    - amount: `DecimalString`
- sendRetract(amount, sender)
    - amount: `DecimalString`

### Governance
- sendPropose(draftId, config, desc, sender)
    - draftId: `DecimalString`
    - config: [`BlockchainConfig`](https://github.com/amolabs/docs/blob/master/protocol.md#top-level-data)
    - desc: `string`
- sendVote(draftId, approve, sender)
    - draftId: `DecimalString`
    - approve: `boolean`

### Storage
- sendSetup(storageId, url, registrationFee, hostingFee, sender)
    - storageId: `DecimalString`
    - url: `string`
    - registrationFee: `DecimalString`
    - hostringFee: `DecimalString`
- sendClose(storageId, sender)
    - storageId `DecimalString`

### Parcels

#### Parcel schemal
```js
{
    "id": "<HexEncodedParcelId>",
    "custody": Buffer.from("<Custody key>", "hex") // Optional
}
```

- sendRegisterParcel(parcel, sender)
- sendDiscardParcel(parcel, sender)
- sendRequestParcel(parcel, payment, sender)
    - payment: `DecimalString`
- sendCancelRequest(parcel, sender)
- sendGrantParcel(parcel, grantee, custody, sender)
    - grantee: `HexEncodedAddress`
    - custody: `Buffer`
- sendRevokeGrant(parcel, grantee, sender)
    - grantee: `HexEncodedAddress`

### UDC (User Defined Coin)

- sendIssue(udcId, desc, operations, amount, sender)
    - udcId: `DecimalString`
    - desc: `string`
    - operations: `Array of HexEncodedAddress`
    - amount: `DecimalString`
- sendLock(udcId, holder, amount, sender)
    - udcId: `DecimalString`
    - holder: `HexEncodedAddress`
    - amount: `DecimalString`
- sendBurn(udcId, amount, sender)
    - udcId: `DecimalString`
    - amount: `DecimalString`

## AMO storage

### uploadParcel(owner, content)

- TODO

### downloadParcel(buyer, id)

- TODO

### inspectParcel(id)

- TODO

### removeParcel(id)

- TODO

## Typescript
All types in `index.d.ts` are already defined in AMO blockchain [RPC document](https://github.com/amolabs/docs/blob/master/rpc.md) 
except parsed types such as `Tx`, `FormattedBlock` and `FormattedBlockHeader`
