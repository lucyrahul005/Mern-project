#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

API_URL="http://localhost:5001"
TIMESTAMP=$(date +%s%N | cut -b1-13)
TEST_EMAIL="test_admin_$TIMESTAMP@restaurant.com"
TEST_RESTAURANT="Test Restaurant $TIMESTAMP"

echo -e "${BLUE}════════════════════════════════════════${NC}"
echo -e "${BLUE}Restaurant Admin Registration Test${NC}"
echo -e "${BLUE}════════════════════════════════════════${NC}\n"

# Test 1: Check if API is running
echo -e "${YELLOW}Test 1: Checking if API is running...${NC}"
if curl -s -m 5 "$API_URL" > /dev/null; then
    echo -e "${GREEN}✅ API is running${NC}\n"
else
    echo -e "${RED}❌ API is not running. Start with: npm start${NC}"
    exit 1
fi

# Test 2: Test Registration Endpoint
echo -e "${YELLOW}Test 2: Testing Restaurant Admin Registration${NC}"
echo -e "Email: $TEST_EMAIL"
echo -e "Restaurant: $TEST_RESTAURANT\n"

RESPONSE=$(curl -s -X POST "$API_URL/api/auth/register-restaurant-admin" \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"Test Admin User\",
    \"email\": \"$TEST_EMAIL\",
    \"password\": \"TestPassword123\",
    \"restaurantName\": \"$TEST_RESTAURANT\",
    \"restaurantDescription\": \"A test restaurant for verification\",
    \"cuisine\": \"Indian\",
    \"phone\": \"9876543210\",
    \"city\": \"Test City\",
    \"state\": \"Test State\",
    \"pincode\": \"123456\"
  }")

echo "Response:"
echo "$RESPONSE" | jq . 2>/dev/null || echo "$RESPONSE"
echo ""

# Check if registration was successful
if echo "$RESPONSE" | grep -q "Restaurant admin registered successfully"; then
    echo -e "${GREEN}✅ Registration Successful${NC}\n"
    
    # Extract token and user info
    TOKEN=$(echo "$RESPONSE" | jq -r '.token' 2>/dev/null)
    USER_ID=$(echo "$RESPONSE" | jq -r '.user._id' 2>/dev/null)
    RESTAURANT_ID=$(echo "$RESPONSE" | jq -r '.restaurant._id' 2>/dev/null)
    
    echo "Extracted Data:"
    echo -e "  Token: ${GREEN}$TOKEN${NC}"
    echo -e "  User ID: ${GREEN}$USER_ID${NC}"
    echo -e "  Restaurant ID: ${GREEN}$RESTAURANT_ID${NC}\n"
    
    # Test 3: Test Login with newly created account
    echo -e "${YELLOW}Test 3: Testing Login with New Account${NC}\n"
    
    LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/api/auth/login" \
      -H "Content-Type: application/json" \
      -d "{
        \"email\": \"$TEST_EMAIL\",
        \"password\": \"TestPassword123\"
      }")
    
    echo "Login Response:"
    echo "$LOGIN_RESPONSE" | jq . 2>/dev/null || echo "$LOGIN_RESPONSE"
    echo ""
    
    if echo "$LOGIN_RESPONSE" | grep -q "Login successful"; then
        echo -e "${GREEN}✅ Login Test Successful${NC}\n"
        
        LOGIN_TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.token' 2>/dev/null)
        
        # Test 4: Fetch Restaurant Profile with Token
        echo -e "${YELLOW}Test 4: Fetching Restaurant Profile${NC}\n"
        
        PROFILE_RESPONSE=$(curl -s -X GET "$API_URL/api/restaurant-admin/profile" \
          -H "Authorization: Bearer $LOGIN_TOKEN")
        
        echo "Profile Response:"
        echo "$PROFILE_RESPONSE" | jq . 2>/dev/null || echo "$PROFILE_RESPONSE"
        echo ""
        
        if echo "$PROFILE_RESPONSE" | grep -q "$TEST_RESTAURANT"; then
            echo -e "${GREEN}✅ Profile Fetch Successful${NC}\n"
        else
            echo -e "${RED}❌ Profile Fetch Failed${NC}\n"
        fi
        
    else
        echo -e "${RED}❌ Login Test Failed${NC}\n"
    fi
    
else
    echo -e "${RED}❌ Registration Failed${NC}\n"
