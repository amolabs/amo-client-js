import {createHash} from "crypto"
import {ec} from "elliptic"

export const sha256 = (d: string | Buffer) => createHash('sha256').update(d).digest()

export const sign = (d: string, ecKey: ec.KeyPair) => {
  const signature = ecKey.sign(sha256(d))

  const r = ('0000' + signature.r.toString('hex')).slice(-64)
  const s = ('0000' + signature.s.toString('hex')).slice(-64)

  return r + s
}

export const deriveAddress = (ecKey: ec.KeyPair) => {
  return createHash('sha256')
    .update(Buffer.from(ecKey.getPublic('array')))
    .digest('hex')
    .slice(0, 40)
    .toUpperCase()
}
