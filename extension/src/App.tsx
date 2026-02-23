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
    await endSession();                             // 1. write isLockedIn: false to chrome.storage
    setSession_ui(await getSession());              // 2. refresh ui from chrome.storage
  };


  // --- Render ---

  if (isLoading_ui) {
    return <div className="p-4 flex justify-center items-center">Loading...</div>;
  }

  return (
    <div className="h-screen w-full flex items-center justify-center bg-gray-900 text-white">
      <div className="w-[350px] p-6 flex flex-col items-center space-y-4">
        <h1 className="text-4xl font-bold text-blue-500">Locked In 🔒</h1>

        {authError_ui && (
          <div className="w-full bg-red-900 border border-red-500 text-red-200 px-4 py-3 rounded text-xs break-words">
            {authError_ui}
          </div>
        )}

        {loggedInUser_ui ? (
          // ── LOGGED IN ──────────────────────────────────────────────────────
          <div className="flex flex-col items-center w-full space-y-4">
            <p className="text-sm text-gray-400">Welcome, {loggedInUser_ui.displayName || loggedInUser_ui.email}</p>

            {session_ui?.isLockedIn ? (
              // ── STATE 3: SESSION ACTIVE ──────────────────────────────────
              <div className="flex flex-col items-center w-full space-y-4">
                <div className="w-full bg-green-900 border border-green-600 rounded p-3 text-sm text-green-200">
                  🟢 Session active: <strong>{session_ui.currentGoal}</strong>
                </div>
                <button
                  onClick={handleEndSession}
                  className="w-full py-2 px-4 bg-red-600 hover:bg-red-700 text-white rounded shadow transition-colors"
                >
                  End Session
                </button>
              </div>
            ) : (
              // ── STATE 2: LOGGED IN, NO SESSION ───────────────────────────
              <div className="flex flex-col items-center w-full space-y-3">
                <input
                  type="text"
                  placeholder="What are you working on?"
                  value={goalDraft_text}
                  onChange={(e) => setGoalDraft_text(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                />
                <button
                  onClick={handleLockIn}
                  className="w-full py-2 px-4 bg-green-600 hover:bg-green-700 text-white rounded shadow transition-colors"
                >
                  🔒 Lock In
                </button>
                <button
                  onClick={() => signOut()}
                  className="w-full py-2 px-4 bg-gray-700 hover:bg-gray-600 text-white rounded shadow transition-colors text-sm"
                >
                  Sign Out
                </button>
              </div>
            )}
          </div>
        ) : (
          // ── STATE 1: NOT LOGGED IN ─────────────────────────────────────────
          <div className="flex flex-col items-center w-full space-y-4">
            <p className="text-center text-sm text-gray-400">
              Sign in to track your deep work sessions.
            </p>
            <button
              onClick={handleSignIn}
              className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded shadow transition-colors"
            >
              Sign In with Google
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;