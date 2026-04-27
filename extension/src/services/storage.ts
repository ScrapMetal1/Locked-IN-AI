import type { UserState } from "../types";

// starts a focus session — saves goal + isLockedIn: true to chrome's built-in db
export async function startSession(goal: string, durationMinutes: number): Promise<void> {
    const prevState = await getSession();

    const session: UserState = {
        isLockedIn: true,
        currentGoal: goal,
        blockedCount: 0,
        lastRateLimitedDate: prevState.lastRateLimitedDate,
        sessionEndTime: Date.now() + (durationMinutes * 60 * 1000)
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
export async function endSession(rateLimited: boolean = false): Promise<void> {
    const prevState = await getSession();

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