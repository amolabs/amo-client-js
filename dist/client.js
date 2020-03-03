"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.AmoClient = exports.url = void 0;

var _axios = _interopRequireDefault(require("axios"));

var _crypto = require("crypto");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

const url = {
  BC_NODE_AMO_TOKYO: '139.162.116.176:26657'
};
exports.url = url;

function formatBlockHeader(blk) {
  return {
    chain: blk.header.chain_id,
    hash: blk.block_id.hash,
    height: blk.header.height,
    proposer: blk.header.proposer_address,
    numTx: blk.header.num_txs,
    timestamp: blk.header.time
  };
}

function formatBlock(blk) {
  return _objectSpread({}, formatBlockHeader(blk.block_meta), {
    txs: blk.block.data.txs.map(tx => {
      const decoded = Buffer.from(tx, 'base64');
      const hash = (0, _crypto.createHash)('sha256').update(decoded).digest().toString('hex');
      return _objectSpread({}, JSON.parse(decoded.toString()), {
        hash
      });
    })
  });
}

class AmoClient {
  constructor(config) {
    _defineProperty(this, "_client", void 0);

    if (!config) {
      config = {
        baseURL: `http://${url.BC_NODE_AMO_TOKYO}`
      };
    }

    if (!config.baseURL) {
      config.baseURL = `http://${url.BC_NODE_AMO_TOKYO}`;
    }

    this._client = _axios.default.create(config);
  }

  fetchLastBlock() {
    return this._client.get('/block').then(({
      data: {
        result
      }
    }) => {
      return formatBlockHeader(result.block_meta);
    });
  }

  fetchBlock(height) {
    return this._client.get(`/block?height=${height}`).then(({
      data
    }) => {
      if ('error' in data) {
        return Promise.reject(data);
      }

      return formatBlock(data.result);
    });
  }

  fetchBlockHeaders(maxHeight, count) {
    const minHeight = Math.max(1, maxHeight - count + 1);
    return this._client.get(`/blockchain?maxHeight=${maxHeight}&minHeight=${minHeight}`).then(({
      data: {
        result
      }
    }) => {
      return result.block_metas.map(formatBlockHeader);
    });
  }

  fetchRecentBlockHeaders() {
    return this._client.get('/blockchain').then(({
      data: {
        result
      }
    }) => {
      return result.block_metas.map(formatBlockHeader);
    });
  }

  fetchTx(hash) {
    hash = hash.startsWith('0x') ? hash : `0x${hash}`;
    return this._client.get(`/tx?hash=${hash}`).then(({
      data
    }) => {
      if ('error' in data) {
        return Promise.reject(data);
      }

      return JSON.parse(Buffer.from(data.result.tx, 'base64').toString());
    });
  }

  fetchValidators() {
    return this._client.get('/validators').then(({
      data: {
        result
      }
    }) => {
      return result.validators;
    });
  }

}

exports.AmoClient = AmoClient;