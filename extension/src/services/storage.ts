import { UserState } from "../types";

export async function setGoal(goal: string): Promise<void> {
    //Promise --> 
    const state: UserState = {
        isLockedIn: true,
        currentGoal: goal,
        blockedCount: 0
    };


    await chrome.storage.local.set({
        userState: state
    }); // key : value 

}

export async function getGoal(): Promise<UserState> {
    const result = await

        chrome.storage.local.get("userState"); // gets value using key

    return (result.userState as UserState) || { isLockedIn: false, currentGoal: "", blockedCount: 0 };

}
