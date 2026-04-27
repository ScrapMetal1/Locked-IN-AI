import { useState, useEffect } from 'react';
import type { UserState, Todo } from "./types";
import { onAuthStateChanged, type User } from 'firebase/auth';
import { signIn, signOut, auth, db } from './services/auth';
import { doc, getDoc } from 'firebase/firestore';
import './index.css';
import { startSession, getSession, endSession, getBlocklist, setBlocklist, getAllowlist, setAllowlist } from './services/storage';

// ─── NAMING CONVENTION ────────────────────────────────────────────────────────
// Variables ending in _ui   → React state (only exists in memory while popup is open)
// Variables ending in _text → raw text the user is typing (not yet saved)
// Functions from storage.ts → read/write to chrome.storage (persistent, background can read it)
// ─────────────────────────────────────────────────────────────────────────────

function App() {

  // --- React UI State (in-memory, popup only) ---
  const [loggedInUser_ui, setLoggedInUser_ui] = useState<User | null>(null); // User or null type allowed, initial default to null. 
  const [isLoading_ui, setIsLoading_ui] = useState(true);
  const [authError_ui, setAuthError_ui] = useState<string | null>(null);
  const [session_ui, setSession_ui] = useState<UserState | null>(null); // mirrors what's in chrome.storage for the UI
  const [goalDraft_text, setGoalDraft_text] = useState(""); // what the user is currently typing
  const [duration_min, setDuration_min] = useState(25); 
  const [timeLeft_ui, setTimeLeft_ui] = useState<string | null>(null);
  const [todos_ui, setTodos_ui] = useState<Todo[]>([]); 
  const [showSettings_ui, setShowSettings_ui] = useState(false);
  const [blocklist_ui, setBlocklist_ui] = useState<string[]>([]);
  const [allowlist_ui, setAllowlist_ui] = useState<string[]>([]);
  const [urlInput_text, setUrlInput_text] = useState("");

  // --- Effect 1: Watch Firebase for login/logout ---
  // runs once on mount. firebase tells us when the user logs in or out.
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setLoggedInUser_ui(u);       // update the ui
      setIsLoading_ui(false);      // done loading
    });
    return () => unsubscribe(); // clean up the listener when popup closes
  }, []);

  // --- Effect 2: Load session from chrome.storage when user logs in/out ---
  // runs every time loggedInUser_ui changes
  useEffect(() => {
    if (loggedInUser_ui) {
      // user just logged in → read their saved session from chrome.storage and show it in the ui
      getSession().then(setSession_ui);
    } else {
      // user just logged out → clear the session from the ui
      // using a timeout to avoid synchronous setState inside an effect
      setTimeout(() => setSession_ui(null), 0);
    }
  }, [loggedInUser_ui]);

  useEffect(() => {
      if (loggedInUser_ui) {
          const fetchTodos = async () => {
            const userDocRef = doc(db, 'users', loggedInUser_ui.uid);
            const docSnap = await getDoc(userDocRef);
            const allTodos = docSnap.data()?.todos || [];
            setTodos_ui(allTodos.filter((t: Todo) => !t.completed));
          }
          fetchTodos();
        } else {
          setTodos_ui([]);
        }
  }, [loggedInUser_ui]);
  
  
  useEffect(() => {
    if (!session_ui?.isLockedIn || !session_ui?.sessionEndTime) {
      setTimeLeft_ui(null);
      return;
    }

    const updateTimer = () => {
      const now = Date.now();
      const difference = session_ui.sessionEndTime! - now;
      
      if (difference <= 0) {
        setTimeLeft_ui("00:00");
        endSession().then(() => getSession().then(setSession_ui));
        return true; // signal to clear interval
      } else {
        const m = Math.floor((difference / 1000 / 60) % 60);
        const s = Math.floor((difference / 1000) % 60);
        setTimeLeft_ui(`${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`);
        return false;
      }
    };

      // Call immediately to avoid 1-second buffer delay
      const shouldStop = updateTimer();
      if (shouldStop) return;

      const interval = setInterval(() => {
        if (updateTimer()) {
          clearInterval(interval);
        }
      }, 1000);
      
      return () => clearInterval(interval);
    }, [session_ui]);


      
  useEffect(() => {
      getBlocklist().then(setBlocklist_ui);
      getAllowlist().then(setAllowlist_ui);
  }, []);



  // --- Handlers ---

  const handleSignIn = async () => {
    setAuthError_ui(null);
    try {
      await signIn(); // firebase opens Google login popup
    } catch {
      setAuthError_ui("Failed to sign in");
    }
  };

  const handleLockIn = async () => {
    if (!goalDraft_text.trim()) return; // don't allow empty goal
    await startSession(goalDraft_text, duration_min);            // 1. save to chrome.storage (persistent)
    setSession_ui(await getSession());              // 2. refresh ui from chrome.storage
  };

  const handleEndSession = async () => {
    setGoalDraft_text(session_ui?.currentGoal || ""); //this keeeps the text  ? operator just returns undef instead of crashing the app when reading currentGoal
    await endSession();                             // 1. write isLockedIn: false to chrome.storage
    setSession_ui(await getSession());              // 2. refresh ui from chrome.storage
  };


  // --- Render ---

  if (isLoading_ui) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: 'var(--muted)', fontSize: 14 }}>
        Loading...
      </div>
    );
  }

  return (
    <div className="animate-fade-in" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: 24 }}>
      
      {/*  Top Right Buttons */}
      <div style={{ position: 'fixed', top: 16, right: 16, zIndex: 10, display: 'flex', gap: 8 }}>
        
        {/* Home Button   */}
        <button 
          onClick={() => chrome.tabs.create({ url: 'https://lockedin.eliascorp.org' })}
          style={{
            width: 36, height: 36, borderRadius: 10,
            border: '1px solid var(--border)', background: 'rgba(0,0,0,0.3)',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.2s ease', boxShadow: 'none',
          }}
          onMouseOver={(e) => { e.currentTarget.style.borderColor = 'rgba(34,197,94,0.4)'; e.currentTarget.style.boxShadow = '0 0 12px rgba(34,197,94,0.15)'; }}
          onMouseOut={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'none'; }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
            <polyline points="9 22 9 12 15 12 15 22"></polyline>
          </svg>
        </button>

        {/*     settings button      */}
        <button 
          onClick={() => setShowSettings_ui(!showSettings_ui)}
          style={{
            width: 36, height: 36, borderRadius: 10,
            border: '1px solid var(--border)', background: 'rgba(0,0,0,0.3)',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.2s ease', boxShadow: 'none',
          }}
          onMouseOver={(e) => { e.currentTarget.style.borderColor = 'rgba(34,197,94,0.4)'; e.currentTarget.style.boxShadow = '0 0 12px rgba(34,197,94,0.15)'; }}
          onMouseOut={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'none'; }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3"></circle>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
          </svg>
        </button>
      </div>

      <div style={{ width: 360, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24 }}>

        {/* header */}
        <div style={{ textAlign: 'center' }}>
          <span style={{ fontSize: 44, display: 'block', marginBottom: 12, filter: 'drop-shadow(0 0 20px var(--accent-glow))', animation: 'fadeIn 0.6s ease-out' }}>🔒</span>
          <h1 style={{ fontSize: 34, fontWeight: 800, letterSpacing: -1, color: 'var(--text)', margin: 0 }}>
            Locked <span style={{ 
              background: 'var(--gradient-accent)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              filter: 'drop-shadow(0 0 8px rgba(34, 197, 94, 0.4))'
            }}>In</span>
          </h1>
        </div>

        {/* error banner */}
        {authError_ui && (
          <div className="glass-panel" style={{
            width: '100%', padding: '12px 16px',
            background: 'rgba(220, 38, 38, 0.1)', border: '1px solid rgba(220, 38, 38, 0.3)',
            color: '#f87171', fontSize: 13, textAlign: 'center'
          }}>
            {authError_ui}
          </div>
        )}

        {showSettings_ui ? (
          // ── SETTINGS PANEL ──
          <div className="glass-panel" style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 20, padding: 20 }}>
            
            <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', margin: 0, letterSpacing: -0.3 }}>
              ⚙️ Site Rules
            </h2>

            {/* URL Input */}
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                type="text"
                value={urlInput_text}
                onChange={(e) => setUrlInput_text(e.target.value)}
                placeholder="e.g. reddit.com"
                style={{
                  flex: 1, padding: '10px 12px', borderRadius: 10,
                  border: '1px solid var(--border)', background: 'rgba(0,0,0,0.4)',
                  color: 'var(--text)', fontSize: 13, fontFamily: 'var(--font)',
                  outline: 'none',
                }}
                onFocus={(e) => e.target.style.borderColor = 'var(--accent)'}
                onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
              />
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => {
                  if (!urlInput_text.trim()) return;
                  const updated = [...blocklist_ui, urlInput_text.trim().toLowerCase()];
                  setBlocklist_ui(updated);
                  setBlocklist(updated);
                  setUrlInput_text("");
                }}
                style={{
                  flex: 1, padding: '10px 0', borderRadius: 10, border: 'none',
                  background: 'rgba(220, 38, 38, 0.15)', color: '#f87171',
                  fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font)',
                  transition: 'all 0.2s ease',
                }}
              >
                + Block Site
              </button>
              <button
                onClick={() => {
                  if (!urlInput_text.trim()) return;
                  const updated = [...allowlist_ui, urlInput_text.trim().toLowerCase()];
                  setAllowlist_ui(updated);
                  setAllowlist(updated);
                  setUrlInput_text("");
                }}
                style={{
                  flex: 1, padding: '10px 0', borderRadius: 10, border: 'none',
                  background: 'var(--accent-dim)', color: 'var(--accent)',
                  fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font)',
                  transition: 'all 0.2s ease',
                }}
              >
                + Allow Site
              </button>
            </div>

            {/* Blocklist */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={{ fontSize: 11, textTransform: 'uppercase' as const, letterSpacing: 1.5, color: '#f87171', fontWeight: 600 }}>
                Blocked Sites
              </span>
              {blocklist_ui.length === 0 ? (
                <span style={{ fontSize: 12, color: 'var(--muted)', fontStyle: 'italic' }}>No blocked sites yet</span>
              ) : (
                blocklist_ui.map((site, i) => (
                  <div key={i} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '8px 12px', borderRadius: 8,
                    background: 'rgba(220, 38, 38, 0.08)', border: '1px solid rgba(220, 38, 38, 0.15)',
                  }}>
                    <span style={{ fontSize: 13, color: 'var(--text)', fontWeight: 500 }}>{site}</span>
                    <button
                      onClick={() => {
                        const updated = blocklist_ui.filter((_, idx) => idx !== i);
                        setBlocklist_ui(updated);
                        setBlocklist(updated);
                      }}
                      style={{
                        background: 'none', border: 'none', color: '#f87171',
                        cursor: 'pointer', fontSize: 16, padding: 0, lineHeight: 1,
                      }}
                    >
                      ×
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Allowlist */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={{ fontSize: 11, textTransform: 'uppercase' as const, letterSpacing: 1.5, color: 'var(--accent)', fontWeight: 600 }}>
                Allowed Sites
              </span>
              {allowlist_ui.length === 0 ? (
                <span style={{ fontSize: 12, color: 'var(--muted)', fontStyle: 'italic' }}>No allowed sites yet</span>
              ) : (
                allowlist_ui.map((site, i) => (
                  <div key={i} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '8px 12px', borderRadius: 8,
                    background: 'var(--accent-dim)', border: '1px solid rgba(34, 197, 94, 0.15)',
                  }}>
                    <span style={{ fontSize: 13, color: 'var(--text)', fontWeight: 500 }}>{site}</span>
                    <button
                      onClick={() => {
                        const updated = allowlist_ui.filter((_, idx) => idx !== i);
                        setAllowlist_ui(updated);
                        setAllowlist(updated);
                      }}
                      style={{
                        background: 'none', border: 'none', color: 'var(--accent)',
                        cursor: 'pointer', fontSize: 16, padding: 0, lineHeight: 1,
                      }}
                    >
                      ×
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        ) : loggedInUser_ui ? (
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
            <p style={{ color: 'var(--muted)', fontSize: 14, margin: 0, fontWeight: 400 }}>
              Welcome, <span style={{ color: 'var(--text)', fontWeight: 600 }}>{loggedInUser_ui.displayName || loggedInUser_ui.email}</span>
            </p>

            {session_ui?.isLockedIn ? (
              // ── SESSION ACTIVE ──
              <div className="glass-panel" style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 16, padding: 20, background: 'var(--surface)' }}>
                <div style={{
                  width: '100%', padding: '16px', borderRadius: 12,
                  background: 'var(--accent-dim)', border: '1px solid rgba(34, 197, 94, 0.2)',
                  fontSize: 14, lineHeight: 1.6, textAlign: 'center'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 8 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent)', boxShadow: '0 0 8px var(--accent)' }}></div>
                    <span style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: 1.5, color: 'var(--accent)', fontWeight: 700 }}>
                      Session Active
                    </span>
                  </div>
                  <span style={{ color: 'var(--text)', fontWeight: 500, display: 'block' }}>{session_ui.currentGoal}</span>
                </div>
                {/* Timer Display */}
                {timeLeft_ui && (
                  <div style={{
                    textAlign: 'center',
                    fontSize: 48,
                    fontWeight: 800,
                    letterSpacing: 2,
                    color: timeLeft_ui === "00:00" ? '#f87171' : '#ffffff',
                    fontFamily: 'var(--font)',
                    marginTop: 4,
                    textShadow: '0 4px 24px rgba(0,0,0,0.5)',
                    background: timeLeft_ui === "00:00" ? '#f87171' : 'var(--gradient-accent)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}>
                    {timeLeft_ui}
                  </div>
                )}
                 {/* end session button */}
                <button className="btn-hover" onClick={handleEndSession} style={{
                  width: '100%', padding: '12px 0', borderRadius: 10, border: '1px solid rgba(248, 113, 113, 0.3)',
                  background: 'rgba(248, 113, 113, 0.1)', color: '#f87171', fontSize: 14, fontWeight: 600,
                  cursor: 'pointer', fontFamily: 'var(--font)', marginTop: 4
                }}>
                  End Session
                </button>
              </div>
            ) : (
              // ── NO SESSION ─----
              <div className="glass-panel" style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 16, padding: 20 }}>
                {session_ui?.lastRateLimitedDate === new Date().toDateString() && ( // only render if this condition is true
                  <div style={{
                    width: '100%', padding: '12px 14px', borderRadius: 10,
                    background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.25)',
                    color: '#fbbf24', fontSize: 13, textAlign: 'center', lineHeight: 1.5,
                  }}>
                    <span style={{ display: 'block', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4, fontWeight: 700 }}>
                      ⚠️ Daily Limit Reached
                    </span>
                    <span style={{ opacity: 0.9 }}>Blocking is paused until tomorrow.</span>
                  </div>
                )}

                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    placeholder="What are you working on?"
                    value={goalDraft_text}
                    onChange={(e) => setGoalDraft_text(e.target.value)}
                    disabled={session_ui?.lastRateLimitedDate === new Date().toDateString()}
                    style={{
                      width: '100%', padding: '14px 16px', borderRadius: 12,
                      background: 'rgba(0,0,0,0.4)', border: '1px solid var(--border)',
                      color: session_ui?.lastRateLimitedDate === new Date().toDateString() ? 'var(--muted)' : 'var(--text)',
                      fontSize: 14, fontFamily: 'var(--font)',
                      outline: 'none',
                      opacity: session_ui?.lastRateLimitedDate === new Date().toDateString() ? 0.6 : 1,
                      cursor: session_ui?.lastRateLimitedDate === new Date().toDateString() ? 'not-allowed' : 'text',
                      transition: 'border-color 0.2s ease, box-shadow 0.2s ease'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = 'var(--accent)';
                      e.target.style.boxShadow = '0 0 0 2px var(--accent-dim)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = 'var(--border)';
                      e.target.style.boxShadow = 'none';
                    }}
                  />
                </div>
                
                {/* Duration Picker */}
                <div style={{ display: 'flex', gap: 10, width: '100%' }}>
                  {[25, 45, 60].map(min => (
                    <button
                      key={min}
                      onClick={() => setDuration_min(min)}
                      style={{
                        flex: 1,
                        padding: '10px 0',
                        borderRadius: 10,
                        border: `1px solid ${duration_min === min ? 'var(--accent)' : 'var(--border)'}`,
                        background: duration_min === min ? 'var(--accent-dim)' : 'rgba(0,0,0,0.4)',
                        color: duration_min === min ? 'var(--accent)' : 'var(--muted)',
                        fontSize: 14,
                        fontWeight: 600,
                        cursor: 'pointer',
                        fontFamily: 'var(--font)',
                        transition: 'all 0.2s ease',
                        boxShadow: duration_min === min ? '0 0 12px var(--accent-glow)' : 'none'
                      }}
                    >
                      {min}m
                    </button>
                  ))}
                  {/* Custom Time Input */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    padding: '10px 10px',
                    borderRadius: 10,
                    border: `1px solid ${![25, 45, 60].includes(duration_min) ? 'var(--accent)' : 'var(--border)'}`,
                    background: ![25, 45, 60].includes(duration_min) ? 'var(--accent-dim)' : 'rgba(0,0,0,0.4)',
                    transition: 'all 0.2s ease',
                  }}>
                    <input 
                      type="number"
                      value={duration_min || ''}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10);
                        setDuration_min(isNaN(val) || val < 0 ? 0 : val);
                      }}
                      onFocus={(e) => e.target.select()}
                      style={{
                        width: 36,
                        backgroundColor: 'transparent',
                        border: 'none',
                        color: 'var(--accent)',
                        fontSize: 14,
                        fontWeight: 700,
                        textAlign: 'center' as const,
                        outline: 'none',
                        padding: 0,
                        fontFamily: 'var(--font)',
                      }}
                    />
                    <span style={{ color: 'var(--muted)', fontSize: 12, fontWeight: 600 }}>m</span>
                  </div>
                </div>

                <button
                  className={session_ui?.lastRateLimitedDate !== new Date().toDateString() ? "btn-hover" : ""}
                  onClick={handleLockIn}
                  disabled={session_ui?.lastRateLimitedDate === new Date().toDateString()}
                  style={{
                    width: '100%', padding: '14px 0', borderRadius: 12, border: 'none',
                    background: session_ui?.lastRateLimitedDate === new Date().toDateString() ? 'var(--border)' : 'var(--gradient-accent)',
                    color: session_ui?.lastRateLimitedDate === new Date().toDateString() ? 'var(--muted)' : '#000',
                    fontSize: 15, fontWeight: 700, letterSpacing: 0.5,
                    cursor: session_ui?.lastRateLimitedDate === new Date().toDateString() ? 'not-allowed' : 'pointer',
                    fontFamily: 'var(--font)',
                    opacity: session_ui?.lastRateLimitedDate === new Date().toDateString() ? 0.6 : 1,
                  }}>
                  🔒 Lock In
                </button>

                {/* ── One-Tap Launch Cards ── */}
                
                {todos_ui.length > 0 && (
                  <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <span style={{ 
                      fontSize: 11, 
                      textTransform: 'uppercase' as const, 
                      letterSpacing: 1.5, 
                      color: 'var(--muted)', 
                      fontWeight: 600,
                      marginBottom: 2
                    }}>
                      Your Tasks
                    </span>
                    {todos_ui.map((todo) => (
                      <button
                        key={todo.id}
                        className="btn-hover"
                        onClick={() => {
                          setGoalDraft_text(todo.title);
                          setDuration_min(todo.duration);
                        }}
                        style={{
                          width: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '12px 14px',
                          borderRadius: 10,
                          border: '1px solid var(--border)',
                          background: 'rgba(0,0,0,0.3)',
                          cursor: 'pointer',
                          fontFamily: 'var(--font)',
                          transition: 'all 0.2s ease',
                          textAlign: 'left' as const,
                        }}
                      >
                        <span style={{ 
                          color: 'var(--text)', 
                          fontSize: 13, 
                          fontWeight: 500,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap' as const,
                          marginRight: 10,
                        }}>
                          {todo.title}
                        </span>
                        <span style={{
                          flexShrink: 0,
                          fontSize: 11,
                          fontWeight: 700,
                          color: 'var(--accent)',
                          background: 'var(--accent-dim)',
                          padding: '3px 8px',
                          borderRadius: 6,
                          letterSpacing: 0.5,
                        }}>
                          {todo.duration}m
                        </span>
                      </button>
                    ))}
                  </div>
                )}



                <div style={{ width: '100%', height: 1, background: 'var(--border)', margin: '4px 0' }}></div>
                
                <button onClick={() => signOut()} style={{
                  width: '100%', padding: '8px 0', borderRadius: 8,
                  border: 'none', background: 'transparent',
                  color: 'var(--muted)', fontSize: 13, cursor: 'pointer',
                  fontFamily: 'var(--font)', fontWeight: 500,
                  transition: 'color 0.2s ease'
                }}
                onMouseOver={(e) => e.currentTarget.style.color = '#fff'}
                onMouseOut={(e) => e.currentTarget.style.color = 'var(--muted)'}
                >
                  Sign Out
                </button>
              </div>
            )}
          </div>
        ) : (
          // ── NOT LOGGED IN ──
          <div className="glass-panel" style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20, padding: 24 }}>
            <p style={{ color: 'var(--muted)', fontSize: 14, textAlign: 'center', margin: 0, lineHeight: 1.6, fontWeight: 400 }}>
              Sign in to start tracking your deep work and lock in your goals.
            </p>
            <button className="btn-hover" onClick={handleSignIn} style={{
              width: '100%', padding: '14px 0', borderRadius: 12, border: 'none',
              background: 'var(--gradient-accent)', color: '#000', fontSize: 15, fontWeight: 700,
              cursor: 'pointer', fontFamily: 'var(--font)', letterSpacing: 0.5
            }}>
              Sign In with Google
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;