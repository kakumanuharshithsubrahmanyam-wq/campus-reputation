export const CAMPUS_TOKEN_ADDRESS = "0xF2c2bC22de5df5e95F5bB27b65E53b569E83d918";
export const CAMPUS_BADGE_ADDRESS = "0x515677D8B9fe03998173032d7be9a0e7Ee78429c";

// Optional seed addresses for the leaderboard (add wallet addresses here)
export const STUDENTS = [];

export const BRONZE_IPFS_URI = "https://indigo-urgent-clownfish-64.mypinata.cloud/ipfs/bafybeihypq4lpkd2wzk274agtgmy2sqaofpunwa52o3fpsj4ekh3kkljaa";
export const SILVER_IPFS_URI = "https://indigo-urgent-clownfish-64.mypinata.cloud/ipfs/bafybeiept2iwjzu3tplsjmphodibhtzngkynugo46tvdvwlqmjtozavg6uD";
export const GOLD_IPFS_URI   = "https://indigo-urgent-clownfish-64.mypinata.cloud/ipfs/bafybeihk4xney5t5epgofsez3w6sn5rzvwrnfdtgvxjaeqm3mpmmhgdaua";

export const TOKEN_ABI = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function totalSupply() view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function balanceOf(address) view returns (uint256)",
  "function transfer(address to, uint256 value) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function approve(address spender, uint256 value) returns (bool)",
  "function transferFrom(address from, address to, uint256 value) returns (bool)",
  "function owner() view returns (address)",
  "function authorizedTeachers(address) view returns (bool)",
  "function lastActiveTime(address) view returns (uint256)",
  "function studentNames(address) view returns (string)",
  "function decayInterval() view returns (uint256)",
  "function decayAmount() view returns (uint256)",
  "function proposalCount() view returns (uint256)",
  "function proposals(uint256) view returns (uint256 id, address student, uint256 amount, string reason, address proposer, uint256 approvalCount, bool executed)",
  "function hasApproved(uint256, address) view returns (bool)",
  "function addTeacher(address teacher)",
  "function registerStudent(string name)",
  "function awardTokens(address student, uint256 amount, string reason)",
  "function proposeAward(address student, uint256 amount, string reason)",
  "function approveAward(uint256 proposalId)",
  "function applyDecay(address student)",
  "function getReputationLevel(address student) view returns (string)",
  "event TokensAwarded(address indexed student, uint256 amount, string reason)",
  "event TokensDecayed(address indexed student, uint256 amount)",
  "event TeacherAdded(address indexed teacher)",
  "event StudentRegistered(address indexed student, string name)",
  "event AwardProposed(uint256 indexed proposalId, address indexed student, uint256 amount, string reason, address indexed proposer)",
  "event AwardApproved(uint256 indexed proposalId, address indexed approver, uint256 approvalCount)"
];

export const BADGE_ABI = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function balanceOf(address owner) view returns (uint256)",
  "function ownerOf(uint256 tokenId) view returns (address)",
  "function tokenURI(uint256 tokenId) view returns (string)",
  "function tokenCounter() view returns (uint256)",
  "function campusToken() view returns (address)",
  "function BRONZE_THRESHOLD() view returns (uint256)",
  "function SILVER_THRESHOLD() view returns (uint256)",
  "function GOLD_THRESHOLD() view returns (uint256)",
  "function hasBadge(address, string) view returns (bool)",
  "function studentBadges(address, uint256) view returns (uint256)",
  "function getStudentBadges(address student) view returns (uint256[])",
  "function claimBadge(string badgeType, string ipfsURI)",
  "function approve(address to, uint256 tokenId)",
  "function transferFrom(address from, address to, uint256 tokenId)",
  "event BadgeMinted(address indexed student, string badgeType, uint256 tokenId)"
];