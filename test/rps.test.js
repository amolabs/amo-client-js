import { AmoClient } from '../src/client'

const client = new AmoClient({})

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
