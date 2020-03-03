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

test('test promise', async (done) => {
  const block = await client.fetchBlock('3')
  console.log(JSON.stringify(block, null, 4))
  done()
})

test('fetchTx', async (done) => {
  const tx = await client.fetchTx('25dc02a390222fe0c7aa018ee4b1e6511b4be3c6c1506d9a62e9eb7f4ae1438f')
  console.log(JSON.stringify(tx, null, 4))
  done()
})

test('fetchValidator', async (done) => {
  const validators = await client.fetchValidators()
  console.log(JSON.stringify(validators, null, 4))
  done()
})

test('fetchBalance', async (done) => {
  expect(await client.fetchBalance(ADDRESS)).not.toBe('0')
  expect(await client.fetchBalance(FAIL_ACCOUNT)).toBe('0')
  done()
})

test('fetchTxsByAccount', async (done) => {
  expect((await client.fetchTxsByAccount(ADDRESS)).length).not.toBe(0)
  expect((await client.fetchTxsByAccount(FAIL_ACCOUNT)).length).toBe(0)
  done()
})

test('fetchStake', async (done) => {
  print(await client.fetchStake(STAKE_ADDRESS))
  done()
})

test('fetchStakeHolder', async (done) => {
  print(await client.fetchStakeHolder(VALIDATOR_ADDRESS))
  done()
})
