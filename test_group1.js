const http = require('http');

async function makeRequest(path) {
  return new Promise((resolve, reject) => {
    http.get(`http://localhost:5001${path}`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ statusCode: res.statusCode, data: JSON.parse(data) }));
    }).on('error', reject);
  });
}

async function runTests() {
  console.log("Starting tests for Group 1...");

  try {
    // 1. Get Categories
    console.log("\n--- Testing GET /api/categories ---");
    const categories = await makeRequest('/api/categories');
    console.log(`Status: ${categories.statusCode}`);
    console.log(`Returned ${categories.data.data?.length || 0} categories.`);
    if (categories.data.data?.length > 0) {
      console.log("Sample:", categories.data.data[0]);
    }

    // 2. Get Branches
    console.log("\n--- Testing GET /api/branches ---");
    const branches = await makeRequest('/api/branches');
    console.log(`Status: ${branches.statusCode}`);
    console.log(`Returned ${branches.data.data?.length || 0} branches.`);
    let firstBranchId = null;
    if (branches.data.data?.length > 0) {
      console.log("Sample:", branches.data.data[0]);
      firstBranchId = branches.data.data[0].id;
    }

    // 3. Get Menu Items
    console.log("\n--- Testing GET /api/menu ---");
    const menu = await makeRequest('/api/menu');
    console.log(`Status: ${menu.statusCode}`);
    console.log(`Returned ${menu.data.data?.length || 0} menu items.`);
    if (menu.data.data?.length > 0) {
      console.log("Sample:", menu.data.data[0]);
    }

    // 4. Get Branch Specific Products (if branch exists)
    if (firstBranchId) {
      console.log(`\n--- Testing GET /api/branches/${firstBranchId}/products ---`);
      const branchProducts = await makeRequest(`/api/branches/${firstBranchId}/products`);
      console.log(`Status: ${branchProducts.statusCode}`);
      console.log(`Returned ${branchProducts.data.data?.length || 0} branch products.`);
      if (branchProducts.data.data?.length > 0) {
        console.log("Sample:", branchProducts.data.data[0]);
      }
    } else {
      console.log("\nSkipping branch products test because no branches found.");
    }
    
    // 5. Test invalid UUID for branch products
    console.log(`\n--- Testing GET /api/branches/invalid-uuid-123/products ---`);
    const invalidBranchProducts = await makeRequest(`/api/branches/invalid-uuid-123/products`);
    console.log(`Status: ${invalidBranchProducts.statusCode}`);
    console.log(`Response:`, invalidBranchProducts.data);

  } catch (error) {
    console.error("Test execution failed:", error);
  }
}

runTests();
