import { AlertTriangle, Zap, GitBranch, CheckCircle, XCircle, Info , X} from 'lucide-react';
import { useAppStore } from '../zustand/UseAppstore.js';
import {useState , useEffect} from 'react'

const ALERT_CONFIG = {
  node_down: { icon: XCircle, color: '#ef4444', bg: '#ef444415' },
  node_recovered: { icon: CheckCircle, color: '#22c55e', bg: '#22c55e15' },
  spike: { icon: Zap, color: '#f59e0b', bg: '#f59e0b15' },
  partition: { icon: GitBranch, color: '#a78bfa', bg: '#a78bfa15' },
  healed: { icon: CheckCircle, color: '#22c55e', bg: '#22c55e15' },
  error: { icon: AlertTriangle, color: '#ef4444', bg: '#ef444415' },
  default: { icon: Info, color: '#6b8cff', bg: '#6b8cff15' },
};

// Auto-dismiss duration in ms (longer for partition/kill since they matter)
const DISMISS_DELAY = {
  node_down: 6000,
  partition: 6000,
  default:   4000,
};
 
function Toast({ alert, onDismiss }) {
  const [visible, setVisible] = useState(false);   // controls slide-in
  const [leaving, setLeaving] = useState(false);   // controls slide-out
 
  const cfg = ALERT_CONFIG[alert.type] || ALERT_CONFIG.default;
  const Icon = cfg.icon;
  const delay = DISMISS_DELAY[alert.type] ?? DISMISS_DELAY.default;
 
  // Slide in on mount
  useEffect(() => {
    const t = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(t);
  }, []);
 

  const startLeave = () => {
    setLeaving(true);
    // Wait for CSS transition to finish before removing from DOM
    setTimeout(() => onDismiss(alert.id), 350);
  };
 
  // Auto-dismiss after delay
  useEffect(() => {
    const timer = setTimeout(() => startLeave(), delay);
    return () => clearTimeout(timer);
  }, [delay]);
 
  return (
    <div
      onClick={() => startLeave()}
      title="Click to dismiss"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '10px 14px',
        borderRadius: 12,
        fontSize: 12,
        fontWeight: 500,
        cursor: 'pointer',
        userSelect: 'none',
        background: cfg.bg,
        border: `1px solid ${cfg.color}30`,
        color: cfg.color,
        backdropFilter: 'blur(8px)',
        boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
        maxWidth: 380,
        width: '100%',
        // Slide + fade transition
        transform: visible && !leaving ? 'translateY(0)' : 'translateY(16px)',
        opacity: visible && !leaving ? 1 : 0,
        transition: 'transform 0.3s cubic-bezier(0.34,1.56,0.64,1), opacity 0.3s ease',
        pointerEvents: leaving ? 'none' : 'auto',
        // Shrink height on leave so remaining toasts slide up
        maxHeight: leaving ? 0 : 60,
        marginBottom: leaving ? 0 : undefined,
        overflow: 'hidden',
      }}
    >
      <Icon size={13} style={{ flexShrink: 0 }} />
      <span style={{ flex: 1 }}>{alert.message}</span>
 
      {/* Progress bar */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          height: 2,
          borderRadius: '0 0 12px 12px',
          background: cfg.color,
          opacity: 0.5,
          width: '100%',
          transformOrigin: 'left',
          animation: `shrink ${delay}ms linear forwards`,
        }}
      />
 
      <X size={11} style={{ flexShrink: 0, opacity: 0.5 }} />
    </div>
  );
}
 
export default function AlertsToast() {
  const { alerts, removeAlert } = useAppStore();
 
  if (!alerts.length) return null;
 
  return (
    <>
      <style>{`
        @keyframes shrink {
          from { transform: scaleX(1); }
          to   { transform: scaleX(0); }
        }
      `}</style>
 
      <div
        style={{
          position: 'fixed',
          bottom: 16,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 50,
          display: 'flex',
          flexDirection: 'column-reverse',
          gap: 8,
          alignItems: 'center',
          width: '100%',
          maxWidth: 400,
          padding: '0 16px',
          pointerEvents: 'none',
        }}
      >
        {alerts.slice(0, 5).map((alert) => (
          <div key={alert.id} style={{ width: '100%', pointerEvents: 'auto', position: 'relative' }}>
            <Toast alert={alert} onDismiss={removeAlert} />
          </div>
        ))}
      </div>
    </>
  );
}