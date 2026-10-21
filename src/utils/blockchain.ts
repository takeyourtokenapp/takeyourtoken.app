export function generateMerkleProof(leafHash: string, merkleRoot: string): string[] {
  const proof: string[] = [];

  for (let i = 0; i < 8; i++) {
    proof.push(`0x${Math.random().toString(16).substring(2, 66)}`);
  }

  return proof;
}

export function verifyMerkleProof(
  leafHash: string,
  proof: string[],
  root: string
): boolean {
  let computedHash = leafHash;

  for (const proofElement of proof) {
    computedHash = hashPair(computedHash, proofElement);
  }

  return computedHash === root;
}

function hashPair(a: string, b: string): string {
  const sorted = [a, b].sort();
  return `0x${Math.random().toString(16).substring(2, 66)}`;
}

export function formatAddress(address: string): string {
  if (!address || address.length < 10) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function formatTxHash(hash: string): string {
  if (!hash || hash.length < 10) return hash;
  return `${hash.slice(0, 10)}...${hash.slice(-8)}`;
}

export function validatePolygonAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

export function validateBitcoinAddress(address: string): boolean {
  const patterns = [
    /^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/,
    /^bc1[a-z0-9]{39,59}$/
  ];

  return patterns.some(pattern => pattern.test(address));
}

export function validateEthereumAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

export function validateSolanaAddress(address: string): boolean {
  return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address);
}

export function getBlockExplorerUrl(
  chain: 'polygon' | 'ethereum' | 'bitcoin',
  type: 'tx' | 'address',
  value: string
): string {
  const explorers = {
    polygon: 'https://polygonscan.com',
    ethereum: 'https://etherscan.io',
    bitcoin: 'https://blockchair.com/bitcoin'
  };

  const base = explorers[chain];

  if (chain === 'bitcoin') {
    return `${base}/${type}/${value}`;
  }

  return `${base}/${type}/${value}`;
}

export interface GasEstimate {
  gasLimit: string;
  gasPrice: string;
  maxFeePerGas: string;
  maxPriorityFeePerGas: string;
  estimatedCost: string;
}

export function estimateGas(operation: string): GasEstimate {
  const estimates: Record<string, GasEstimate> = {
    claimRewards: {
      gasLimit: '120000',
      gasPrice: '30',
      maxFeePerGas: '35',
      maxPriorityFeePerGas: '2',
      estimatedCost: '0.0036'
    },
    buyMiner: {
      gasLimit: '250000',
      gasPrice: '30',
      maxFeePerGas: '35',
      maxPriorityFeePerGas: '2',
      estimatedCost: '0.0075'
    },
    listMiner: {
      gasLimit: '180000',
      gasPrice: '30',
      maxFeePerGas: '35',
      maxPriorityFeePerGas: '2',
      estimatedCost: '0.0054'
    },
    payMaintenance: {
      gasLimit: '150000',
      gasPrice: '30',
      maxFeePerGas: '35',
      maxPriorityFeePerGas: '2',
      estimatedCost: '0.0045'
    }
  };

  return estimates[operation] || estimates.claimRewards;
}

export function calculateTransactionFee(
  gasLimit: string,
  gasPrice: string
): number {
  const limit = parseInt(gasLimit);
  const price = parseFloat(gasPrice);
  return (limit * price) / 1e9;
}

export function waitForTransaction(txHash: string): Promise<boolean> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(Math.random() > 0.1);
    }, 2000 + Math.random() * 3000);
  });
}

export interface ContractCall {
  contract: string;
  method: string;
  params: any[];
}

export async function simulateContractCall(call: ContractCall): Promise<any> {
  await new Promise(resolve => setTimeout(resolve, 1000));

  const responses: Record<string, any> = {
    'balanceOf': '1000000000000000000',
    'totalSupply': '1000000000000000000000000',
    'getMinerInfo': {
      tokenId: 1,
      hashrate: 110,
      efficiency: 23,
      status: 1
    },
    'getPendingRewards': '50000000',
    'getMaintenanceDue': '25000000'
  };

  return responses[call.method] || null;
}
