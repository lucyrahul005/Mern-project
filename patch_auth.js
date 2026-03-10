const fs = require('fs');
const content = fs.readFileSync('routes/authRoutes.js', 'utf8');
const replaced = content.replace('isAdmin: true', 'isAdmin: false,\n      isRestaurantAdmin: true,\n      adminStatus: "Pending"').replace('isActive: true', 'isActive: false');
fs.writeFileSync('routes/authRoutes.js', replaced);
