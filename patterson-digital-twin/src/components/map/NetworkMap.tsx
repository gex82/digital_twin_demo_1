import { Fragment, useEffect, useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Polyline, Popup, Circle, ZoomControl } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { PRIMARY_FACILITIES, REGIONAL_HUBS } from '../../data/facilities';
import type { Facility } from '../../types';
import { useUiStore } from '../../store/uiStore';

interface NetworkMapProps {
  height?: number | string;
  showCoverage?: boolean;
  showFlows?: boolean;
  selectedFacilityId?: string;
  onFacilityClick?: (facility: Facility) => void;
}

// Synthetic lane connections (FC to nearby FCs)
const LANE_CONNECTIONS = [
  { from: 'FC-ELG-001', to: 'FC-COL-002', volume: 450, mode: 'Parcel' },
  { from: 'FC-ELG-001', to: 'FC-MSP-008', volume: 280, mode: 'Parcel' },
  { from: 'FC-COL-002', to: 'FC-HBG-003', volume: 380, mode: 'Parcel' },
  { from: 'FC-HBG-003', to: 'FC-GSO-004', volume: 320, mode: 'Parcel' },
  { from: 'FC-GSO-004', to: 'FC-BSM-005', volume: 210, mode: 'Parcel' },
  { from: 'FC-DAL-006', to: 'FC-OKC-007', volume: 190, mode: 'Parcel' },
  { from: 'FC-DAL-006', to: 'FC-GRV-012', volume: 160, mode: 'SelfFleet' },
  { from: 'FC-RNO-009', to: 'FC-SAC-010', volume: 240, mode: 'Parcel' },
  { from: 'FC-SAC-010', to: 'FC-PHX-011', volume: 180, mode: 'LTL' },
  { from: 'FC-ELG-001', to: 'FC-DAL-006', volume: 120, mode: 'LTL' },
  { from: 'FC-HBG-003', to: 'FC-MIL-013', volume: 140, mode: 'Parcel' },
];

const MODE_COLORS: Record<string, string> = {
  Parcel: '#006EFF',
  LTL: '#00C2A8',
  TL: '#9333ea',
  SelfFleet: '#f59e0b',
};

const SEGMENT_COLORS: Record<string, string> = {
  Shared: '#006EFF',
  Dental: '#3389FF',
  AnimalHealth: '#00C2A8',
};

function getRadius(facility: Facility): number {
  if (facility.type === 'FC') return 10;
  if (facility.type === 'Hub') return 7;
  return 5;
}

