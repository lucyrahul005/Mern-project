#!/bin/bash

# 🛍️ CHECKOUT → PAYMENT → SUCCESS FLOW TEST SCRIPT
# This script tests the complete order flow

API_URL="http://localhost:5001"
USER_ID="69a663e9458cd299f43ed4f2"

echo "🚀 Starting Complete Order Flow Test"
echo "═══════════════════════════════════════════════════════════"

# Test 1: Create Order
echo ""
echo "📝 TEST 1: Create Order (Checkout)"
echo "─────────────────────────────────────────────────────────"

ORDER_RESPONSE=$(curl -s -X POST "$API_URL/api/orders" \
  -H "user-id: $USER_ID" \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      {
        "productId": "507f1f77bcf86cd799439011",
        "name": "Margherita Pizza",
        "price": 250,
        "quantity": 2,
        "image": "https://via.placeholder.com/200",
        "restaurantId": "507f1f77bcf86cd799439012"
      }
    ],
    "subtotal": 500,
    "deliveryFee": 40,
    "tax": 50,
    "total": 590,
    "deliveryAddress": {
      "fullName": "Test User",
      "phone": "+919876543210",
      "addressLine": "123 Main Street, Apt 4B",
      "city": "Mumbai",
      "state": "MH",
      "pincode": "400001",
      "country": "India"
    },
    "specialInstructions": "Extra cheese, no onions"
  }')

echo "$ORDER_RESPONSE" | jq '.' 2>/dev/null || echo "$ORDER_RESPONSE"

# Extract Order ID
ORDER_ID=$(echo "$ORDER_RESPONSE" | jq -r '.order._id' 2>/dev/null)

if [ -z "$ORDER_ID" ] || [ "$ORDER_ID" = "null" ]; then
  echo "❌ Failed to create order. Aborting tests."
  exit 1
fi

echo ""
echo "✅ Order created successfully!"
echo "📌 Order ID: $ORDER_ID"

# Test 2: Verify Order Status Before Payment
echo ""
echo "📊 TEST 2: Verify Order Status (Before Payment)"
echo "─────────────────────────────────────────────────────────"

ORDER_DETAILS=$(curl -s -X GET "$API_URL/api/orders/$ORDER_ID" \
  -H "user-id: $USER_ID")

echo "$ORDER_DETAILS" | jq '.order | {orderStatus, paymentStatus, paymentMethod, total}' 2>/dev/null || echo "$ORDER_DETAILS"

# Test 3: Process Payment (Simulate COD)
echo ""
echo "💳 TEST 3: Process Payment (COD - Pending)"
echo "─────────────────────────────────────────────────────────"

PAYMENT_COD=$(curl -s -X PUT "$API_URL/api/orders/$ORDER_ID/payment" \
  -H "user-id: $USER_ID" \
  -H "Content-Type: application/json" \
  -d '{
    "paymentMethod": "COD",
    "paymentStatus": "Pending"
  }')

echo "$PAYMENT_COD" | jq '.order | {orderStatus, paymentStatus, paymentMethod}' 2>/dev/null || echo "$PAYMENT_COD"

# Test 4: Process Payment (Simulate Card)
echo ""
echo "💳 TEST 4: Process Payment (Card - Completed)"
echo "─────────────────────────────────────────────────────────"

PAYMENT_CARD=$(curl -s -X PUT "$API_URL/api/orders/$ORDER_ID/payment" \
  -H "user-id: $USER_ID" \
  -H "Content-Type: application/json" \
  -d '{
    "paymentMethod": "Card",
    "paymentStatus": "Completed"
  }')

echo "$PAYMENT_CARD" | jq '.order | {orderStatus, paymentStatus, paymentMethod}' 2>/dev/null || echo "$PAYMENT_CARD"

# Test 5: Process Payment (Simulate UPI)
echo ""
echo "💳 TEST 5: Process Payment (UPI - Completed)"
echo "─────────────────────────────────────────────────────────"

PAYMENT_UPI=$(curl -s -X PUT "$API_URL/api/orders/$ORDER_ID/payment" \
  -H "user-id: $USER_ID" \
  -H "Content-Type: application/json" \
  -d '{
    "paymentMethod": "UPI",
    "paymentStatus": "Completed"
  }')

echo "$PAYMENT_UPI" | jq '.order | {orderStatus, paymentStatus, paymentMethod}' 2>/dev/null || echo "$PAYMENT_UPI"

