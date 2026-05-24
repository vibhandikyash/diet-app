/**
 * Test suite for Food CRUD operations
 * Verifies acceptance criteria:
 * 1. Can create new food items with all required nutrition fields
 * 2. Can edit existing food items and changes persist to database
 * 3. Can delete food items
 * 4. Nutrition fields validate as positive numbers
 * 5. Food list shows paginated results with 20 items per page
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Helper to make API requests
async function makeRequest(method, path, body = null) {
  const baseUrl = 'http://localhost:3000';
  const url = `${baseUrl}${path}`;

  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(url, options);
  const data = await response.json();

  return { response, data };
}

// Test data
const validFoodData = {
  name: 'Test Banana',
  servingSize: '100',
  servingUnit: 'g',
  calories: 89,
  protein: 1.1,
  carbs: 22.8,
  fat: 0.3,
};

async function testCreateFood() {
  console.log('Test 1: Create new food item with all required nutrition fields');

  const { response, data } = await makeRequest('POST', '/api/foods', validFoodData);

  if (response.status !== 201) {
    throw new Error(`Expected status 201, got ${response.status}`);
  }

  if (!data.id) {
    throw new Error('Response should include food item ID');
  }

  if (data.name !== validFoodData.name) {
    throw new Error(`Expected name "${validFoodData.name}", got "${data.name}"`);
  }

  // Verify nutrition data exists
  if (!data.nutrition) {
    throw new Error('Response should include nutrition data');
  }

  if (data.nutrition.calories !== validFoodData.calories) {
    throw new Error(`Expected calories ${validFoodData.calories}, got ${data.nutrition.calories}`);
  }

  console.log('✓ Can create food item with all required fields');
  return data.id;
}

async function testEditFood(foodId) {
  console.log('\nTest 2: Edit existing food item and verify changes persist');

  const updatedData = {
    name: 'Updated Banana',
    servingSize: '120',
    servingUnit: 'g',
    calories: 107,
    protein: 1.3,
    carbs: 27.4,
    fat: 0.4,
  };

  const { response, data } = await makeRequest('PUT', `/api/foods/${foodId}`, updatedData);

  if (response.status !== 200) {
    throw new Error(`Expected status 200, got ${response.status}`);
  }

  if (data.name !== updatedData.name) {
    throw new Error(`Expected name "${updatedData.name}", got "${data.name}"`);
  }

  // Verify changes persisted to database
  const dbFood = await prisma.foodItem.findUnique({
    where: { id: foodId },
    include: { nutrition: true },
  });

  if (!dbFood) {
    throw new Error('Food item not found in database');
  }

  if (dbFood.name !== updatedData.name) {
    throw new Error('Changes did not persist to database');
  }

  if (dbFood.nutrition.calories !== updatedData.calories) {
    throw new Error('Nutrition changes did not persist to database');
  }

  console.log('✓ Can edit food item and changes persist to database');
}

async function testDeleteFood(foodId) {
  console.log('\nTest 3: Delete food item');

  const { response, data } = await makeRequest('DELETE', `/api/foods/${foodId}`);

  if (response.status !== 200) {
    throw new Error(`Expected status 200, got ${response.status}`);
  }

  // Verify food is deleted from database
  const dbFood = await prisma.foodItem.findUnique({
    where: { id: foodId },
  });

  if (dbFood !== null) {
    throw new Error('Food item should be deleted from database');
  }

  console.log('✓ Can delete food items');
}

async function testValidation() {
  console.log('\nTest 4: Nutrition fields validate as positive numbers');

  // Test negative calories
  const negativeCalories = { ...validFoodData, calories: -100 };
  let { response } = await makeRequest('POST', '/api/foods', negativeCalories);

  if (response.status !== 400) {
    throw new Error('Should reject negative calories');
  }

  // Test negative protein
  const negativeProtein = { ...validFoodData, protein: -5 };
  ({ response } = await makeRequest('POST', '/api/foods', negativeProtein));

  if (response.status !== 400) {
    throw new Error('Should reject negative protein');
  }

  // Test negative carbs
  const negativeCarbs = { ...validFoodData, carbs: -10 };
  ({ response } = await makeRequest('POST', '/api/foods', negativeCarbs));

  if (response.status !== 400) {
    throw new Error('Should reject negative carbs');
  }

  // Test negative fat
  const negativeFat = { ...validFoodData, fat: -2 };
  ({ response } = await makeRequest('POST', '/api/foods', negativeFat));

  if (response.status !== 400) {
    throw new Error('Should reject negative fat');
  }

  // Test zero values (should be allowed)
  const zeroFat = { ...validFoodData, fat: 0 };
  ({ response } = await makeRequest('POST', '/api/foods', zeroFat));

  if (response.status !== 201) {
    throw new Error('Should allow zero values');
  }

  console.log('✓ Nutrition fields validate as positive numbers');
}

async function testPagination() {
  console.log('\nTest 5: Food list shows paginated results with 20 items per page');

  // Create 25 test food items
  console.log('  Creating 25 test food items...');
  const createPromises = [];
  for (let i = 0; i < 25; i++) {
    const foodData = {
      ...validFoodData,
      name: `Test Food ${i}`,
    };
    createPromises.push(makeRequest('POST', '/api/foods', foodData));
  }
  await Promise.all(createPromises);

  // Test first page
  let { response, data } = await makeRequest('GET', '/api/foods?page=1&limit=20');

  if (response.status !== 200) {
    throw new Error(`Expected status 200, got ${response.status}`);
  }

  if (!data.foods || !Array.isArray(data.foods)) {
    throw new Error('Response should include foods array');
  }

  if (data.foods.length !== 20) {
    throw new Error(`Expected 20 items on first page, got ${data.foods.length}`);
  }

  if (!data.pagination) {
    throw new Error('Response should include pagination metadata');
  }

  if (data.pagination.total < 25) {
    throw new Error(`Expected total >= 25, got ${data.pagination.total}`);
  }

  // Test second page
  ({ response, data } = await makeRequest('GET', '/api/foods?page=2&limit=20'));

  if (response.status !== 200) {
    throw new Error(`Expected status 200, got ${response.status}`);
  }

  if (data.foods.length < 5) {
    throw new Error(`Expected at least 5 items on second page, got ${data.foods.length}`);
  }

  console.log('✓ Food list shows paginated results with 20 items per page');
}

async function cleanup() {
  console.log('\nCleaning up test data...');
  await prisma.nutritionData.deleteMany({
    where: {
      foodItem: {
        name: {
          startsWith: 'Test',
        },
      },
    },
  });
  await prisma.foodItem.deleteMany({
    where: {
      name: {
        startsWith: 'Test',
      },
    },
  });
  console.log('✓ Cleanup complete');
}

async function runTests() {
  console.log('Starting Food CRUD Tests\n');
  console.log('='.repeat(50));

  try {
    // Clean up before tests
    await cleanup();

    // Run tests in sequence
    const foodId = await testCreateFood();
    await testEditFood(foodId);
    await testDeleteFood(foodId);
    await testValidation();
    await testPagination();

    // Clean up after tests
    await cleanup();

    console.log('\n' + '='.repeat(50));
    console.log('All tests passed! ✓');
    process.exit(0);
  } catch (error) {
    console.error('\n' + '='.repeat(50));
    console.error('Test failed:', error.message);
    console.error('='.repeat(50));

    // Clean up on failure
    await cleanup().catch(console.error);

    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Check if server is running
async function checkServer() {
  try {
    const response = await fetch('http://localhost:3000');
    return response.ok || response.status === 404;
  } catch (error) {
    return false;
  }
}

// Main execution
(async () => {
  const serverRunning = await checkServer();
  if (!serverRunning) {
    console.error('Error: Development server is not running');
    console.error('Please start the server with: npm run dev');
    process.exit(1);
  }

  await runTests();
})();