export function NetworkMap({ height = 500, showCoverage = false, showFlows = true, selectedFacilityId, onFacilityClick }: NetworkMapProps) {
  const [visibleFCs, setVisibleFCs] = useState<string[]>([]);
  const commandCenterMode = useUiStore((state) => state.commandCenterMode);

  useEffect(() => {
    const timers: number[] = [];
    // Staggered animation for FC markers appearing
    PRIMARY_FACILITIES.forEach((fc, i) => {
      const timer = window.setTimeout(() => {
        setVisibleFCs(prev => [...prev, fc.id]);
      }, i * 120 + 200);
      timers.push(timer);
    });
    return () => {
      for (const timer of timers) {
        window.clearTimeout(timer);
      }
    };
  }, []);

  const allFacilities = [...PRIMARY_FACILITIES, ...REGIONAL_HUBS];

  return (
    <MapContainer
      center={[39.5, -96]}
      zoom={4}
      style={{ height, width: '100%', borderRadius: 12 }}
      zoomControl={false}
    >
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
      />
      <ZoomControl position="bottomright" />

      {/* Coverage zones */}
      {showCoverage && PRIMARY_FACILITIES.map(fc => (
        <Circle
          key={`cov-${fc.id}`}
          center={fc.coordinates}
          radius={fc.nextDayCoverageRadius * 1609.34 * 0.6}
          pathOptions={{
            color: SEGMENT_COLORS[fc.segment],
            fillColor: SEGMENT_COLORS[fc.segment],
            fillOpacity: 0.04,
            weight: 0.8,
            opacity: 0.3,
          }}
        />
      ))}

      {/* Lane connections */}
      {showFlows && LANE_CONNECTIONS.map(lane => {
        const fromFc = allFacilities.find(f => f.id === lane.from);
        const toFc = allFacilities.find(f => f.id === lane.to);
        if (!fromFc || !toFc) return null;
        const laneModeClass = `lane-mode-${lane.mode.toLowerCase().replace(/\s+/g, '')}`;
        return (
          <Polyline
            key={`${lane.from}-${lane.to}`}
            positions={[fromFc.coordinates, toFc.coordinates]}
            pathOptions={{
              color: MODE_COLORS[lane.mode] || '#2e4168',
              weight: Math.max(1.5, lane.volume / 120),
              opacity: 0.5,
              className: `${commandCenterMode ? 'lane-flow ' : ''}${laneModeClass}`.trim(),
            }}
          />
        );
      })}

      {/* FC Markers */}
      {PRIMARY_FACILITIES.map(fc => {
        const isVisible = visibleFCs.includes(fc.id);
        const isSelected = selectedFacilityId === fc.id;
        const color = SEGMENT_COLORS[fc.segment];
        const utilizationRatio = fc.currentDailyOrders / Math.max(fc.dailyOrderCapacity, 1);
        return (
          <Fragment key={fc.id}>
            {commandCenterMode && isVisible && utilizationRatio >= 0.75 && (
              <CircleMarker
                key={`${fc.id}-pulse`}
                center={fc.coordinates}
                radius={getRadius(fc) + 7}
                pathOptions={{
                  color,
                  opacity: 0.6,
                  weight: 1,
                  fillOpacity: 0,
                  className: 'fc-live-pulse',
                }}
                interactive={false}
              />
            )}
            <CircleMarker
              key={fc.id}
              center={fc.coordinates}
              radius={isVisible ? (isSelected ? getRadius(fc) + 4 : getRadius(fc)) : 0}
              pathOptions={{
                color: isSelected ? '#ffffff' : color,
                fillColor: color,
                fillOpacity: isVisible ? 0.9 : 0,
                weight: isSelected ? 3 : 2,
                opacity: isVisible ? 1 : 0,
              }}
              eventHandlers={{ click: () => onFacilityClick?.(fc) }}
            >
              <Popup>
                <div style={{ minWidth: 200 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{fc.name}</div>
                  <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 8 }}>{fc.type} · {fc.segment} · {fc.ownership}</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 16px' }}>
                    {[
                      ['Utilization', `${(fc.utilizationPct * 100).toFixed(0)}%`],
                      ['Daily Orders', `${(fc.currentDailyOrders / 1000).toFixed(1)}K`],
                      ['OTIF', `${(fc.otifPct * 100).toFixed(1)}%`],
                      ['SKUs', `${(fc.skuCount / 1000).toFixed(0)}K`],
                      ['Sq Ft', `${(fc.squareFootage / 1000).toFixed(0)}K`],
                      ['Employees', `${fc.employeeCount}`],
                    ].map(([k, v]) => (
                      <div key={k}>
                        <span style={{ fontSize: 9, color: '#64748b', display: 'block' }}>{k}</span>
                        <span style={{ fontSize: 12, fontWeight: 600, color: 'white' }}>{v}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </Popup>
            </CircleMarker>
          </Fragment>
        );
      })}

      {/* Hub markers */}
      {REGIONAL_HUBS.map(hub => (
        <CircleMarker
          key={hub.id}
          center={hub.coordinates}
          radius={6}
          pathOptions={{ color: '#9333ea', fillColor: '#9333ea', fillOpacity: 0.7, weight: 1.5, opacity: 0.8 }}
        >
          <Popup>
            <div>
              <div style={{ fontWeight: 600, fontSize: 13 }}>{hub.name}</div>
              <div style={{ fontSize: 11, color: '#94a3b8' }}>Regional Hub · {hub.ownership}</div>
            </div>
          </Popup>
        </CircleMarker>
      ))}
    </MapContainer>
  );
}
