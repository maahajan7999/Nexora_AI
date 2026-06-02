import type { ParsedData } from '../types';

// Generate realistic Indian business dataset
export function generateSampleData(): ParsedData {
  const categories = ['Electronics', 'Fashion', 'Home & Kitchen', 'Beauty', 'Sports', 'Books'];
  const regions = ['Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Hyderabad', 'Kolkata', 'Pune', 'Ahmedabad'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const rows: Record<string, string | number>[] = [];
  let id = 1;

  // Generate 200 realistic records
  for (let i = 0; i < 200; i++) {
    const category = categories[Math.floor(Math.random() * categories.length)];
    const region = regions[Math.floor(Math.random() * regions.length)];
    const month = months[i % 12];

    // Base values with realistic Indian business ranges
    const baseRevenue = {
      'Electronics': 45000 + Math.random() * 250000,
      'Fashion': 25000 + Math.random() * 100000,
      'Home & Kitchen': 15000 + Math.random() * 80000,
      'Beauty': 10000 + Math.random() * 60000,
      'Sports': 20000 + Math.random() * 70000,
      'Books': 5000 + Math.random() * 30000,
    };

    const revenue = Math.round(baseRevenue[category as keyof typeof baseRevenue] || 50000);
    const profitMargin = 0.12 + Math.random() * 0.25;
    const profit = Math.round(revenue * profitMargin);
    const orders = Math.floor(20 + Math.random() * 150);
    const customers = Math.floor(15 + Math.random() * 80);

    // Add growth trend
    const growthMultiplier = 1 + (i / 200) * 0.35;

    rows.push({
      ID: id++,
      Month: month,
      Category: category,
      Region: region,
      Revenue: Math.round(revenue * growthMultiplier),
      Profit: Math.round(profit * growthMultiplier),
      Orders: orders,
      Customers: customers,
      'Avg Order Value': Math.round((revenue * growthMultiplier) / orders),
      'Profit Margin': parseFloat((profitMargin * 100).toFixed(1)),
    });
  }

  return {
    headers: ['ID', 'Month', 'Category', 'Region', 'Revenue', 'Profit', 'Orders', 'Customers', 'Avg Order Value', 'Profit Margin'],
    rows,
    fileName: 'Sample_Business_Data_2024.xlsx',
    fileSize: rows.length * 150,
    uploadTime: new Date(),
    rowCount: rows.length,
    columnCount: 10,
  };
}
