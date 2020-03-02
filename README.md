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
})

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
Check `AmoClient` in index.d.ts
