import { useState, useEffect } from 'react';
import type { UserState } from "./types";
import { onAuthStateChanged, type User } from 'firebase/auth';
import { signIn, signOut, auth } from './services/auth';
import './index.css';
import { startSession, getSession, endSession } from './services/storage';

// ─── NAMING CONVENTION ────────────────────────────────────────────────────────
// Variables ending in _ui   → React state (only exists in memory while popup is open)
// Variables ending in _text → raw text the user is typing (not yet saved)
// Functions from storage.ts → read/write to chrome.storage (persistent, background can read it)
// ─────────────────────────────────────────────────────────────────────────────

function App() {

  // --- React UI State (in-memory, popup only) ---
  const [loggedInUser_ui, setLoggedInUser_ui] = useState<User | null>(null);
  const [isLoading_ui, setIsLoading_ui] = useState(true);
  const [authError_ui, setAuthError_ui] = useState<string | null>(null);
  const [session_ui, setSession_ui] = useState<UserState | null>(null); // mirrors what's in chrome.storage for the UI
  const [goalDraft_text, setGoalDraft_text] = useState(""); // what the user is currently typing


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
      setSession_ui(null);
    }
  }, [loggedInUser_ui]);


  // --- Handlers ---

  const handleSignIn = async () => {
    setAuthError_ui(null);
    try {
      await signIn(); // firebase opens Google login popup
    } catch (err: any) {
      setAuthError_ui("Failed to sign in");
    }
  };

  const handleLockIn = async () => {
    if (!goalDraft_text.trim()) return; // don't allow empty goal
    await startSession(goalDraft_text);            // 1. save to chrome.storage (persistent)
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
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: 24 }}>
      <div style={{ width: 360, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>

        {/* header */}
        <div style={{ textAlign: 'center' }}>
          <span style={{ fontSize: 40, display: 'block', marginBottom: 8, filter: 'drop-shadow(0 0 16px rgba(34,197,94,0.5))' }}>🔒</span>
          <h1 style={{ fontSize: 28, fontWeight: 900, letterSpacing: -1, color: 'var(--text)', margin: 0 }}>
            Locked <span style={{ color: 'var(--accent)' }}>In</span>
          </h1>
        </div>

        {/* error banner */}
        {authError_ui && (
          <div style={{
            width: '100%', padding: '10px 14px', borderRadius: 8,
            background: 'rgba(220, 38, 38, 0.12)', border: '1px solid rgba(220, 38, 38, 0.3)',
            color: '#f87171', fontSize: 12
          }}>
            {authError_ui}
          </div>
        )}

        {loggedInUser_ui ? (
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
            <p style={{ color: 'var(--muted)', fontSize: 13, margin: 0 }}>
              Welcome, <span style={{ color: 'var(--text)', fontWeight: 500 }}>{loggedInUser_ui.displayName || loggedInUser_ui.email}</span>
            </p>

            {session_ui?.isLockedIn ? (
              // ── SESSION ACTIVE ──
              <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{
                  width: '100%', padding: '14px 16px', borderRadius: 10,
                  background: 'var(--accent-dim)', border: '1px solid rgba(34, 197, 94, 0.2)',
                  fontSize: 13, lineHeight: 1.6
                }}>
                  <span style={{ display: 'block', fontSize: 11, textTransform: 'uppercase' as const, letterSpacing: 1, color: 'var(--accent)', marginBottom: 6, fontWeight: 600 }}>
                    🟢 session active
                  </span>
                  <span style={{ color: 'var(--text)', fontWeight: 500 }}>{session_ui.currentGoal}</span>
                </div>
                <button onClick={handleEndSession} style={{
                  width: '100%', padding: '10px 0', borderRadius: 8, border: '1px solid var(--border)',
                  background: 'var(--surface)', color: '#f87171', fontSize: 13, fontWeight: 600,
                  cursor: 'pointer', fontFamily: 'var(--font)'
                }}>
                  End Session
                </button>
              </div>
            ) : (
              // ── NO SESSION ──
              <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 10 }}>
                {session_ui?.lastRateLimitedDate === new Date().toDateString() && (
                  <div style={{
                    width: '100%', padding: '12px 14px', borderRadius: 8,
                    background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.25)',
                    color: '#fbbf24', fontSize: 13, textAlign: 'center', lineHeight: 1.5,
                  }}>
                    <span style={{ display: 'block', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4, fontWeight: 700 }}>
                      ⚠️ Daily Limit Reached
                    </span>
                    <span style={{ opacity: 0.9 }}>You've hit the usage limit. Blocking is paused until tomorrow.</span>
                  </div>
                )}

                <input
                  type="text"
                  placeholder="what are you working on?"
                  value={goalDraft_text}
                  onChange={(e) => setGoalDraft_text(e.target.value)}
                  disabled={session_ui?.lastRateLimitedDate === new Date().toDateString()}
                  style={{
                    width: '100%', padding: '10px 14px', borderRadius: 8,
                    background: 'var(--surface)', border: '1px solid var(--border)',
                    color: session_ui?.lastRateLimitedDate === new Date().toDateString() ? 'var(--muted)' : 'var(--text)',
                    fontSize: 13, fontFamily: 'var(--font)',
                    outline: 'none',
                    opacity: session_ui?.lastRateLimitedDate === new Date().toDateString() ? 0.6 : 1,
                    cursor: session_ui?.lastRateLimitedDate === new Date().toDateString() ? 'not-allowed' : 'text'
                  }}
                />
                <button
                  onClick={handleLockIn}
                  disabled={session_ui?.lastRateLimitedDate === new Date().toDateString()}
                  style={{
                    width: '100%', padding: '11px 0', borderRadius: 8, border: 'none',
                    background: session_ui?.lastRateLimitedDate === new Date().toDateString() ? 'var(--surface)' : 'var(--accent)',
                    color: session_ui?.lastRateLimitedDate === new Date().toDateString() ? 'var(--muted)' : '#000',
                    fontSize: 14, fontWeight: 700,
                    cursor: session_ui?.lastRateLimitedDate === new Date().toDateString() ? 'not-allowed' : 'pointer',
                    fontFamily: 'var(--font)',
                    opacity: session_ui?.lastRateLimitedDate === new Date().toDateString() ? 0.6 : 1,
                    transition: 'all 0.2s ease'
                  }}>
                  🔒 Lock In
                </button>
                <button onClick={() => signOut()} style={{
                  width: '100%', padding: '9px 0', borderRadius: 8,
                  border: '1px solid var(--border)', background: 'transparent',
                  color: 'var(--muted)', fontSize: 12, cursor: 'pointer',
                  fontFamily: 'var(--font)'
                }}>
                  Sign Out
                </button>
              </div>
            )}
          </div>
        ) : (
          // ── NOT LOGGED IN ──
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
            <p style={{ color: 'var(--muted)', fontSize: 13, textAlign: 'center', margin: 0, lineHeight: 1.6 }}>
              sign in to start tracking your deep work.
            </p>
            <button onClick={handleSignIn} style={{
              width: '100%', padding: '11px 0', borderRadius: 8, border: 'none',
              background: 'var(--accent)', color: '#000', fontSize: 14, fontWeight: 700,
              cursor: 'pointer', fontFamily: 'var(--font)'
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