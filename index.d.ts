interface TendermintBlock {
    block_meta: BlockMeta
    block: Block
}

interface Block {
    header: BlockHeader
}

interface BlockMeta {
    block_id: BlockId
    header: BlockHeader
}

interface BlockId {
    hash: string
}

interface BlockHeader {
    chain_id: string
    height: string
    time: string
    num_txs: string
    total_txs: string
    proposer_address: string
}

interface FormattedBlockHeader {
    chain: string,
    hash: string,
    height: string,
    proposer: string,
    numTx: string,
    timestamp: string
}
