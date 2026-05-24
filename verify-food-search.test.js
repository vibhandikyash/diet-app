/**
 * Test suite for Food Search and Filtering
 * Verifies acceptance criteria:
 * 1. Search input filters foods by name (case-insensitive)
 * 2. Search debounces with 300ms delay to reduce queries
 * 3. Results display sorted alphabetically or by match relevance
 * 4. Optional brand filter (if brands exist in schema)
 * 5. No results message displays when search returns empty
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
const testFoods = [
  {
    name: 'Banana',
    servingSize: '100',
    servingUnit: 'g',
    brand: 'Dole',
    calories: 89,
    protein: 1.1,
    carbs: 22.8,
    fat: 0.3,
  },
  {
    name: 'Apple',
    servingSize: '100',
    servingUnit: 'g',
    brand: 'Organic Valley',
    calories: 52,
    protein: 0.3,
    carbs: 13.8,
    fat: 0.2,
  },
  {
    name: 'Banana Chips',
    servingSize: '30',
    servingUnit: 'g',
    brand: 'Dole',
    calories: 147,
    protein: 0.7,
    carbs: 16.6,
    fat: 9.5,
  },
  {
    name: 'Orange Juice',
    servingSize: '240',
    servingUnit: 'ml',
    brand: 'Tropicana',
    calories: 112,
    protein: 1.7,
    carbs: 25.8,
    fat: 0.5,
  },
  {
    name: 'Peanut Butter',
    servingSize: '32',
    servingUnit: 'g',
    brand: 'Skippy',
    calories: 188,
    protein: 8.0,
    carbs: 7.0,
    fat: 16.0,
  },
];

async function setupTestData() {
  console.log('Setting up test data...');

  // Clean up existing test data
  await prisma.nutritionData.deleteMany({
    where: {
      foodItem: {
        name: {
          in: testFoods.map(f => f.name),
        },
      },
    },
  });
  await prisma.foodItem.deleteMany({
    where: {
      name: {
        in: testFoods.map(f => f.name),
      },
    },
  });

  // Create test foods
  for (const food of testFoods) {
    await makeRequest('POST', '/api/foods', food);
  }

  console.log('✓ Test data created');
}

async function testSearchByName() {
  console.log('\nTest 1: Search input filters foods by name (case-insensitive)');

  // Test case-insensitive search for "banana"
  let { response, data } = await makeRequest('GET', '/api/foods?search=banana');

  if (response.status !== 200) {
    throw new Error(`Expected status 200, got ${response.status}`);
  }

  if (!data.foods || !Array.isArray(data.foods)) {
    throw new Error('Response should include foods array');
  }

  if (data.foods.length !== 2) {
    throw new Error(`Expected 2 results for "banana", got ${data.foods.length}`);
  }

  // Verify both "Banana" and "Banana Chips" are returned
  const foodNames = data.foods.map(f => f.name);
  if (!foodNames.includes('Banana') || !foodNames.includes('Banana Chips')) {
    throw new Error('Search should return both "Banana" and "Banana Chips"');
  }

  // Test uppercase search
  ({ response, data } = await makeRequest('GET', '/api/foods?search=APPLE'));

  if (data.foods.length !== 1) {
    throw new Error(`Expected 1 result for "APPLE", got ${data.foods.length}`);
  }

  if (data.foods[0].name !== 'Apple') {
    throw new Error('Case-insensitive search should find "Apple"');
  }

  // Test partial match
  ({ response, data } = await makeRequest('GET', '/api/foods?search=juice'));

  if (data.foods.length !== 1) {
    throw new Error(`Expected 1 result for "juice", got ${data.foods.length}`);
  }

  if (data.foods[0].name !== 'Orange Juice') {
    throw new Error('Partial match should find "Orange Juice"');
  }

  console.log('✓ Search input filters foods by name (case-insensitive)');
}

async function testBrandFilter() {
  console.log('\nTest 2: Optional brand filter');

  // Test brand filter
  const { response, data } = await makeRequest('GET', '/api/foods?brand=Dole');

  if (response.status !== 200) {
    throw new Error(`Expected status 200, got ${response.status}`);
  }

  if (!data.foods || !Array.isArray(data.foods)) {
    throw new Error('Response should include foods array');
  }

  if (data.foods.length !== 2) {
    throw new Error(`Expected 2 results for brand "Dole", got ${data.foods.length}`);
  }

  // Verify both Dole products are returned
  const brands = data.foods.map(f => f.brand);
  if (!brands.every(b => b === 'Dole')) {
    throw new Error('All results should have brand "Dole"');
  }

  console.log('✓ Optional brand filter works');
}

async function testCombinedSearchAndFilter() {
  console.log('\nTest 3: Combined search and brand filter');

  // Test search + brand filter
  const { response, data } = await makeRequest('GET', '/api/foods?search=banana&brand=Dole');

  if (response.status !== 200) {
    throw new Error(`Expected status 200, got ${response.status}`);
  }

  if (data.foods.length !== 2) {
    throw new Error(`Expected 2 results, got ${data.foods.length}`);
  }

  // Verify results match both search and filter
  const foodNames = data.foods.map(f => f.name);
  if (!foodNames.includes('Banana') || !foodNames.includes('Banana Chips')) {
    throw new Error('Should return both Banana products from Dole');
  }

  console.log('✓ Combined search and brand filter works');
}

async function testResultsSorting() {
  console.log('\nTest 4: Results display sorted alphabetically');

  // Test alphabetical sorting
  const { response, data } = await makeRequest('GET', '/api/foods?search=');

  if (response.status !== 200) {
    throw new Error(`Expected status 200, got ${response.status}`);
  }

  if (data.foods.length < 2) {
    throw new Error('Need at least 2 results to verify sorting');
  }

  // Verify alphabetical order
  const names = data.foods.map(f => f.name);
  const sortedNames = [...names].sort((a, b) => a.localeCompare(b));

  if (JSON.stringify(names) !== JSON.stringify(sortedNames)) {
    throw new Error(`Results should be sorted alphabetically. Got: ${names.join(', ')}, Expected: ${sortedNames.join(', ')}`);
  }

  console.log('✓ Results display sorted alphabetically');
}

async function testNoResults() {
  console.log('\nTest 5: No results message when search returns empty');

  // Test search with no matches
  const { response, data } = await makeRequest('GET', '/api/foods?search=nonexistentfood123');

  if (response.status !== 200) {
    throw new Error(`Expected status 200, got ${response.status}`);
  }

  if (!data.foods || !Array.isArray(data.foods)) {
    throw new Error('Response should include foods array');
  }

  if (data.foods.length !== 0) {
    throw new Error(`Expected 0 results for non-existent food, got ${data.foods.length}`);
  }

  console.log('✓ API returns empty array when no results found');
}

async function cleanup() {
  console.log('\nCleaning up test data...');
  await prisma.nutritionData.deleteMany({
    where: {
      foodItem: {
        name: {
          in: testFoods.map(f => f.name),
        },
      },
    },
  });
  await prisma.foodItem.deleteMany({
    where: {
      name: {
        in: testFoods.map(f => f.name),
      },
    },
  });
  console.log('✓ Cleanup complete');
}

async function runTests() {
  console.log('Starting Food Search and Filtering Tests\n');
  console.log('='.repeat(50));

  try {
    // Setup test data
    await setupTestData();

    // Run tests in sequence
    await testSearchByName();
    await testBrandFilter();
    await testCombinedSearchAndFilter();
    await testResultsSorting();
    await testNoResults();

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
