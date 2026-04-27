import type { UserState } from "../types";
import { db } from './auth';
import { doc, setDoc, increment } from 'firebase/firestore';

// starts a focus session — saves goal + isLockedIn: true to chrome's built-in db
export async function startSession(goal: string, durationMinutes: number, uid: string): Promise<void> {
    const prevState = await getSession();

    const session: UserState = {
        isLockedIn: true,
        currentGoal: goal,
        blockedCount: 0,
        lastRateLimitedDate: prevState.lastRateLimitedDate,
        sessionEndTime: Date.now() + (durationMinutes * 60 * 1000),
        durationMinutes: durationMinutes,
        uid: uid
    };

    await chrome.storage.local.set({
        userState: session
    });
}

// reads the current session from chrome's built-in db
export async function getSession(): Promise<UserState> {
    const result = await chrome.storage.local.get("userState");

    return (result.userState as UserState) || { isLockedIn: false, currentGoal: "", blockedCount: 0 };
}

// ends the session — resets everything in chrome's built-in db
export async function endSession(rateLimited: boolean = false, completedNaturally: boolean=false): Promise<void> {
    const prevState = await getSession();

    //this stops us from double counting if app.tsx and the background worker both trigger endSession at the same time. 
    if (!prevState.isLockedIn) return; 


    //Record the time if they completed a session. 

    if (completedNaturally && prevState.uid && prevState.durationMinutes) { 
        const userRef = doc(db, "users", prevState.uid);

        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const todayStr = `${year}-${month}-${day}`;
        
        const sunday = new Date(now);
        sunday.setDate(now.getDate() - now.getDay());
        const sunYear = sunday.getFullYear();
        const sunMonth = String(sunday.getMonth() + 1).padStart(2, '0');
        const sunDay = String(sunday.getDate()).padStart(2, '0');
        const weekStr = `${sunYear}-${sunMonth}-${sunDay}`;

        try {
            await setDoc(userRef, {
                stats: {  //create a stats object which contain alltime, today, and weekly from Sunday.  
                    allTime: increment(prevState.durationMinutes),
                    [todayStr]: increment(prevState.durationMinutes),
                    [`week_${weekStr}`]: increment(prevState.durationMinutes)
                }
            }, { merge: true });
            console.log(`Added ${prevState.durationMinutes} minutes to stats!`);
        } catch (error) {
            console.error("Failed to save stats", error);
        }


    }

    const limitedDate = rateLimited ? new Date().toDateString() : prevState.lastRateLimitedDate;

    const session: UserState = {
        isLockedIn: false,
        currentGoal: "",
        blockedCount: 0,
        lastRateLimitedDate: limitedDate
    };

    await chrome.storage.local.set({
        userState: session
    });
}


export async function getBlocklist(): Promise<string[]> {
    const result = await chrome.storage.local.get({blocklist: []});
    return result.blocklist as string[];
}

export async function setBlocklist(list: string[]): Promise<void> {
    await chrome.storage.local.set({blocklist: list}) // creating an object blocklist and list is the value 
}

export async function getAllowlist(): Promise<string[]> {
    const result = await chrome.storage.local.get({allowlist: []});
    return result.allowlist as string[];
}

export async function setAllowlist(list: string[]): Promise<void> {
    await chrome.storage.local.set({allowlist: list})
}