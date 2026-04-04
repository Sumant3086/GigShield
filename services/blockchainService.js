const { ethers } = require('ethers');

/**
 * Blockchain-Based Claim Transparency
 * Records claim lifecycle on Polygon (low gas fees)
 * Provides immutable audit trail for trust and compliance
 * 
 * Benefits:
 * - Workers can verify claims independently
 * - Regulators can audit without accessing private data
 * - Prevents claim tampering
 * - Builds trust in the system
 */

// Connect to Polygon Mumbai testnet (or mainnet in production)
const provider = process.env.POLYGON_RPC_URL
  ? new ethers.JsonRpcProvider(process.env.POLYGON_RPC_URL)
  : null;

const wallet = process.env.BLOCKCHAIN_PRIVATE_KEY && provider
  ? new ethers.Wallet(process.env.BLOCKCHAIN_PRIVATE_KEY, provider)
  : null;

// Simple claim registry contract ABI
const CLAIM_REGISTRY_ABI = [
  "function recordClaim(bytes32 claimHash, uint256 amount, uint8 status) external",
  "function getClaim(bytes32 claimHash) external view returns (uint256 amount, uint8 status, uint256 timestamp)",
  "event ClaimRecorded(bytes32 indexed claimHash, uint256 amount, uint8 status, uint256 timestamp)"
];

const CLAIM_REGISTRY_ADDRESS = process.env.CLAIM_REGISTRY_CONTRACT || '0x0000000000000000000000000000000000000000';

/**
 * Record claim on blockchain
 * Status: 0=pending, 1=approved, 2=paid, 3=rejected
 */
async function recordClaimOnChain(claim) {
  if (!wallet) {
    console.log('[Blockchain] Demo mode - would record claim:', claim._id);
    return {
      success: true,
      demo: true,
      txHash: `0xdemo${claim._id.toString().slice(0, 8)}`,
      explorerUrl: `https://mumbai.polygonscan.com/tx/0xdemo${claim._id.toString().slice(0, 8)}`
    };
  }

  try {
    const contract = new ethers.Contract(CLAIM_REGISTRY_ADDRESS, CLAIM_REGISTRY_ABI, wallet);
    
    // Create deterministic hash from claim ID
    const claimHash = ethers.keccak256(ethers.toUtf8Bytes(claim._id.toString()));
    
    // Map status to uint8
    const statusMap = {
      pending: 0,
      auto_approved: 1,
      approved: 1,
      paid: 2,
      rejected: 3,
      soft_hold: 0,
      human_review: 0,
    };
    const status = statusMap[claim.status] || 0;

    // Send transaction
    const tx = await contract.recordClaim(
      claimHash,
      ethers.parseUnits(claim.payoutAmount.toString(), 0), // Amount in wei (or smallest unit)
      status
    );

    const receipt = await tx.wait();
    
    return {
      success: true,
      txHash: receipt.hash,
      blockNumber: receipt.blockNumber,
      explorerUrl: `https://mumbai.polygonscan.com/tx/${receipt.hash}`,
      gasUsed: receipt.gasUsed.toString(),
    };
  } catch (error) {
    console.error('[Blockchain] Error:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Verify claim on blockchain
 */
async function verifyClaimOnChain(claimId) {
  if (!provider) {
    return { success: true, demo: true, verified: true };
  }

  try {
    const contract = new ethers.Contract(CLAIM_REGISTRY_ADDRESS, CLAIM_REGISTRY_ABI, provider);
    const claimHash = ethers.keccak256(ethers.toUtf8Bytes(claimId.toString()));
    
    const [amount, status, timestamp] = await contract.getClaim(claimHash);
    
    return {
      success: true,
      verified: timestamp > 0,
      amount: amount.toString(),
      status: status,
      timestamp: new Date(Number(timestamp) * 1000).toISOString(),
    };
  } catch (error) {
    console.error('[Blockchain] Verification error:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Generate QR code for blockchain verification
 * Workers can scan to verify their claim independently
 */
function generateVerificationQR(claim, txHash) {
  const verificationUrl = `${process.env.CLIENT_URL}/verify/${claim._id}?tx=${txHash}`;
  return {
    url: verificationUrl,
    explorerUrl: `https://mumbai.polygonscan.com/tx/${txHash}`,
    claimId: claim._id,
  };
}

module.exports = {
  recordClaimOnChain,
  verifyClaimOnChain,
  generateVerificationQR,
};
