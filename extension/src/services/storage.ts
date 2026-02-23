import type { UserState } from "../types";

// starts a focus session — saves goal + isLockedIn: true to chrome's built-in db
export async function startSession(goal: string): Promise<void> {
    const session: UserState = {
        isLockedIn: true,
        currentGoal: goal,
        blockedCount: 0
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
export async function endSession(): Promise<void> {
    const session: UserState = {
        isLockedIn: false,
        currentGoal: "",
        blockedCount: 0
    };

    await chrome.storage.local.set({
        userState: session
    });
}