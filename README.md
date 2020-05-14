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
// commonjs
const {AMO} = require('amo-client')
// es6
import {AMO} from "amo-client"

// Create client
const client = new AMO();

(async () => {
  const result = await client.query.balance('0035B04B9F62B8FEAFC3500BC16E31EAF96E8361')
  console.log(result)
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

## amo-client API

Requests can be made by `AMO` or `Parcel`

* `AMO` is blockchain related RPC call client

* `Parcel` is parcel storage related RPC call client 
 
### AMO

##### AMO(endpoint = DEFAULT_AMO_ENDPOINT\[, keypair\])

```javascript
// Create client without ec.KeyPair
// You can't make Tx requests
AMO("http://localhost:26657")
```
```javascript
const EC = require('elliptic')

// AMO blockchain uses p256
const ec = new EC('p256');

// Generate key or use existed key
const key = ec.genKeyPair();

// Create client with ec.KeyPair
AMO("http://localhost:26657", key)
```

AMO client composed with other three clients. `Tendermint`, `Query` and `Transaction`
#### Tendermint methods

You can access `Tendermint` client by `tm`
```javascript
const amo = new AMO()
// Fetch last block from network
amo.tm.fetchLastBlock()
```

AMO blockchain is based on [Tendermint](https://github.com/tendermint/tendermint).
Tendermint client provides basic Tendermint [RPCs](https://docs.tendermint.com/master/rpc/).

As mentioned above, some return types are parsed from RPC response format. 
If you want to see actual response format of AMO blockchain, 
check out [RPC document](https://github.com/amolabs/docs/blob/master/rpc.md).

* fetchLastBlock()

* fetchBlock(height)

* fetchBlockHeaders(maxHeight, count)

* fetchTx(hash)

* fetchValidators()

* ~~fetchTxsBySender(senderAddress)~~

* ~~fetchTxsByParcel(parcelId)~~

#### Query methods

You can access `Query` client by `query`
```javascript
const amo = new AMO()
// Query balance of account
amo.query.balance("<ADDRESS>")
```

Query indexed or stored data from AMO Blockchain. 

Return types of query are defined in AMO Blockchain [protocol document](https://github.com/amolabs/docs/blob/master/protocol.md#data-stores)

* config()

* balance(address)

* stake(address)

* delegate(address)

* validator(validatorAddress)

* draft(draftId)

* storage(storageId)

* parcel(parcelId)

* request(buyerAddress, targetParcelId)

* usage(buyerAddress, targetParcelId)

* incBlock(height)

* incAddress(address)

* inc(height, address)

#### Transaction

You can access `Transaction` client by `tx`
```javascript
const amo = new AMO("http://localhost:26657", keypair)
// Send 1000 mote to another account
amo.tx.transfer("<ADDRESS>", "1000")
```


Signing transaction needs [`elliptic`](https://www.npmjs.com/package/elliptic) package.

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

#### Parcel schema
```js
{
    "id": "<HexEncodedParcelId>",
    "custody": Buffer.from("<Custody key>", "hex") // Optional
}
```

* transfer(recipientAddress, amount)

* stake(validatorAddress, amount)

* withdraw(amount)

* delegate(delegateeAddress, amount)

* retract(amount)

* propose(draftId, config[, desc])

* vote(draftId, approve)

* setup(storageId, url, registrationFee, hostingFee)

* close(storageId)

* register(parcel)

* discard(targetParcelId)

* request(payment, targetParcelId)

* cancel(targetParcelId)

* grant(parcel, granteeAddress)

* revoke(parcel, granteeAddress)

* issue(udcId, operatorsAddress, amount[, desc])

* lock(udcId, holderAddress, amount)

* burn(udcId, amount)

### Parcel

##### Parcel(endpoint, keypair)

#### Parcel methods

* uploadParcel(content)

* downloadParcel(parcelId)

* inspectParcel(parcelId)

* removeParcel(parcelId)
