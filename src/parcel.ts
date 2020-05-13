import {ec} from "elliptic"
import {deriveAddress, sha256, sign} from "./utils"
import axios, {AxiosInstance, AxiosRequestConfig} from "axios"

interface ParcelAxiosInstance extends AxiosInstance {
  get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T>
  post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T>
}

type AuthParcelResponse = {
  token: string
}

type UploadParcelResponse = {
  id: string
}

type DownloadParcelResponse = {
  data: object
}

type InspectParcelResponse = {
  metadata: object
}

export default class ParcelStorage {
  private readonly ecKey: ec.KeyPair
  private readonly address: string
  private client: ParcelAxiosInstance

  constructor(endpoint: string, ecKey: ec.KeyPair) {
    this.ecKey = ecKey
    this.address = deriveAddress(ecKey)

    const client = axios.create({
      baseURL: endpoint
    })
    client.interceptors.response.use(({data}) => {
      if ('error' in data) {
        return Promise.reject(data.error)
      }

      return data
    })

    this.client = client
  }

  makeAuthHeaders(token: string) {
    return {
      'X-Auth-Token': token,
      'X-Public-Key': this.ecKey.getPublic('hex'),
      'X-Signature': sign(token, this.ecKey)
    }
  }

  authParcel(operation: object) {
    return this
      .client
      .post<AuthParcelResponse>('/api/v1/auth', {
        user: this.address,
        operation
      })
      .then(({token}) => token)
  }

  uploadParcel(content: Buffer) {
    return this
      .authParcel({
        name: 'upload',
        hash: sha256(content).toString('hex')
      })
      .then((token) => {
        return this
          .client
          .post<UploadParcelResponse>('/api/v1/parcels', {
            owner: this.address,
            metadata: {
              owner: this.address
            },
            data: content.toString('hex')
          }, {
            headers: this.makeAuthHeaders(token)
          })
      })
      .then(({id}) => id)
  }

  downloadParcel(id: string) {
    return this
      .authParcel({
        name: 'download',
        id
      })
      .then((token) => {
        return this
          .client
          .get<DownloadParcelResponse>(`/api/v1/parcels/${id}`, {
            headers: this.makeAuthHeaders(token)
          })
      })
      .then(({data}) => data)
  }

  inspectParcel(id: string) {
    return this
      .client
      .get<InspectParcelResponse>(`/api/v1/parcels/${id}?key=metadata`)
      .then(({metadata}) => metadata)
  }
}
