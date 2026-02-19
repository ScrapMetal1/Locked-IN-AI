import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut as firebaseSignOut } from 'firebase/auth';

// TODO: Replace with your Firebase Web App config (from Project Settings > General > Your apps)
const firebaseConfig = {
  apiKey: "AIzaSyBRCwUrdDsE4LcU47Hkf5GW6yLkuNXM_gI",
  authDomain: "locked-in-ai-487607.firebaseapp.com",
  projectId: "locked-in-ai-487607",
  storageBucket: "locked-in-ai-487607.firebasestorage.app",
  messagingSenderId: "878910085098",
  appId: "1:878910085098:web:0189af49f6ea6f992a0493",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
const provider = new GoogleAuthProvider();

export async function signIn() {
    try {
        const result = await signInWithPopup(auth, provider);
        return result.user;
    } catch (error) {
        console.error("Sign In Error", error);
        throw error;
    }
}

export async function signOut() {
    try {
        await firebaseSignOut(auth);
    } catch (error) {
        console.error("Sign Out Error", error);
    }
}


//this checks if anyone is currently logged in. // Promise is a wait. A buzzer. 
export async function getIdToken(): Promise<string | null> {
    const user = auth.currentUser;
    if (user) {
        return await user.getIdToken();
    }
    return null;
}
