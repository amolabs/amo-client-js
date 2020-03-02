import { fetchLastBlock, fetchLastBlockPromise } from './rpc'

test('test promise',  async (done) => {
  const block = await fetchLastBlockPromise()
  console.log(JSON.stringify(block))
  done()
})

test('test callback', (done) => {
  fetchLastBlock((block) => {
    console.log(JSON.stringify(block))
    done()
  })
})
