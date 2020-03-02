import { AmoClient } from '../src/client'

const client = new AmoClient({})

test('test promise',  async (done) => {
  const block = await client.fetchBlock('3')
  console.log(JSON.stringify(block, null, 4))
  done()
})