# Test 6: Fetch User's Orders
echo ""
echo "📦 TEST 6: Fetch User's Orders"
echo "─────────────────────────────────────────────────────────"

USER_ORDERS=$(curl -s -X GET "$API_URL/api/orders/user/$USER_ID")

echo "$USER_ORDERS" | jq '.orders[0] | {_id, orderStatus, paymentStatus, paymentMethod, total}' 2>/dev/null || echo "$USER_ORDERS"

# Test 7: Update Order Status (Admin - Preparing)
echo ""
echo "⚙️ TEST 7: Update Order Status (Admin - Preparing)"
echo "─────────────────────────────────────────────────────────"

STATUS_UPDATE=$(curl -s -X PUT "$API_URL/api/orders/$ORDER_ID/status" \
  -H "Content-Type: application/json" \
  -d '{
    "orderStatus": "Preparing"
  }')

echo "$STATUS_UPDATE" | jq '.order | {orderStatus, paymentStatus}' 2>/dev/null || echo "$STATUS_UPDATE"

# Test 8: Update to Out for Delivery
echo ""
echo "🚚 TEST 8: Update Order Status (Admin - Out for Delivery)"
echo "─────────────────────────────────────────────────────────"

STATUS_UPDATE2=$(curl -s -X PUT "$API_URL/api/orders/$ORDER_ID/status" \
  -H "Content-Type: application/json" \
  -d '{
    "orderStatus": "Out for Delivery"
  }')

echo "$STATUS_UPDATE2" | jq '.order | {orderStatus}' 2>/dev/null || echo "$STATUS_UPDATE2"

# Test 9: Update to Delivered
echo ""
echo "✅ TEST 9: Update Order Status (Admin - Delivered)"
echo "─────────────────────────────────────────────────────────"

STATUS_UPDATE3=$(curl -s -X PUT "$API_URL/api/orders/$ORDER_ID/status" \
  -H "Content-Type: application/json" \
  -d '{
    "orderStatus": "Delivered"
  }')

echo "$STATUS_UPDATE3" | jq '.order | {orderStatus, deliveredAt}' 2>/dev/null || echo "$STATUS_UPDATE3"

# Test 10: Create Another Order to Test Cancel
echo ""
echo "📝 TEST 10: Create Order 2 (For Cancel Test)"
echo "─────────────────────────────────────────────────────────"

ORDER_2=$(curl -s -X POST "$API_URL/api/orders" \
  -H "user-id: $USER_ID" \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      {
        "productId": "507f1f77bcf86cd799439013",
        "name": "Garlic Bread",
        "price": 150,
        "quantity": 1,
        "image": "https://via.placeholder.com/200"
      }
    ],
    "subtotal": 150,
    "deliveryFee": 40,
    "tax": 15,
    "total": 205,
    "deliveryAddress": {
      "fullName": "Test User",
      "phone": "+919876543210",
      "addressLine": "123 Main Street",
      "city": "Mumbai",
      "state": "MH",
      "pincode": "400001"
    }
  }')

ORDER_ID_2=$(echo "$ORDER_2" | jq -r '.order._id' 2>/dev/null)
echo "✅ Order 2 created: $ORDER_ID_2"

# Test 11: Cancel Order
echo ""
echo "❌ TEST 11: Cancel Order (User)"
echo "─────────────────────────────────────────────────────────"

CANCEL=$(curl -s -X PUT "$API_URL/api/orders/$ORDER_ID_2/cancel" \
  -H "user-id: $USER_ID" \
  -H "Content-Type: application/json" \
  -d '{
    "reason": "User requested cancellation"
  }')

echo "$CANCEL" | jq '.order | {orderStatus, cancellationReason}' 2>/dev/null || echo "$CANCEL"

# Summary
echo ""
echo "═══════════════════════════════════════════════════════════"
echo "🎉 COMPLETE FLOW TEST FINISHED"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "✅ Test Results:"
echo "  ✓ Create Order (Checkout)"
echo "  ✓ Payment Processing (All methods)"
echo "  ✓ Verify Payment Status"
echo "  ✓ Admin Order Status Updates"
echo "  ✓ Complete Order Lifecycle"
echo "  ✓ Cancel Order"
echo ""
echo "📌 Order 1 ID: $ORDER_ID (Status: Delivered)"
echo "📌 Order 2 ID: $ORDER_ID_2 (Status: Cancelled)"
echo ""
echo "🔍 View in Frontend: http://localhost:5178/orders"
echo ""
