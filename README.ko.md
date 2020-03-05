# amo-client-js
AMO client를 위한 javascript library. 이 문서는 [영문](README.md)로도 있음.

## 소개
AMO Labs에서는 reference implementation 형태로 클라이언트용 library를
제공한다. 이 라이브러리, 혹은 패키지는 [AMO client RPC
specification](https://github.com/amolabs/docs/blob/master/rpc.md)를 기준으로
HTTP(S)를 통해 AMO 블록체인 노드와 통신한다.

## 사용법

### 설치
`npm install amo-client` or `yarn add amo-client`

### 예시
```javascript
import { AMOClient } from 'amo-client'

// Create client
const client = new AMOClient({
  baseURL: '<AMO node rpc endpoint>' // by default: url.BC_NODE_AMO_TOKYO 
  // ... extra config from AxiosRequestConfig
}, {
  baseURL: '<AMO Storage url>'
  // ... extra config from AxiosRequestConfig
}, 'ws://...')

(async () => {
  const lastBlock = await client.fetchLastBlock()
  console.log(JSON.stringify(lastBlock, null, 4))
})()
```

## 원격 서버
모든 AMO 클라이언트는 서버-클라이언트 구조에서 동작하기 때문에 사용자 요청을
처리하기 위해서는 원격 서버 주소가 필요하다. 이를 AMO 블록체인 RPC 노드라 한다.

**AMO 블록체인 RPC 노드는** AMO 블록체인 네트웍에 연결되어 있으며 RPC 서비스를
제공하는 임의의 AMO 블록체인 노드를 말한다. 공개된 노드 중 아무것에나 연결할
수도 있으며 실행하려는 클라이언트를 위한 전용 노드를 직접 운영하는 것도
가능하다. RPC 노드의 주소는 IP 주소와 포트번호로 구성된다. 디폴트 포트 번호는
26657이다. 이 포트 번호가 방화벽에 의해 차단되지 않는지도 확인한다.

TBA: AMO Labs에서 제공하는 공개된 RPC 노드 주소 추가

## 사용자 키
**NOTE:** 이 부분은 이 라이브러리를 오로지 읽기 전용 작업에만 사용할 때는 상관
없다. 하지만 웹 기반의 지갑 프로그램이나 그와 유사하게 사용자 키로 서명된
거래를 전송하려는 목적으로 사용할 때는 시드와 키를 주의깊게 관리해야 한다.

이 클라이언트 라이브러리 혹은 패키지는 사용자 비밀키를 로컬 디스크나 영구 메모리 같은 형태의 장소에 저장하고 관리하는 방법을 따로 제공하지는 않는다. 이 라이브러리 혹은 패키지는 사용자 키를 다루는 방법으로 다음의 3가지를 제공한다:
* 사용자가 입력한 시드 바이트열로부터 비밀키와 공개키 쌍을 생성
* 사용자가 입력한 비밀키 바이트열로부터 공개키를 생성
* 따로 생성하는 키 없이 사용자가 입력한 공개키를 그대로 사용

일기 전용인 조회 기능만 사용하는 경우는 세번째 옵션에 해당한다.

## API
`index.d.ts`의 `AmoClient` 참고
