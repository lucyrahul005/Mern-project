const fs = require('fs');

let code = fs.readFileSync('frontend/src/pages/AdminDashboard.jsx', 'utf8');

// Also trigger fetchRequests on mount to get the badge count
const effectPattern = /if \(activeTab === "dashboard"\) {/;
const newEffect = `// Always fetch requests to show notification badge
    fetchRequests();
    
    if (activeTab === "dashboard") {`;
code = code.replace(effectPattern, newEffect);

// Add the UI badge to the button
const btnPattern = /👨‍🍳 Requests\n        <\/button>/;
const newBtn = `👨‍🍳 Requests
          {requests.filter(r => r.adminStatus === 'Pending').length > 0 && (
            <span style={{
              position: "absolute",
              top: "-5px",
              right: "-5px",
              background: "red",
              color: "white",
              borderRadius: "50%",
              padding: "2px 6px",
              fontSize: "12px",
              fontWeight: "bold"
            }}>
              {requests.filter(r => r.adminStatus === 'Pending').length}
            </span>
          )}
        </button>`;
code = code.replace(btnPattern, newBtn);

fs.writeFileSync('frontend/src/pages/AdminDashboard.jsx', code);
console.log("Badge added!");
