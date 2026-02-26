import { useEffect, useRef, useState } from 'react';
import { Clock } from 'lucide-react';
import type { ScenarioType } from '../../types';

const BLUE = '#006EFF';

interface SliderDefinition {
  label: string;
  paramKey: string;
  min: number;
  max: number;
  step?: number;
  unit?: string;
}

const SCENARIO_SLIDER_CONFIG: Partial<Record<ScenarioType, SliderDefinition[]>> = {
  FCConsolidation: [
    { label: 'Volume Redirect %', paramKey: 'volumeRedirectPct', min: 0, max: 100 },
    { label: 'Labor Savings %', paramKey: 'laborSavingsPct', min: 0, max: 50 },
  ],
  CarrierShift: [
    { label: 'Shift Volume %', paramKey: 'shiftVolumePct', min: 0, max: 80 },
    { label: 'Rate Reduction %', paramKey: 'rateReduction', min: 0, max: 8, step: 0.1 },
  ],
  AutomationROI: [
    { label: 'CapEx ($M)', paramKey: 'capexMillions', min: 0, max: 10, step: 0.5, unit: 'M' },
    { label: 'Labor Reduction %', paramKey: 'laborReductionPct', min: 0, max: 60 },
  ],
  DisruptionResponse: [
    { label: 'Affected FC Count', paramKey: 'affectedFCCount', min: 1, max: 4, unit: '' },
    { label: 'Disruption Duration (days)', paramKey: 'durationDays', min: 1, max: 30, unit: ' days' },
  ],
  InventoryReposition: [
    { label: 'Inventory Reduction %', paramKey: 'inventoryReductionPct', min: 0, max: 30 },
  ],
  FCExpansion: [
    { label: 'Demand Growth %', paramKey: 'demandGrowth', min: 0, max: 20 },
    { label: 'CapEx Budget ($M)', paramKey: 'capexBudget', min: 6, max: 24, step: 0.5, unit: 'M' },
    { label: 'Hub Size (K sqft)', paramKey: 'hubSqFt', min: 30, max: 80, step: 5, unit: 'K' },
  ],
  DemandSurge: [
    { label: 'Demand Surge %', paramKey: 'demandSurgePct', min: 10, max: 50 },
    { label: 'Surge Duration (days)', paramKey: 'surgeDuration', min: 30, max: 180, unit: ' days' },
    { label: 'Volume Redirect %', paramKey: 'volumeRedirectPct', min: 0, max: 60 },
  ],
  HubSatelliteRedesign: [
    { label: 'Satellites per Hub', paramKey: 'satelliteCount', min: 3, max: 8, unit: '' },
    { label: 'Total CapEx ($M)', paramKey: 'totalCapex', min: 8, max: 25, step: 0.5, unit: 'M' },
    { label: 'Automation Enablement %', paramKey: 'automationEnablementPct', min: 0, max: 100 },
  ],
};

interface SliderRowProps {
  config: SliderDefinition;
  value: number | string;
  onChange: (value: number) => void;
}

function ScenarioSliderRow({ config, value, onChange }: SliderRowProps) {
  const unit = config.unit ?? '%';
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ color: '#94a3b8', fontSize: 12 }}>{config.label}</span>
        <span style={{ color: BLUE, fontSize: 12, fontWeight: 600 }}>
          {value ?? config.min}
          {unit}
        </span>
      </div>
      <input
        type="range"
        min={config.min}
        max={config.max}
        step={config.step ?? 1}
        value={typeof value === 'number' ? value : Number(value) || config.min}
        onChange={(event) => onChange(Number(event.target.value))}
        style={{ width: '100%', accentColor: BLUE }}
      />
    </div>
  );
}

interface ScenarioParameterSlidersProps {
  type: ScenarioType;
  params: Record<string, number | string>;
  onChange: (params: Record<string, number | string>) => void;
}

export function ScenarioParameterSliders({ type, params, onChange }: ScenarioParameterSlidersProps) {
  const [isRecalculating, setIsRecalculating] = useState(false);
  const recalcTimer = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (recalcTimer.current != null) {
        window.clearTimeout(recalcTimer.current);
      }
    },
    []
  );

  const updateParam = (key: string, value: number) => {
    onChange({ ...params, [key]: value });
    setIsRecalculating(true);
    if (recalcTimer.current != null) {
      window.clearTimeout(recalcTimer.current);
    }
    recalcTimer.current = window.setTimeout(() => {
      setIsRecalculating(false);
      recalcTimer.current = null;
    }, 520);
  };

  const sliders = SCENARIO_SLIDER_CONFIG[type] ?? [];
  if (sliders.length === 0) return null;

  return (
    <>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          marginBottom: 12,
          fontSize: 11,
          color: isRecalculating ? '#00C2A8' : '#64748b',
          transition: 'color 0.2s ease',
        }}
      >
        <Clock size={12} />
        {isRecalculating ? 'Recalculating scenario sensitivity...' : 'Adjust sliders to preview sensitivity impact.'}
      </div>
      {sliders.map((slider) => (
        <ScenarioSliderRow
          key={`${type}-${slider.paramKey}`}
          config={slider}
          value={params[slider.paramKey] ?? slider.min}
          onChange={(value) => updateParam(slider.paramKey, value)}
        />
      ))}
    </>
  );
}
