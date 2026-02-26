import { useNavigate } from 'react-router-dom';
import { ArrowRight, CheckCircle, BarChart2, Network, Brain, Shield, Zap, Globe, TrendingDown, Activity } from 'lucide-react';
import { useDemoStore } from '../store/demoStore';
import { useDemoStageBindings } from '../hooks/useDemoStageBindings';
import { useShallow } from 'zustand/react/shallow';
import { DEMO_CREDENTIALS } from '../utils/constants';

const FEATURES = [
  { icon: Network, title: 'Network Modeling', desc: 'Model FCs, hubs, satellites, cross-docks, and all transportation lanes with real-world constraints and costs.' },
  { icon: BarChart2, title: 'What-If Scenarios', desc: 'Run consolidation, expansion, carrier shifts, and disruption scenarios with MILP optimization in minutes.' },
  { icon: Brain, title: 'SupplyIQ Engine', desc: 'AI-powered recommendations with full reasoning traces, ranked by NPV and implementation complexity.' },
  { icon: TrendingDown, title: 'Cost-to-Serve', desc: 'Lane, customer, and order-level cost decomposition with actionable savings identification.' },
  { icon: Activity, title: 'OTIF & Service', desc: 'Simulate delivery windows, optimize fulfillment node selection, and model carrier performance.' },
  { icon: Shield, title: 'Enterprise Security', desc: 'RBAC, SSO, scenario versioning, full audit trails, and Azure AD integration.' },
];

const STATS = [
  { value: '$847M', label: 'Network Cost Modeled' },
  { value: '13 FCs', label: 'Fulfillment Centers' },
  { value: '97.2%', label: 'OTIF Performance' },
  { value: '8', label: 'Scenario Types' },
];

const TECH_STACK = ['SAP EWM', 'SAP ERP', 'Azure Integration Services', 'UPS · FedEx · Self Fleet', 'Informatica IDMC', 'Microsoft Azure AD'];

