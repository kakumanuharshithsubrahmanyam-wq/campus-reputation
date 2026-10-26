/** ABIs mirrored from frontend config.js — Sepolia deployed contracts */
export const TOKEN_ABI = [
  "function balanceOf(address) view returns (uint256)",
  "function owner() view returns (address)",
  "function authorizedTeachers(address) view returns (bool)",
  "function studentNames(address) view returns (string)",
  "function proposalCount() view returns (uint256)",
  "function proposals(uint256) view returns (uint256 id, address student, uint256 amount, string reason, address proposer, uint256 approvalCount, bool executed)",
  "function getReputationLevel(address student) view returns (string)",
  "event TokensAwarded(address indexed student, uint256 amount, string reason)",
  "event TokensDecayed(address indexed student, uint256 amount)",
  "event TeacherAdded(address indexed teacher)",
  "event StudentRegistered(address indexed student, string name)",
  "event AwardProposed(uint256 indexed proposalId, address indexed student, uint256 amount, string reason, address indexed proposer)",
  "event AwardApproved(uint256 indexed proposalId, address indexed approver, uint256 approvalCount)",
] as const;

export const BADGE_ABI = [
  "function hasBadge(address, string) view returns (bool)",
  "function BRONZE_THRESHOLD() view returns (uint256)",
  "function SILVER_THRESHOLD() view returns (uint256)",
  "function GOLD_THRESHOLD() view returns (uint256)",
  "event BadgeMinted(address indexed student, string badgeType, uint256 tokenId)",
] as const;

export const BADGE_TYPES = ["BRONZE", "SILVER", "GOLD"] as const;
