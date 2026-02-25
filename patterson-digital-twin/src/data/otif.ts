import type { OtifDataPoint } from '../types';

export const OTIF_TREND: OtifDataPoint[] = [
  { month: '2025-03', otifPct: 0.975, onTimePct: 0.984, inFullPct: 0.991, lateOrderCount: 892, shortShipCount: 267, segment: 'Total' },
  { month: '2025-04', otifPct: 0.978, onTimePct: 0.986, inFullPct: 0.992, lateOrderCount: 768, shortShipCount: 243, segment: 'Total' },
  { month: '2025-05', otifPct: 0.974, onTimePct: 0.983, inFullPct: 0.991, lateOrderCount: 894, shortShipCount: 281, segment: 'Total' },
  { month: '2025-06', otifPct: 0.976, onTimePct: 0.985, inFullPct: 0.991, lateOrderCount: 830, shortShipCount: 271, segment: 'Total' },
  { month: '2025-07', otifPct: 0.971, onTimePct: 0.981, inFullPct: 0.990, lateOrderCount: 1002, shortShipCount: 298, segment: 'Total' },
  { month: '2025-08', otifPct: 0.973, onTimePct: 0.982, inFullPct: 0.991, lateOrderCount: 940, shortShipCount: 275, segment: 'Total' },
  { month: '2025-09', otifPct: 0.970, onTimePct: 0.980, inFullPct: 0.990, lateOrderCount: 1044, shortShipCount: 302, segment: 'Total' },
  { month: '2025-10', otifPct: 0.972, onTimePct: 0.982, inFullPct: 0.990, lateOrderCount: 974, shortShipCount: 289, segment: 'Total' },
  { month: '2025-11', otifPct: 0.975, onTimePct: 0.984, inFullPct: 0.991, lateOrderCount: 874, shortShipCount: 260, segment: 'Total' },
  { month: '2025-12', otifPct: 0.971, onTimePct: 0.981, inFullPct: 0.990, lateOrderCount: 1018, shortShipCount: 294, segment: 'Total' },
  { month: '2026-01', otifPct: 0.973, onTimePct: 0.982, inFullPct: 0.991, lateOrderCount: 946, shortShipCount: 271, segment: 'Total' },
  { month: '2026-02', otifPct: 0.972, onTimePct: 0.981, inFullPct: 0.991, lateOrderCount: 980, shortShipCount: 279, segment: 'Total' },
];

export const OTIF_BY_SEGMENT = {
  dental: [
    { month: '2025-03', otifPct: 0.981, onTimePct: 0.989, inFullPct: 0.992 },
    { month: '2025-04', otifPct: 0.983, onTimePct: 0.991, inFullPct: 0.992 },
    { month: '2025-05', otifPct: 0.980, onTimePct: 0.988, inFullPct: 0.992 },
    { month: '2025-06', otifPct: 0.982, onTimePct: 0.990, inFullPct: 0.992 },
    { month: '2025-07', otifPct: 0.977, onTimePct: 0.986, inFullPct: 0.991 },
    { month: '2025-08', otifPct: 0.979, onTimePct: 0.987, inFullPct: 0.992 },
    { month: '2025-09', otifPct: 0.976, onTimePct: 0.985, inFullPct: 0.991 },
    { month: '2025-10', otifPct: 0.978, onTimePct: 0.986, inFullPct: 0.992 },
    { month: '2025-11', otifPct: 0.980, onTimePct: 0.988, inFullPct: 0.992 },
    { month: '2025-12', otifPct: 0.976, onTimePct: 0.985, inFullPct: 0.991 },
    { month: '2026-01', otifPct: 0.978, onTimePct: 0.987, inFullPct: 0.991 },
    { month: '2026-02', otifPct: 0.978, onTimePct: 0.986, inFullPct: 0.992 },
  ],
  animalHealth: [
    { month: '2025-03', otifPct: 0.970, onTimePct: 0.980, inFullPct: 0.990 },
    { month: '2025-04', otifPct: 0.974, onTimePct: 0.983, inFullPct: 0.991 },
    { month: '2025-05', otifPct: 0.969, onTimePct: 0.979, inFullPct: 0.990 },
    { month: '2025-06', otifPct: 0.972, onTimePct: 0.981, inFullPct: 0.991 },
    { month: '2025-07', otifPct: 0.966, onTimePct: 0.977, inFullPct: 0.989 },
    { month: '2025-08', otifPct: 0.968, onTimePct: 0.978, inFullPct: 0.990 },
    { month: '2025-09', otifPct: 0.965, onTimePct: 0.976, inFullPct: 0.989 },
    { month: '2025-10', otifPct: 0.967, onTimePct: 0.978, inFullPct: 0.989 },
    { month: '2025-11', otifPct: 0.970, onTimePct: 0.980, inFullPct: 0.990 },
    { month: '2025-12', otifPct: 0.966, onTimePct: 0.977, inFullPct: 0.989 },
    { month: '2026-01', otifPct: 0.968, onTimePct: 0.978, inFullPct: 0.990 },
    { month: '2026-02', otifPct: 0.967, onTimePct: 0.977, inFullPct: 0.990 },
  ],
};

