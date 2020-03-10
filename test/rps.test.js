import { AmoClient, url } from '../src/client'

const client = new AmoClient({
  baseURL: url.BC_NODE_AMO_TOKYO
})

function print (o) {
  console.log(JSON.stringify(o, null, 4))
}

const ADDRESS = 'BEFF22606A9FB730455736E7B33C846171F2865C'
const STAKE_ADDRESS = '16CE44DE13ACD260FA3BCE018C53C51150540758'
const VALIDATOR_ADDRESS = '3FC4FD58758FE9AEE1DD061C5753742FD3246057'
const FAIL_ACCOUNT = '0000000000000000000000000000000000000000'
const VALID_TX_HASH = 'e5683994a2498cdbc12c129c8fb31068845952e67964152052dfa1e49dd5bfa9'

test('test promise', async (done) => {
  const block = await client.fetchBlock('3')
  console.log(JSON.stringify(block, null, 4))
  done()
})

test('fetchTx', async (done) => {
  const tx = await client.fetchTx(VALID_TX_HASH)
  console.log(JSON.stringify(tx, null, 4))
  done()
})

test('fetchValidator', async (done) => {
  const validators = await client.fetchValidators()
  console.log(JSON.stringify(validators, null, 4))
  done()
})

test('queryBalance', async (done) => {
  expect(await client.queryBalance(ADDRESS)).not.toBe('0')
  expect(await client.queryBalance(FAIL_ACCOUNT)).toBe('0')
  done()
})

test('fetchTxsByAccount', async (done) => {
  expect((await client.fetchTxsBySender(ADDRESS)).length).not.toBe(0)
  expect((await client.fetchTxsBySender(FAIL_ACCOUNT)).length).toBe(0)
  done()
})

test('queryStake', async (done) => {
  print(await client.queryStake(STAKE_ADDRESS))
  done()
})

test('queryValidator', async (done) => {
  print(await client.queryValidator(VALIDATOR_ADDRESS))
  done()
})

test('queryIncBlock', async (done) => {
  print(await client.queryIncBlock(10000))
  done()
})
