const fs = require('fs');

let code = fs.readFileSync('frontend/src/pages/AdminDashboard.jsx', 'utf8');

// Replace everything between "// Requests" and "// Get token" with just one block
code = code.replace(/\/\/ Requests[\s\S]*?\/\/ Get token from localStorage/, 
`// Requests
  const [requests, setRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [requestsError, setRequestsError] = useState(null);

  // Get token from localStorage`);

// Replace duplicated fetchRequests blocks
const fetchReqMatches = code.match(/\/\/ Fetch Requests/g);
if (fetchReqMatches && fetchReqMatches.length > 1) {
    const splitStr = "// Fetch Requests";
    const parts = code.split(splitStr);
    
    // Kept 2 parts - string starts here, then only the last instance
    code = parts[0] + splitStr + parts[parts.length - 1];
}

// Ensure the Requests button is cleanly inserted
const reqBtnMatches = code.match(/👨‍🍳 Requests/g);
if (reqBtnMatches && reqBtnMatches.length > 1) {
   // Replaces the double requests buttons
   code = code.replace(/<button[\s\S]*?👨‍🍳 Requests\n        <\/button>[\s\S]*?<button[\s\S]*?👨‍🍳 Requests\n        <\/button>/g, 
   `<button
          style={{
            ...styles.menuBtn,
            background: activeTab === "requests" ? "#ff7a00" : "transparent",
            position: "relative"
          }}
          onClick={() => setActiveTab("requests")}
        >
          👨‍🍳 Requests
        </button>`);
}

// Ensure the Requests container is cleanly inserted
const reqContMatches = code.match(/\/\* ===== RESTAURANT REQUESTS ===== \*\//g);
if (reqContMatches && reqContMatches.length > 1) {
    // Just replace the double containers entirely
    const splitCont = "{/* ===== RESTAURANT REQUESTS ===== */}";
    const parts = code.split(splitCont);
    code = parts[0] + splitCont + parts[parts.length - 1];
}

fs.writeFileSync('frontend/src/pages/AdminDashboard.jsx', code);
console.log('Fixed');
