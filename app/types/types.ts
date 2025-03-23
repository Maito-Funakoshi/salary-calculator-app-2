export interface Attendance {
  start: string
  end: string
}

export interface ShiftEntry {
  id: number
  hourlyRate: string
  totalPay: number
  attendances: Attendance[]
}
