import {AMO} from '../src'

const amo = new AMO("http://15.165.90.80:26657")

const ADDRESS = '0035B04B9F62B8FEAFC3500BC16E31EAF96E8361'
const VALIDATOR_ADDRESS = 'D2DD05650D3F758B0AE4F10DDCFD104DF5C12D12'
const VALID_TX_HASH = 'FDF6FB9B081465F0C57329CC39F29DDE055F9AD00DC3DAFC28398BABF560CC55'

test('test promise', async (done) => {
  const block = await amo.tm.fetchBlock('3')
  expect(block.block.header.height).toBe('3')
  expect(block.block.header.chain_id).toBe('amo-cherryblossom-01')
  done()
})

test('fetchTx', async (done) => {
  const tx = await amo.tm.fetchTx(VALID_TX_HASH)
  expect(tx.hash).toBe(VALID_TX_HASH)
  done()
})

test('fetchValidator', async (done) => {
  const validators = await amo.tm.fetchValidators()
  expect(validators.validators.length).toBeGreaterThanOrEqual(1)
  done()
})

test('queryBalance', async (done) => {
  expect((await amo.query.balance(ADDRESS)).length).toBeGreaterThanOrEqual(1)
  done()
})

test('queryStake', async (done) => {
  expect(await amo.query.stake(ADDRESS)).toBeTruthy()
  done()
})

test('queryValidator', async (done) => {
  const controlAccount = await amo.query.validator(VALIDATOR_ADDRESS)
  expect(controlAccount).toBe(ADDRESS)
  done()
})