export default function Landing() {
  const navigate = useNavigate();
  const { isActive, runState, startDemo, resumeDemo, restartDemo } = useDemoStore(
    useShallow((state) => ({
      isActive: state.isActive,
      runState: state.runState,
      startDemo: state.startDemo,
      resumeDemo: state.resumeDemo,
      restartDemo: state.restartDemo,
    }))
  );

  function handleDemoStart() {
    if (!isActive) {
      if (runState === 'paused') {
        resumeDemo();
        return;
      }
      startDemo();
      return;
    }
    if (runState === 'completed') {
      restartDemo();
      return;
    }
    resumeDemo();
  }

  const demoLabel = !isActive
    ? (runState === 'paused' ? 'Resume Demo' : 'Start Demo')
    : runState === 'completed'
      ? 'Restart Demo'
      : 'Resume Demo';
  useDemoStageBindings('/');

  return (
    <div style={{ background: '#0A1628', minHeight: '100vh', color: 'white', fontFamily: 'Inter, sans-serif' }}>
      {/* Nav */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        background: 'rgba(10, 22, 40, 0.9)', backdropFilter: 'blur(12px)',
        borderBottom: '1px solid #2e4168',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 48px', height: 64,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 8,
            background: 'linear-gradient(135deg, #006EFF, #00C2A8)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 14, fontWeight: 800,
          }}>PN</div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, lineHeight: 1.2 }}>Patterson Network Intelligence</div>
            <div style={{ fontSize: 10, color: '#00C2A8' }}>Digital Twin Decision Engine</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={handleDemoStart}
            style={{ background: 'rgba(0,194,168,0.12)', border: '1px solid rgba(0,194,168,0.32)', borderRadius: 8, color: '#00C2A8', padding: '8px 20px', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}
          >
            {demoLabel}
          </button>
          <button
            onClick={() => navigate('/login')}
            style={{ background: 'transparent', border: '1px solid #2e4168', borderRadius: 8, color: '#94a3b8', padding: '8px 20px', cursor: 'pointer', fontSize: 13 }}
          >
            Sign In
          </button>
          <button
            onClick={() => navigate('/login')}
            style={{ background: '#006EFF', border: 'none', borderRadius: 8, color: 'white', padding: '8px 20px', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}
          >
            View Demo →
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section style={{
        paddingTop: 160, paddingBottom: 100, textAlign: 'center',
        background: 'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(0,110,255,0.15) 0%, transparent 70%)',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* Grid background */}
        <div style={{
          position: 'absolute', inset: 0, opacity: 0.15,
          backgroundImage: `linear-gradient(rgba(46,65,104,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(46,65,104,0.5) 1px, transparent 1px)`,
          backgroundSize: '40px 40px',
        }} />

        <div style={{ position: 'relative', maxWidth: 860, margin: '0 auto', padding: '0 24px' }}>
          {/* Badge */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'rgba(0,110,255,0.1)', border: '1px solid rgba(0,110,255,0.3)',
            borderRadius: 20, padding: '6px 16px', marginBottom: 32,
          }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#00C2A8' }} />
            <span style={{ fontSize: 12, color: '#00C2A8', fontWeight: 600 }}>PATTERSON COMPANIES · SUPPLY CHAIN INTELLIGENCE</span>
          </div>

          <h1 style={{
            fontSize: 'clamp(36px, 6vw, 68px)', fontWeight: 900,
            lineHeight: 1.05, margin: '0 0 24px',
            background: 'linear-gradient(135deg, #ffffff 0%, #94a3b8 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>
            The Digital Twin for<br />
            <span style={{
              background: 'linear-gradient(90deg, #006EFF, #00C2A8)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>
              Distribution Excellence
            </span>
          </h1>

          <p style={{ fontSize: 18, color: '#94a3b8', lineHeight: 1.6, margin: '0 auto 40px', maxWidth: 600 }}>
            Model, simulate, and optimize your fulfillment center network. Turn supply chain complexity into competitive advantage.
          </p>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              data-demo-anchor="demo-landing-start"
              onClick={handleDemoStart}
              style={{
                background: 'linear-gradient(135deg, #006EFF, #0052CC)',
                border: 'none', borderRadius: 10,
                color: 'white', padding: '14px 32px',
                cursor: 'pointer', fontSize: 15, fontWeight: 700,
                display: 'flex', alignItems: 'center', gap: 8,
                boxShadow: '0 0 30px rgba(0,110,255,0.3)',
              }}
            >
              {demoLabel} <ArrowRight size={18} />
            </button>
            <button
              onClick={() => navigate('/login')}
              style={{
                background: 'transparent',
                border: '1px solid #2e4168',
                borderRadius: 10, color: '#94a3b8',
                padding: '14px 32px', cursor: 'pointer', fontSize: 15,
              }}
            >
              Sign In to View Network Map
            </button>
          </div>

          {/* Demo credentials hint */}
          <p style={{ marginTop: 16, fontSize: 12, color: '#475569' }}>
            Demo access: <span style={{ color: '#00C2A8', fontFamily: 'monospace' }}>{DEMO_CREDENTIALS.email}</span> · <span style={{ color: '#00C2A8', fontFamily: 'monospace' }}>{DEMO_CREDENTIALS.password}</span>
          </p>
        </div>
      </section>

      {/* Stats band */}
      <section style={{
        background: 'rgba(26,40,64,0.5)',
        borderTop: '1px solid #2e4168', borderBottom: '1px solid #2e4168',
        padding: '32px 48px',
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 32 }}>
          {STATS.map(s => (
            <div key={s.value} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 36, fontWeight: 900, color: 'white', letterSpacing: '-0.02em' }}>{s.value}</div>
              <div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section style={{ padding: '80px 48px', maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <h2 style={{ fontSize: 40, fontWeight: 800, margin: '0 0 16px' }}>
            Every Capability You Need to<br />
            <span style={{ color: '#006EFF' }}>Optimize Your Network</span>
          </h2>
          <p style={{ fontSize: 16, color: '#94a3b8', maxWidth: 560, margin: '0 auto' }}>
            Built for healthcare distribution. Calibrated to your network. Ready for executive decision-making.
          </p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
          {FEATURES.map(({ icon: Icon, title, desc }) => (
            <div key={title} style={{
              background: 'rgba(26,40,64,0.6)', border: '1px solid #2e4168',
              borderRadius: 14, padding: 28,
              transition: 'border-color 0.2s',
            }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = '#006EFF44'}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = '#2e4168'}
            >
              <div style={{
                width: 44, height: 44, borderRadius: 10, marginBottom: 16,
                background: 'rgba(0,110,255,0.12)', border: '1px solid rgba(0,110,255,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Icon size={22} color="#006EFF" />
              </div>
              <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 8px', color: 'white' }}>{title}</h3>
              <p style={{ fontSize: 13, color: '#64748b', lineHeight: 1.6, margin: 0 }}>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Tech stack */}
      <section style={{
        padding: '48px 48px',
        background: 'rgba(13,30,53,0.6)',
        borderTop: '1px solid #2e4168', borderBottom: '1px solid #2e4168',
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <p style={{ textAlign: 'center', fontSize: 12, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 24 }}>
            BUILT FOR YOUR EXISTING STACK
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            {TECH_STACK.map(t => (
              <div key={t} style={{
                background: '#1a2840', border: '1px solid #2e4168',
                borderRadius: 8, padding: '8px 16px',
                fontSize: 12, fontWeight: 600, color: '#94a3b8',
              }}>
                {t}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Value props */}
      <section style={{ padding: '80px 48px', maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 60, alignItems: 'center' }}>
          <div>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: 'rgba(0,194,168,0.1)', border: '1px solid rgba(0,194,168,0.2)',
              borderRadius: 20, padding: '4px 12px', marginBottom: 20, fontSize: 11, color: '#00C2A8', fontWeight: 600,
            }}>
              <Zap size={12} /> WHY DIGITAL TWIN
            </div>
            <h2 style={{ fontSize: 34, fontWeight: 800, margin: '0 0 20px', lineHeight: 1.2 }}>
              Stop Guessing.<br />Start Optimizing.
            </h2>
            <p style={{ fontSize: 15, color: '#64748b', lineHeight: 1.7, marginBottom: 28 }}>
              Patterson operates a $6.57B healthcare distribution network with 13 fulfillment centers and 187,400 daily orders.
              Every network decision — consolidation, automation investment, carrier shifts — carries millions in cost and service-level risk.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                '$17.9M in identified savings opportunities ready to model',
                'OTIF simulated before a single carrier contract changes',
                'FC consolidation payback in 14 months — with full audit trail',
                'AI-generated playbooks for disruption events in seconds',
              ].map(item => (
                <div key={item} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <CheckCircle size={16} color="#00C2A8" style={{ flexShrink: 0, marginTop: 2 }} />
                  <span style={{ fontSize: 14, color: '#94a3b8', lineHeight: 1.5 }}>{item}</span>
                </div>
              ))}
            </div>
          </div>
          <div style={{
            background: 'rgba(26,40,64,0.6)', border: '1px solid #2e4168',
            borderRadius: 16, padding: 32, position: 'relative', overflow: 'hidden',
          }}>
            {/* Decorative glow */}
            <div style={{
              position: 'absolute', top: -40, right: -40,
              width: 200, height: 200, borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(0,110,255,0.15) 0%, transparent 70%)',
              pointerEvents: 'none',
            }} />
            <div style={{ fontSize: 12, color: '#64748b', marginBottom: 20, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              NETWORK AT A GLANCE
            </div>
            {[
              { label: 'Network OTIF', value: '97.2%', color: '#00C2A8', pct: 97.2 },
              { label: 'FC Utilization', value: '78%', color: '#006EFF', pct: 78 },
              { label: 'Next-Day Coverage', value: '91%', color: '#9333ea', pct: 91 },
              { label: 'Fill Rate', value: '99.1%', color: '#10b981', pct: 99.1 },
            ].map(({ label, value, color, pct }) => (
              <div key={label} style={{ marginBottom: 18 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 12, color: '#94a3b8' }}>{label}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'white' }}>{value}</span>
                </div>
                <div style={{ height: 4, background: '#2e4168', borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 2, transition: 'width 1s ease' }} />
                </div>
              </div>
            ))}
            <div style={{ marginTop: 24, padding: '12px 16px', background: 'rgba(0,110,255,0.1)', border: '1px solid rgba(0,110,255,0.2)', borderRadius: 8 }}>
              <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4 }}>SupplyIQ Insight</div>
              <div style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.5 }}>
                "3 priority scenarios identified. Combined savings: <strong style={{ color: '#00C2A8' }}>$17.9M annually</strong> with avg 9-month payback."
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{
        textAlign: 'center', padding: '80px 48px',
        background: 'linear-gradient(180deg, transparent, rgba(0,110,255,0.05))',
        borderTop: '1px solid #2e4168',
      }}>
        <h2 style={{ fontSize: 40, fontWeight: 800, margin: '0 0 16px' }}>Ready to See Your Network?</h2>
        <p style={{ fontSize: 16, color: '#94a3b8', margin: '0 auto 40px', maxWidth: 480 }}>
          Access the full Patterson Digital Twin platform with live synthetic network data, 8 pre-built scenarios, and SupplyIQ intelligence.
        </p>
        <button
          onClick={() => navigate('/login')}
          style={{
            background: 'linear-gradient(135deg, #006EFF, #00C2A8)',
            border: 'none', borderRadius: 12, color: 'white',
            padding: '16px 48px', cursor: 'pointer', fontSize: 16, fontWeight: 700,
            display: 'inline-flex', alignItems: 'center', gap: 10,
            boxShadow: '0 0 40px rgba(0,110,255,0.2)',
          }}
        >
          Launch Platform Demo <ArrowRight size={20} />
        </button>
        <p style={{ marginTop: 16, fontSize: 12, color: '#475569' }}>
          {DEMO_CREDENTIALS.email} · {DEMO_CREDENTIALS.password}
        </p>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid #2e4168', padding: '24px 48px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Globe size={14} color="#475569" />
          <span style={{ fontSize: 12, color: '#475569' }}>Patterson Network Intelligence Platform · Digital Twin Demo · FY2026</span>
        </div>
        <span style={{ fontSize: 12, color: '#475569' }}>Confidential — For Evaluation Purposes Only</span>
      </footer>
    </div>
  );
}
