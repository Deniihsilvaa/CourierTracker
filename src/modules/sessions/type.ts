export type CloseSessionPayload = {
    end_time: string
    status: 'closed'
    end_odometer?: number
}