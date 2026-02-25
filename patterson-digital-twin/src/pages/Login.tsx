import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, ArrowRight, AlertCircle } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { DEMO_CREDENTIALS } from '../utils/constants';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    await new Promise(r => setTimeout(r, 800)); // simulate auth
    const success = login(email, password);
    if (success) {
      navigate('/app/dashboard');
    } else {
      setError('Invalid credentials. Use the demo credentials below.');
    }
    setLoading(false);
  };

  const fillDemo = () => {
    setEmail(DEMO_CREDENTIALS.email);
    setPassword(DEMO_CREDENTIALS.password);
    setError('');
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex',
      background: '#0A1628', fontFamily: 'Inter, sans-serif',
    }}>
      {/* Left panel — animated network visual */}
      <div style={{
        flex: 1, position: 'relative', overflow: 'hidden',
        background: 'linear-gradient(135deg, #0d1e35 0%, #0A1628 100%)',
        borderRight: '1px solid #2e4168',
        display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
        padding: 48,
      }}>
        {/* Grid pattern */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: `linear-gradient(rgba(46,65,104,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(46,65,104,0.3) 1px, transparent 1px)`,
          backgroundSize: '48px 48px',
        }} />

        {/* Animated network nodes */}
        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
          {[
            { top: '20%', left: '25%', color: '#006EFF', size: 16 },
            { top: '35%', left: '55%', color: '#00C2A8', size: 12 },
            { top: '55%', left: '30%', color: '#006EFF', size: 10 },
            { top: '70%', left: '65%', color: '#00C2A8', size: 14 },
            { top: '25%', left: '75%', color: '#9333ea', size: 8 },
            { top: '60%', left: '80%', color: '#006EFF', size: 10 },
          ].map((dot, i) => (
            <div key={i} style={{
              position: 'absolute', top: dot.top, left: dot.left,
              width: dot.size, height: dot.size, borderRadius: '50%',
              background: dot.color, opacity: 0.7,
              animation: `pulse 2s ${i * 0.4}s ease-in-out infinite alternate`,
            }} />
          ))}

          {/* Connection lines SVG */}
          <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.2 }}>
            <line x1="25%" y1="20%" x2="55%" y2="35%" stroke="#006EFF" strokeWidth="1" strokeDasharray="4 4" />
            <line x1="55%" y1="35%" x2="30%" y2="55%" stroke="#00C2A8" strokeWidth="1" strokeDasharray="4 4" />
            <line x1="30%" y1="55%" x2="65%" y2="70%" stroke="#006EFF" strokeWidth="1" strokeDasharray="4 4" />
            <line x1="75%" y1="25%" x2="55%" y2="35%" stroke="#9333ea" strokeWidth="1" strokeDasharray="4 4" />
            <line x1="65%" y1="70%" x2="80%" y2="60%" stroke="#00C2A8" strokeWidth="1" strokeDasharray="4 4" />
          </svg>
        </div>

        {/* Content */}
        <div style={{ position: 'relative', textAlign: 'center', maxWidth: 400 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 14, margin: '0 auto 24px',
            background: 'linear-gradient(135deg, #006EFF, #00C2A8)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 22, fontWeight: 900,
          }}>PN</div>

          <h2 style={{ fontSize: 32, fontWeight: 900, margin: '0 0 12px', lineHeight: 1.1 }}>
            Patterson Network<br />Intelligence Platform
          </h2>
          <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.6, margin: '0 0 32px' }}>
            Digital Twin Decision Engine · Powered by SupplyIQ
          </p>

          {/* Stat pills */}
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
            {[
              ['13 FCs Modeled', '#006EFF'],
              ['97.2% OTIF', '#00C2A8'],
              ['$847M Network', '#9333ea'],
              ['8 Scenarios', '#f59e0b'],
            ].map(([label, color]) => (
              <div key={label as string} style={{
                background: `${color as string}15`,
                border: `1px solid ${color as string}30`,
                borderRadius: 20, padding: '5px 12px',
                fontSize: 11, color: color as string, fontWeight: 600,
              }}>
                {label as string}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel — login form */}
      <div style={{
        width: 460, flexShrink: 0,
        display: 'flex', flexDirection: 'column',
        justifyContent: 'center', padding: '48px 48px',
      }}>
        <div style={{ marginBottom: 40 }}>
          <h1 style={{ fontSize: 26, fontWeight: 800, margin: '0 0 8px', color: 'white' }}>Welcome back</h1>
          <p style={{ fontSize: 14, color: '#64748b', margin: 0 }}>Sign in to your network intelligence platform</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Email */}
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#94a3b8', marginBottom: 6 }}>
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="demo@patterson.com"
              required
              style={{
                width: '100%', padding: '11px 14px',
                background: '#1a2840', border: `1px solid ${error ? '#ef4444' : '#2e4168'}`,
                borderRadius: 8, color: 'white', fontSize: 14,
                outline: 'none', boxSizing: 'border-box',
                transition: 'border-color 0.2s',
              }}
              onFocus={e => (e.target as HTMLInputElement).style.borderColor = '#006EFF'}
              onBlur={e => (e.target as HTMLInputElement).style.borderColor = error ? '#ef4444' : '#2e4168'}
            />
          </div>

          {/* Password */}
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#94a3b8', marginBottom: 6 }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPw ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                style={{
                  width: '100%', padding: '11px 42px 11px 14px',
                  background: '#1a2840', border: `1px solid ${error ? '#ef4444' : '#2e4168'}`,
                  borderRadius: 8, color: 'white', fontSize: 14,
                  outline: 'none', boxSizing: 'border-box',
                  transition: 'border-color 0.2s',
                }}
                onFocus={e => (e.target as HTMLInputElement).style.borderColor = '#006EFF'}
                onBlur={e => (e.target as HTMLInputElement).style.borderColor = error ? '#ef4444' : '#2e4168'}
              />
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                style={{
                  position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer', color: '#475569', padding: 0,
                }}
              >
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
              borderRadius: 8, padding: '10px 12px',
            }}>
              <AlertCircle size={14} color="#ef4444" />
              <span style={{ fontSize: 12, color: '#ef4444' }}>{error}</span>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            style={{
              background: loading ? '#1a2840' : 'linear-gradient(135deg, #006EFF, #0052CC)',
              border: 'none', borderRadius: 8, color: 'white',
              padding: '13px 20px', cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: 14, fontWeight: 700, marginTop: 4,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              transition: 'all 0.2s',
            }}
          >
            {loading ? (
              <>
                <div style={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid #64748b', borderTopColor: 'white', animation: 'spin 0.8s linear infinite' }} />
                Authenticating...
              </>
            ) : (
              <>Sign In <ArrowRight size={16} /></>
            )}
          </button>
        </form>

        {/* Demo credentials */}
        <div style={{
          marginTop: 24, padding: '16px 18px',
          background: 'rgba(0,194,168,0.06)', border: '1px solid rgba(0,194,168,0.15)',
          borderRadius: 10,
        }}>
          <p style={{ margin: '0 0 8px', fontSize: 11, color: '#00C2A8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Demo Access
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
              <span style={{ color: '#64748b' }}>Email:</span>
              <span style={{ fontFamily: 'monospace', color: '#94a3b8' }}>demo@patterson.com</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
              <span style={{ color: '#64748b' }}>Password:</span>
              <span style={{ fontFamily: 'monospace', color: '#94a3b8' }}>Patterson2024!</span>
            </div>
          </div>
          <button
            onClick={fillDemo}
            style={{
              marginTop: 10, width: '100%',
              background: 'rgba(0,194,168,0.1)', border: '1px solid rgba(0,194,168,0.2)',
              borderRadius: 6, color: '#00C2A8', padding: '7px 14px',
              cursor: 'pointer', fontSize: 12, fontWeight: 600,
            }}
          >
            Fill Demo Credentials
          </button>
        </div>

        <p style={{ textAlign: 'center', marginTop: 24, fontSize: 11, color: '#2e4168' }}>
          Confidential · Patterson Companies · Evaluation Platform · FY2026
        </p>
      </div>

      <style>{`
        @keyframes pulse { from { transform: scale(1); } to { transform: scale(1.3); } }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
