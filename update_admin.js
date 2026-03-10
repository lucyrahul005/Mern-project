const fs = require('fs');

let content = fs.readFileSync('frontend/src/pages/AdminDashboard.jsx', 'utf8');

// 1. Add state
const statePattern = /const \[usersError, setUsersError\] = useState\(null\);/;
const appendState = `const [usersError, setUsersError] = useState\(null\);\n\n  // Requests\n  const [requests, setRequests] = useState([]);\n  const [loadingRequests, setLoadingRequests] = useState(false);\n  const [requestsError, setRequestsError] = useState(null);`;
content = content.replace(statePattern, appendState);

// 2. Add API calls
const callsPattern = /\/\/ Block\/Unblock User[\s\S]*?};/;
const appendCalls = `// Block/Unblock User
  const handleBlockUser = async (userId) => {
    try {
      const res = await axios.put(
        \`\${API_URL}/api/admin/users/\${userId}/block\`,
        {},
        { headers: { Authorization: \`Bearer \${token}\` } }
      );
      console.log("✅ User blocked/unblocked:", res.data);
      fetchUsers();
    } catch (err) {
      console.error("❌ Error blocking user:", err.response?.data);
    }
  };

  // Fetch Requests
  const fetchRequests = async () => {
    try {
      setLoadingRequests(true);
      setRequestsError(null);
      const res = await axios.get(\`\${API_URL}/api/admin/restaurant-requests\`, {
        headers: { Authorization: \`Bearer \${token}\` },
      });
      setRequests(res.data.requests || []);
    } catch (err) {
      console.error("❌ Error fetching requests:", err.response?.data || err.message);
      setRequestsError(err.response?.data?.message || err.message || "Failed to load requests");
      setRequests([]);
    } finally {
      setLoadingRequests(false);
    }
  };

  // Approve Request
  const handleApproveRequest = async (userId) => {
    try {
      await axios.put(
        \`\${API_URL}/api/admin/restaurant-requests/\${userId}/approve\`,
        {},
        { headers: { Authorization: \`Bearer \${token}\` } }
      );
      alert("✅ Restaurant Admin Approved!");
      fetchRequests();
    } catch (err) {
      alert("❌ Error: " + (err.response?.data?.message || err.message));
    }
  };

  // Reject Request
  const handleRejectRequest = async (userId) => {
    try {
      await axios.put(
        \`\${API_URL}/api/admin/restaurant-requests/\${userId}/reject\`,
        {},
        { headers: { Authorization: \`Bearer \${token}\` } }
      );
      alert("✅ Restaurant Admin Rejected!");
      fetchRequests();
    } catch (err) {
      alert("❌ Error: " + (err.response?.data?.message || err.message));
    }
  };`;

content = content.replace(callsPattern, appendCalls);

// 3. Add to useEffect
const effectPattern = /} else if \(activeTab === "users"\) \{\n      fetchUsers\(\);\n    }/;
const appendEffect = `} else if (activeTab === "users") {\n      fetchUsers();\n    } else if (activeTab === "requests") {\n      fetchRequests();\n    }`;
content = content.replace(effectPattern, appendEffect);

// 4. Add Sidebar Button
const menuPattern = /<button[\s\S]*?setActiveTab\("users"\)[\s\S]*?👥 Users\n        <\/button>/;
const appendSidebar = `<button
          style={{
            ...styles.menuBtn,
            background: activeTab === "users" ? "#ff7a00" : "transparent",
          }}
          onClick={() => setActiveTab("users")}
        >
          👥 Users
        </button>

        <button
          style={{
            ...styles.menuBtn,
            background: activeTab === "requests" ? "#ff7a00" : "transparent",
            position: "relative"
          }}
          onClick={() => setActiveTab("requests")}
        >
          👨‍🍳 Requests
        </button>`;
content = content.replace(menuPattern, appendSidebar);

// 5. Add Main Section
const mainPattern = /{\/\* ===== USERS MANAGEMENT ===== \*\/}/;
const appendMain = `{/* ===== RESTAURANT REQUESTS ===== */}
        {activeTab === "requests" && (
          <div style={styles.container}>
            <h1 style={styles.header}>👨‍🍳 Restaurant Requests</h1>

            {loadingRequests ? (
              <p>Loading...</p>
            ) : requestsError ? (
              <div style={styles.errorBox}>
                <h3>❌ Error Loading Requests</h3>
                <p>{requestsError}</p>
              </div>
            ) : (
              <div style={styles.usersTable}>
                {requests.length > 0 ? (
                  requests.map((r) => (
                    <div key={r._id} style={styles.userCard}>
                      <div>
                        <h4>{r.name}</h4>
                        <p>{r.email}</p>
                        <p>Status: 
                          <span style={{ 
                            color: r.adminStatus === 'Approved' ? '#4CAF50' : 
                                   r.adminStatus === 'Rejected' ? '#f44336' : '#FF9800',
                            fontWeight: 'bold',
                            marginLeft: '5px'
                          }}>
                            {r.adminStatus}
                          </span>
                        </p>
                      </div>
                      {r.adminStatus === 'Pending' && (
                        <div style={{ display: 'flex', gap: '10px' }}>
                          <button
                            style={{ ...styles.blockBtn, background: "#4CAF50" }}
                            onClick={() => handleApproveRequest(r._id)}
                          >
                            Approve
                          </button>
                          <button
                            style={{ ...styles.blockBtn, background: "#f44336" }}
                            onClick={() => handleRejectRequest(r._id)}
                          >
                            Reject
                          </button>
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <p>No restaurant requests found</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* ===== USERS MANAGEMENT ===== */}`;
content = content.replace(mainPattern, appendMain);

fs.writeFileSync('frontend/src/pages/AdminDashboard.jsx', content);
console.log('Done!');
