import type { UserState } from "../types";

// starts a focus session — saves goal + isLockedIn: true to chrome's built-in db
export async function startSession(goal: string): Promise<void> {
    const prevState = await getSession();

    const session: UserState = {
        isLockedIn: true,
        currentGoal: goal,
        blockedCount: 0,
        lastRateLimitedDate: prevState.lastRateLimitedDate
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