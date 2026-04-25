import { initializeApp } from 'firebase/app';
import { getFirestore } from "firebase/firestore";
import { getAuth } from 'firebase/auth';



const firebaseConfig = {
    apiKey: "AIzaSyBRCwUrdDsE4LcU47Hkf5GW6yLkuNXM_gI",
    authDomain: "locked-in-ai-487607.firebaseapp.com",
    projectId: "locked-in-ai-487607",
    storageBucket: "locked-in-ai-487607.firebasestorage.app",
    messagingSenderId: "878910085098",
    appId: "1:878910085098:web:0189af49f6ea6f992a0493",
};

const app = initializeApp(firebaseConfig);


// Export the Database and Auth so we can use them in App.jsx
export const db = getFirestore(app, "lockedin-userdb");
export const auth = getAuth(app);