export const OTIF_BY_FACILITY: Record<string, number> = {
  'FC-ELG-001': 0.974,
  'FC-COL-002': 0.971,
  'FC-HBG-003': 0.976,
  'FC-GSO-004': 0.968,
  'FC-BSM-005': 0.969,
  'FC-DAL-006': 0.973,
  'FC-OKC-007': 0.964,
  'FC-MSP-008': 0.972,
  'FC-RNO-009': 0.967,
  'FC-SAC-010': 0.970,
  'FC-PHX-011': 0.971,
  'FC-GRV-012': 0.970,
  'FC-MIL-013': 0.973,
};

export const CARRIER_OTIF_MAP: Record<string, { onTime: number; trend: string; shipments: number }> = {
  'UPS Ground': { onTime: 0.978, trend: 'Stable', shipments: 82400 },
  'FedEx Ground': { onTime: 0.965, trend: 'Declining', shipments: 61200 },
  'FedEx Home Delivery': { onTime: 0.961, trend: 'Declining', shipments: 28900 },
  'USPS Priority': { onTime: 0.941, trend: 'Stable', shipments: 8100 },
  'Self Fleet': { onTime: 0.989, trend: 'Improving', shipments: 14200 },
  'Regional LTL': { onTime: 0.972, trend: 'Stable', shipments: 6800 },
};

export const CARRIER_OTIF = [
  { carrier: 'UPS Ground', otifPct: 97.8, volumeSharePct: 42, trend: [97.4, 97.6, 97.8, 97.9, 97.8, 97.8], delta30Day: 0.2, contractExpiry: 'Dec 2026' },
  { carrier: 'FedEx Ground', otifPct: 96.5, volumeSharePct: 31, trend: [97.9, 97.6, 97.2, 96.9, 96.7, 96.5], delta30Day: -1.2, contractExpiry: 'Mar 2026' },
  { carrier: 'FedEx Home Delivery', otifPct: 96.1, volumeSharePct: 15, trend: [97.1, 96.8, 96.5, 96.3, 96.1, 96.1], delta30Day: -0.8, contractExpiry: 'Mar 2026' },
  { carrier: 'Self Fleet', otifPct: 98.9, volumeSharePct: 7, trend: [98.5, 98.6, 98.8, 98.9, 98.9, 98.9], delta30Day: 0.3, contractExpiry: 'N/A' },
  { carrier: 'Regional LTL', otifPct: 97.2, volumeSharePct: 3, trend: [97.0, 97.1, 97.2, 97.2, 97.3, 97.2], delta30Day: 0.0, contractExpiry: 'Jun 2026' },
  { carrier: 'USPS Priority', otifPct: 94.1, volumeSharePct: 2, trend: [94.2, 94.0, 94.1, 94.2, 94.0, 94.1], delta30Day: -0.1, contractExpiry: 'N/A' },
];
