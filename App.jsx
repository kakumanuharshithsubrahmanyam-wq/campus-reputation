import { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import { CAMPUS_TOKEN_ADDRESS, CAMPUS_BADGE_ADDRESS, TOKEN_ABI, BADGE_ABI } from "./config";
import { fetchStudentsWithBalances } from "./campTokens";
import ConnectWallet from "./ConnectWallet";
import Navbar from "./Navbar";
import StudentDashboard from "./StudentDashboard";
import StudentProfile from "./src/components/StudentProfile";
import TeacherDashboard from "./TeacherDashboard";
import Leaderboard from "./Leaderboard";
import ActivityFeed from "./src/components/ActivityFeed";

export default function App() {
  const [account, setAccount] = useState(null);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [tokenContract, setTokenContract] = useState(null);
  const [badgeContract, setBadgeContract] = useState(null);
  const [isTeacher, setIsTeacher] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [activeTab, setActiveTab] = useState("student");
  const [registeredStudents, setRegisteredStudents] = useState([]);

  const loadRegisteredStudents = useCallback(async (contractOverride) => {
    const token = contractOverride || tokenContract;
    if (!token) return;

    try {
      const students = await fetchStudentsWithBalances(token);
      setRegisteredStudents(students);
    } catch (e) {
      console.error("Failed to load registered students", e);
      setRegisteredStudents([]);
    }
  }, [tokenContract]);

  const connectWallet = async () => {
    if (!window.ethereum) return alert("Please install MetaMask");
    try {
      const _provider = new ethers.BrowserProvider(window.ethereum);
      const _signer = await _provider.getSigner();
      const _account = await _signer.getAddress();
      const _token = new ethers.Contract(CAMPUS_TOKEN_ADDRESS, TOKEN_ABI, _signer);
      const _badge = new ethers.Contract(CAMPUS_BADGE_ADDRESS, BADGE_ABI, _signer);
      const _isTeacher = await _token.authorizedTeachers(_account);
      const owner = await _token.owner();
      setProvider(_provider);
      setSigner(_signer);
      setAccount(_account);
      setTokenContract(_token);
      setBadgeContract(_badge);
      setIsTeacher(_isTeacher);
      setIsOwner(owner.toLowerCase() === _account.toLowerCase());
      await loadRegisteredStudents(_token);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (!tokenContract) return;

    const refresh = () => loadRegisteredStudents();
    tokenContract.on(tokenContract.filters.TokensAwarded(), refresh);
    tokenContract.on(tokenContract.filters.TokensDecayed(), refresh);

    return () => {
      tokenContract.off(tokenContract.filters.TokensAwarded(), refresh);
      tokenContract.off(tokenContract.filters.TokensDecayed(), refresh);
    };
  }, [tokenContract, loadRegisteredStudents]);

  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.on("accountsChanged", () => window.location.reload());
    }
  }, []);

  if (!account) return <ConnectWallet connect={connectWallet} />;

  return (
    <div className="app-shell">
      <Navbar account={account} isTeacher={isTeacher} activeTab={activeTab} setActiveTab={setActiveTab} />
      <main className="main-content">
        {activeTab === "student" && (
          <StudentDashboard account={account} tokenContract={tokenContract} badgeContract={badgeContract} />
        )}
        {activeTab === "profile" && (
          <StudentProfile account={account} tokenContract={tokenContract} badgeContract={badgeContract} />
        )}
        {activeTab === "teacher" && isTeacher && (
          <TeacherDashboard
            tokenContract={tokenContract}
            isOwner={isOwner}
            registeredStudents={registeredStudents}
          />
        )}
        {activeTab === "leaderboard" && (
          <Leaderboard
            currentAccount={account}
            tokenContract={tokenContract}
          />
        )}
        {activeTab === "activity" && (
          <ActivityFeed tokenContract={tokenContract} provider={provider} />
        )}
      </main>
    </div>
  );
}
