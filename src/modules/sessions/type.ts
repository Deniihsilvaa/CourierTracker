export type CloseSessionPayload = {
    end_time: string
    status?: 'closed'
    end_odometer?: number
}
export interface UpdateSessionPayload {
    start_time: string;
    end_time: string;
    start_odometer: number;
    end_odometer: number;
}

export interface WorkSession {
    id: string;
    start_time: string;
    end_time: string | null;
    start_odometer: string | null;
    end_odometer: string | null;
    status: string;
    total_distance_km: number;
    total_active_seconds: number;
    total_idle_seconds: number;
}
export interface EditSessionModalProps {
    visible: boolean;
    session: WorkSession | null;
    onClose: () => void;
    onSave: (payload: UpdateSessionPayload) => void;
    isUpdating: boolean;
}
