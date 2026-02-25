import type { CostBucket } from '../types';

export const COST_BUCKETS: CostBucket[] = [
  // Transportation
  { category: 'Transportation', subcategory: 'Parcel – UPS Ground', annualCostUSD: 175_400_000, costPerOrder: 5.12, pctOfTotal: 0.207, segment: 'Total', trend3moPct: 0.024 },
  { category: 'Transportation', subcategory: 'Parcel – FedEx Ground/Home', annualCostUSD: 136_600_000, costPerOrder: 3.99, pctOfTotal: 0.161, segment: 'Total', trend3moPct: 0.031 },
  { category: 'Transportation', subcategory: 'Self Fleet Delivery', annualCostUSD: 47_200_000, costPerOrder: 1.38, pctOfTotal: 0.056, segment: 'Total', trend3moPct: 0.015 },
  { category: 'Transportation', subcategory: 'LTL / TL Inbound', annualCostUSD: 28_100_000, costPerOrder: 0.82, pctOfTotal: 0.033, segment: 'Total', trend3moPct: -0.012 },
  { category: 'Transportation', subcategory: 'Fuel Surcharges', annualCostUSD: 31_400_000, costPerOrder: 0.92, pctOfTotal: 0.037, segment: 'Total', trend3moPct: 0.048 },
  { category: 'Transportation', subcategory: 'Accessorials & Fees', annualCostUSD: 18_200_000, costPerOrder: 0.53, pctOfTotal: 0.021, segment: 'Total', trend3moPct: 0.019 },

  // Warehousing
  { category: 'Warehousing', subcategory: 'Direct Labor', annualCostUSD: 189_400_000, costPerOrder: 5.53, pctOfTotal: 0.224, segment: 'Total', trend3moPct: 0.028 },
  { category: 'Warehousing', subcategory: 'Facility Lease / Ownership', annualCostUSD: 72_100_000, costPerOrder: 2.11, pctOfTotal: 0.085, segment: 'Total', trend3moPct: 0.051 },
  { category: 'Warehousing', subcategory: 'Equipment & MHE', annualCostUSD: 34_200_000, costPerOrder: 1.00, pctOfTotal: 0.040, segment: 'Total', trend3moPct: 0.009 },
  { category: 'Warehousing', subcategory: 'Utilities & Energy', annualCostUSD: 18_400_000, costPerOrder: 0.54, pctOfTotal: 0.022, segment: 'Total', trend3moPct: 0.042 },
  { category: 'Warehousing', subcategory: 'WMS / Tech', annualCostUSD: 12_100_000, costPerOrder: 0.35, pctOfTotal: 0.014, segment: 'Total', trend3moPct: 0.000 },

  // Inventory Carrying
  { category: 'Inventory Carrying', subcategory: 'Safety Stock Capital Cost', annualCostUSD: 66_800_000, costPerOrder: 1.95, pctOfTotal: 0.079, segment: 'Total', trend3moPct: -0.008 },
  { category: 'Inventory Carrying', subcategory: 'Slow / Excess Movers', annualCostUSD: 23_100_000, costPerOrder: 0.67, pctOfTotal: 0.027, segment: 'Total', trend3moPct: 0.014 },
  { category: 'Inventory Carrying', subcategory: 'Obsolescence & Write-offs', annualCostUSD: 8_900_000, costPerOrder: 0.26, pctOfTotal: 0.011, segment: 'Total', trend3moPct: -0.021 },

  // Overhead
  { category: 'Overhead', subcategory: 'Supply Chain Management', annualCostUSD: 31_200_000, costPerOrder: 0.91, pctOfTotal: 0.037, segment: 'Total', trend3moPct: 0.005 },
  { category: 'Overhead', subcategory: 'Compliance & Quality', annualCostUSD: 14_100_000, costPerOrder: 0.41, pctOfTotal: 0.017, segment: 'Total', trend3moPct: 0.000 },
  { category: 'Overhead', subcategory: 'Returns Processing', annualCostUSD: 16_100_000, costPerOrder: 0.47, pctOfTotal: 0.019, segment: 'Total', trend3moPct: 0.018 },
  { category: 'Overhead', subcategory: 'Insurance & Risk', annualCostUSD: 4_000_000, costPerOrder: 0.12, pctOfTotal: 0.005, segment: 'Total', trend3moPct: 0.000 },
];

