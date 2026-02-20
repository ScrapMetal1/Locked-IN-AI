import { useState, useEffect } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { signIn, signOut, auth } from './services/auth';
import './index.css';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Listen for auth state changes (login / logout)
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsubscribe(); // cleanup listener on unmount
  }, []);

  const handleSignIn = async () => {
    setError(null);
    try {
      await signIn();
    } catch (err: any) {
      setError("Failed to sign in");
    }
  };

  if (loading) {
    return <div className="p-4 flex justify-center items-center">Loading...</div>;
  }

  return (
    <div className="h-screen w-full flex items-center justify-center bg-gray-900 text-white">
      <div className="w-[350px] p-6 flex flex-col items-center space-y-4">
        <h1 className="text-4xl font-bold text-blue-500">Locked In 🔒</h1>

        {error && (
          <div className="w-full bg-red-900 border border-red-500 text-red-200 px-4 py-3 rounded text-xs break-words">
            {error}
          </div>
        )}

        {user ? (
          <div className="flex flex-col items-center w-full space-y-4">
            <div className="text-center">
              <p className="text-sm text-gray-400">Welcome back,</p>
              <p className="font-medium truncate max-w-[250px]">{user.displayName || user.email}</p>
            </div>

            <button
              onClick={() => signOut()}
              className="w-full py-2 px-4 bg-red-600 hover:bg-red-700 text-white rounded shadow transition-colors"
            >
              Sign Out
            </button>
          </div>
        ) : (
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