fi

# Test 5: Test Duplicate Email Registration
echo -e "${YELLOW}Test 5: Testing Duplicate Email Validation${NC}\n"

DUPLICATE_RESPONSE=$(curl -s -X POST "$API_URL/api/auth/register-restaurant-admin" \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"Another User\",
    \"email\": \"$TEST_EMAIL\",
    \"password\": \"AnotherPassword123\",
    \"restaurantName\": \"Another Restaurant\",
    \"restaurantDescription\": \"Another test restaurant\",
    \"cuisine\": \"Chinese\",
    \"phone\": \"9876543211\",
    \"city\": \"Another City\",
    \"state\": \"Another State\",
    \"pincode\": \"654321\"
  }")

echo "Response:"
echo "$DUPLICATE_RESPONSE" | jq . 2>/dev/null || echo "$DUPLICATE_RESPONSE"
echo ""

if echo "$DUPLICATE_RESPONSE" | grep -q "Email already registered"; then
    echo -e "${GREEN}✅ Duplicate Email Validation Working${NC}\n"
else
    echo -e "${RED}❌ Duplicate Email Validation Not Working${NC}\n"
fi

# Test 6: Test Duplicate Restaurant Name
echo -e "${YELLOW}Test 6: Testing Duplicate Restaurant Name Validation${NC}\n"

DUPLICATE_RESTAURANT_RESPONSE=$(curl -s -X POST "$API_URL/api/auth/register-restaurant-admin" \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"Yet Another User\",
    \"email\": \"yetanother_$TIMESTAMP@restaurant.com\",
    \"password\": \"YetAnotherPassword123\",
    \"restaurantName\": \"$TEST_RESTAURANT\",
    \"restaurantDescription\": \"Trying to use same restaurant name\",
    \"cuisine\": \"Thai\",
    \"phone\": \"9876543212\",
    \"city\": \"Yet Another City\",
    \"state\": \"Yet Another State\",
    \"pincode\": \"789012\"
  }")

echo "Response:"
echo "$DUPLICATE_RESTAURANT_RESPONSE" | jq . 2>/dev/null || echo "$DUPLICATE_RESTAURANT_RESPONSE"
echo ""

if echo "$DUPLICATE_RESTAURANT_RESPONSE" | grep -q "Restaurant name already exists"; then
    echo -e "${GREEN}✅ Duplicate Restaurant Name Validation Working${NC}\n"
else
    echo -e "${RED}❌ Duplicate Restaurant Name Validation Not Working${NC}\n"
fi

# Test 7: Test Missing Required Fields
echo -e "${YELLOW}Test 7: Testing Missing Required Fields Validation${NC}\n"

MISSING_FIELDS_RESPONSE=$(curl -s -X POST "$API_URL/api/auth/register-restaurant-admin" \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"Incomplete User\",
    \"email\": \"incomplete_$TIMESTAMP@restaurant.com\",
    \"password\": \"IncompletePassword123\"
  }")

echo "Response:"
echo "$MISSING_FIELDS_RESPONSE" | jq . 2>/dev/null || echo "$MISSING_FIELDS_RESPONSE"
echo ""

if echo "$MISSING_FIELDS_RESPONSE" | grep -q "Please fill all required fields"; then
    echo -e "${GREEN}✅ Missing Fields Validation Working${NC}\n"
else
    echo -e "${RED}❌ Missing Fields Validation Not Working${NC}\n"
fi

echo -e "${BLUE}════════════════════════════════════════${NC}"
echo -e "${BLUE}Test Suite Complete!${NC}"
echo -e "${BLUE}════════════════════════════════════════${NC}\n"

echo -e "${GREEN}Summary:${NC}"
echo "✅ Test email created: $TEST_EMAIL"
echo "✅ Test restaurant created: $TEST_RESTAURANT"
echo "✅ All registration tests completed"
echo -e "\n${YELLOW}Next Steps:${NC}"
echo "1. Verify data in MongoDB:"
echo "   db.users.findOne({ email: \"$TEST_EMAIL\" })"
echo "   db.restaurants.findOne({ name: \"$TEST_RESTAURANT\" })"
echo ""
echo "2. Visit the registration page:"
echo "   http://localhost:5173/restaurantadmin-register"
echo ""
echo "3. Login with the registered account:"
echo "   http://localhost:5173/restaurantadmin-login"
echo ""