export const COST_BY_SEGMENT = {
  dental: {
    totalAnnual: 321_000_000,
    perOrder: 16.20,
    topCategories: [
      { category: 'Labor', cost: 68_000_000, pct: 0.212 },
      { category: 'Parcel Freight', cost: 81_000_000, pct: 0.252 },
      { category: 'Facility', cost: 48_000_000, pct: 0.150 },
    ],
  },
  animalHealth: {
    totalAnnual: 526_300_000,
    perOrder: 13.88,
    topCategories: [
      { category: 'Labor', cost: 121_000_000, pct: 0.230 },
      { category: 'Parcel Freight', cost: 131_000_000, pct: 0.249 },
      { category: 'Facility', cost: 58_000_000, pct: 0.110 },
    ],
  },
};

export const TOP_COST_OPPORTUNITIES = [
  { id: 'opp-1', title: 'FedEx Lane Renegotiation – Southeast', description: 'Renegotiate FedEx Ground rates across SE lanes by shifting 30% volume to regional carrier, reducing cost/order by $1.20.', annualSavingsPotentialUSD: 8_200_000, annualOpportunity: 8_200_000, category: 'Transportation', priority: 'high', confidencePct: 87, complexity: 'Low', timeToValue: '45 days' },
  { id: 'opp-2', title: 'Columbus FC Fixed Cost Elimination', description: 'Consolidate Columbus FC operations into Elgin and Harrisburg, eliminating $7.8M in fixed lease and labor costs with minimal OTIF impact.', annualSavingsPotentialUSD: 7_800_000, annualOpportunity: 7_800_000, category: 'Warehousing', priority: 'high', confidencePct: 79, complexity: 'Medium', timeToValue: '6 months' },
  { id: 'opp-3', title: 'Elgin GTP Labor Reduction', description: 'Deploy Goods-to-Person automation at Elgin hub, reducing pick labor by 38% and capturing $5.9M annual savings at 22-month payback.', annualSavingsPotentialUSD: 5_900_000, annualOpportunity: 5_900_000, category: 'Warehousing', priority: 'medium', confidencePct: 82, complexity: 'Medium', timeToValue: '8 months' },
  { id: 'opp-4', title: 'Dental Safety Stock Reduction', description: 'Apply demand-driven replenishment to top 2,000 dental SKUs, reducing safety stock days from 18 to 12 and freeing $3.4M in working capital.', annualSavingsPotentialUSD: 3_400_000, annualOpportunity: 3_400_000, category: 'Inventory Carrying', priority: 'medium', confidencePct: 74, complexity: 'Low', timeToValue: '3 months' },
  { id: 'opp-5', title: 'Fuel Surcharge Optimization', description: 'Index fuel surcharges to EIA diesel benchmark rather than carrier tables, recovering ~$2.8M in over-charged surcharges annually.', annualSavingsPotentialUSD: 2_800_000, annualOpportunity: 2_800_000, category: 'Transportation', priority: 'low', confidencePct: 91, complexity: 'Low', timeToValue: '30 days' },
];

export const SEGMENT_COST_SPLITS = [
  { segment: 'Patterson Dental', totalCostUSD: 267_000_000, pctOfTotal: 31.5, costPerOrderUSD: 13.47 },
  { segment: 'Patterson Animal Health', totalCostUSD: 580_300_000, pctOfTotal: 68.5, costPerOrderUSD: 15.30 },
];
