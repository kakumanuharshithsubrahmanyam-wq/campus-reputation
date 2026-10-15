import { ethers } from "ethers";

// balanceOf always returns wei — convert with formatEther only.
export function weiToCamp(weiValue) {
  if (weiValue == null) return 0;
  try {
    return Math.floor(parseFloat(ethers.formatEther(weiValue)));
  } catch {
    return 0;
  }
}

// Proposal / event amounts are the raw number the teacher typed.
export function rawAmount(value) {
  if (value == null) return 0;
  try {
    return Math.floor(Number(ethers.getBigInt(value)));
  } catch {
    const num = Number(value);
    return Number.isFinite(num) ? Math.floor(num) : 0;
  }
}

export async function fetchStudentsWithBalances(token) {
  const registeredEvents = await token.queryFilter(
    token.filters.StudentRegistered()
  );
  const awardedEvents = await token.queryFilter(
    token.filters.TokensAwarded()
  );

  const addressSet = new Set();
  for (const event of registeredEvents) {
    addressSet.add(ethers.getAddress(event.args.student));
  }
  for (const event of awardedEvents) {
    addressSet.add(ethers.getAddress(event.args.student));
  }

  const results = await Promise.all(
    Array.from(addressSet).map(async (addr) => {
      const bal = await token.balanceOf(addr);
      const balance = weiToCamp(bal);
      const level = await token.getReputationLevel(addr);
      const name = await token.studentNames(addr);
      return {
        addr,
        balance,
        level,
        name: name || "",
      };
    })
  );

  return results
    .filter((s) => s.balance > 0)
    .sort((a, b) => b.balance - a.balance);
}
