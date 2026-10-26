import dotenv from "dotenv";

dotenv.config({ path: ".env" });
const localDb = "postgresql://campus:campus@localhost:5432/campus_reputation";
process.env.DATABASE_URL ??= localDb;
process.env.DIRECT_URL ??= localDb;
process.env.SEPOLIA_RPC_URL ??= "https://ethereum-sepolia-rpc.publicnode.com";
process.env.JWT_SECRET ??= "test-jwt-secret-min-16-chars";
process.env.CAMP_TOKEN_ADDRESS ??= "0xF2c2bC22de5df5e95F5bB27b65E53b569E83d918";
process.env.BADGE_CONTRACT_ADDRESS ??= "0x515677D8B9fe03998173032d7be9a0e7Ee78429c";
