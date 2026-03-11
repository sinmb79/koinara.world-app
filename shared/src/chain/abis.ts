export const registryAbi = [
  "function totalJobs() view returns (uint256)",
  "function createJob(bytes32 requestHash, bytes32 schemaHash, uint64 deadline, uint8 jobType) payable returns (uint256)",
  "function getJob(uint256 jobId) view returns ((uint256 jobId,address creator,bytes32 requestHash,bytes32 schemaHash,uint64 deadline,uint8 jobType,uint256 premiumReward,uint8 state))",
  "function getSubmission(uint256 jobId) view returns ((address provider,bytes32 responseHash,uint64 submittedAt,bool exists))",
  "function claimPremiumRefund(uint256 jobId) returns (uint256)",
  "function markExpired(uint256 jobId)",
  "event JobCreated(uint256 indexed jobId,address indexed creator,bytes32 indexed requestHash,bytes32 schemaHash,uint64 deadline,uint8 jobType,uint256 premiumReward)",
  "event JobStateTransition(uint256 indexed jobId,uint8 previousState,uint8 newState)",
  "event ResponseSubmitted(uint256 indexed jobId,address indexed provider,bytes32 responseHash,uint64 submittedAt)",
  "event PremiumReleased(uint256 indexed jobId,address indexed provider,uint256 amount)",
  "event PremiumRefunded(uint256 indexed jobId,address indexed creator,uint256 amount)"
] as const;

export const verifierAbi = [
  "function getRecord(uint256 jobId) view returns ((address provider,bytes32 responseHash,uint64 submittedAt,uint256 approvals,uint256 quorum,bool validJob,bool withinDeadline,bool formatPass,bool nonEmptyResponse,bool verificationPass,bool rejected,bool finalized,bytes32 poiHash))",
  "function getApprovedVerifiers(uint256 jobId) view returns (address[])",
  "event SubmissionRegistered(uint256 indexed jobId,address indexed provider,bytes32 responseHash,uint256 quorum)",
  "event SubmissionVerified(uint256 indexed jobId,address indexed verifier,uint256 approvals,uint256 quorum)",
  "event SubmissionRejected(uint256 indexed jobId,address indexed verifier,string reason)",
  "event PoIFinalized(uint256 indexed jobId,bytes32 indexed poiHash,address indexed provider,uint256 approvals)"
] as const;

export const rewardDistributorAbi = [
  "function rewardsDistributed(uint256 jobId) view returns (bool)",
  "event RewardsDistributed(uint256 indexed jobId,address indexed provider,uint256 providerReward,uint256 verifierRewardTotal,uint256 premiumReward)"
] as const;

export const tokenAbi = [
  "function balanceOf(address owner) view returns (uint256)",
  "function decimals() view returns (uint8)"
] as const;
