import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithCredential, signOut as firebaseSignOut, type User } from 'firebase/auth';
import { getFirestore, doc, setDoc, serverTimestamp } from 'firebase/firestore';

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
export const db = getFirestore(app, "lockedin-userdb"); // named database
//const provider = new GoogleAuthProvider(); //chrome handles this now. 

export async function signIn() {
    try {
        // // clear any cached token so Chrome asks again . i dont think this works. 
        // const cached = await chrome.identity.getAuthToken({ interactive: false });
        // if (cached.token) {
        //     await chrome.identity.removeCachedAuthToken({ token: cached.token });
        // }

        const token = await chrome.identity.getAuthToken({interactive: true}); // chrome open its own trusted google login window

        const credential = GoogleAuthProvider.credential(null, token.token); // use that token to create a firebase credential

        const result = await signInWithCredential(auth, credential); //sign into firebase

        if (result.user) { //save result to firestore db
            await saveUserProfile(result.user);
        }
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

// Saves/updates user profile in the 'users' collection in Firestore.
// merge: true ensures we don't overwrite fields like 'currentGoal' on each login.
export async function saveUserProfile(user: User) {
    const userRef = doc(db, "users", user.uid);
    try {
        await setDoc(userRef, {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL,
            lastLogin: serverTimestamp(),
        }, { merge: true });
    } catch (error) {
        console.error("Error saving user profile:", error);
    }
}

// This checks if anyone is currently logged in. Promise is a wait. A buzzer.
export async function getIdToken(): Promise<string | null> {
    const user = auth.currentUser;
    if (user) {
        return await user.getIdToken();
    }
    return null;
}
