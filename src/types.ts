export interface UserState {
    isLockedIn: boolean;
    currentGoal: string;
    blockedCount: number;
}

export interface ScanResult {
    allowed : boolean;
    reason: string;
}