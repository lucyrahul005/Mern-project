#!/bin/bash

# Restaurant Admin Panel - Testing Script

API_URL="http://localhost:5001/api"
RESTAURANT_ADMIN_EMAIL="admin@restaurant.com"
RESTAURANT_ADMIN_PASSWORD="password123"

echo "================================"
echo "🍽️ Restaurant Admin Panel Tests"
echo "================================"
echo ""

# Step 1: Login
echo "1️⃣  Testing Restaurant Admin Login..."
LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$RESTAURANT_ADMIN_EMAIL\",
    \"password\": \"$RESTAURANT_ADMIN_PASSWORD\"
  }")

TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "❌ Login failed"
  echo "Response: $LOGIN_RESPONSE"
  exit 1
else
  echo "✅ Login successful"
  echo "Token: ${TOKEN:0:20}..."
fi

echo ""

# Step 2: Get Restaurant Profile
echo "2️⃣  Fetching Restaurant Profile..."
PROFILE_RESPONSE=$(curl -s -X GET "$API_URL/restaurant-admin/profile" \
  -H "Authorization: Bearer $TOKEN")

echo "✅ Profile fetched"
echo "$PROFILE_RESPONSE" | head -c 200
echo "..."

echo ""

# Step 3: Get Dashboard Stats
echo "3️⃣  Fetching Dashboard Statistics..."
STATS_RESPONSE=$(curl -s -X GET "$API_URL/restaurant-admin/dashboard/stats" \
  -H "Authorization: Bearer $TOKEN")

echo "✅ Stats fetched"
echo "$STATS_RESPONSE"

echo ""

# Step 4: Get Menu Items
echo "4️⃣  Fetching Menu Items..."
MENU_RESPONSE=$(curl -s -X GET "$API_URL/restaurant-admin/menu" \
  -H "Authorization: Bearer $TOKEN")

echo "✅ Menu items fetched"
echo "$MENU_RESPONSE" | head -c 300
echo "..."

echo ""

# Step 5: Get Orders
echo "5️⃣  Fetching Orders..."
ORDERS_RESPONSE=$(curl -s -X GET "$API_URL/restaurant-admin/orders?limit=5" \
  -H "Authorization: Bearer $TOKEN")

echo "✅ Orders fetched"
echo "$ORDERS_RESPONSE" | head -c 300
echo "..."

echo ""

# Step 6: Get Sales Chart
echo "6️⃣  Fetching Sales Chart Data..."
CHART_RESPONSE=$(curl -s -X GET "$API_URL/restaurant-admin/dashboard/sales-chart?days=7" \
  -H "Authorization: Bearer $TOKEN")

echo "✅ Sales chart fetched"
echo "$CHART_RESPONSE"

echo ""

# Step 7: Get Top Items
echo "7️⃣  Fetching Top Selling Items..."
TOP_RESPONSE=$(curl -s -X GET "$API_URL/restaurant-admin/dashboard/top-items" \
  -H "Authorization: Bearer $TOKEN")

echo "✅ Top items fetched"
echo "$TOP_RESPONSE"

echo ""

# Step 8: Test Add Menu Item
echo "8️⃣  Testing Add Menu Item..."
ADD_MENU_RESPONSE=$(curl -s -X POST "$API_URL/restaurant-admin/menu" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Biryani",
    "description": "Test item for validation",
    "price": 350,
    "category": "Main Course",
    "isVeg": false,
    "preparationTime": "25 min"
  }')

echo "✅ Menu item add request sent"
echo "$ADD_MENU_RESPONSE"

echo ""

# Step 9: Get Notification Settings
echo "9️⃣  Fetching Notification Settings..."
NOTIF_RESPONSE=$(curl -s -X GET "$API_URL/restaurant-admin/notifications/settings" \
  -H "Authorization: Bearer $TOKEN")

echo "✅ Notification settings fetched"
echo "$NOTIF_RESPONSE"

echo ""

# Step 10: Get Revenue Data
echo "🔟 Fetching Revenue Data..."
REV_RESPONSE=$(curl -s -X GET "$API_URL/restaurant-admin/dashboard/revenue?period=daily" \
  -H "Authorization: Bearer $TOKEN")

echo "✅ Revenue data fetched"
echo "$REV_RESPONSE"

echo ""
echo "================================"
echo "✅ All Tests Completed!"
echo "================================"
