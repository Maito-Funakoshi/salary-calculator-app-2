import { ShiftEntry, Attendance } from "../types/types";
import { calculateShiftPay } from "./calculationUtils";
import { saveShiftsToFirestore } from "./firebaseUtils";
import { User } from "firebase/auth";

/**
 * 勤怠の追加
 */
export const addAttendance = (
  shiftId: number, 
  shifts: ShiftEntry[], 
  setShifts: (shifts: ShiftEntry[]) => void,
  user: User | null
) => {
  const newShifts = shifts.map((shift) => {
    if (shift.id === shiftId) {
      const newAttendance = { start: "", end: "" }
      return {
        ...shift,
        attendances: [...shift.attendances, newAttendance],
        totalPay: calculateShiftPay(shift.hourlyRate, [...shift.attendances, newAttendance]) || 0,
      }
    }
    return shift
  })
  setShifts(newShifts);
  if (user) {
    saveShiftsToFirestore(newShifts, user);
  }
}

/**
 * 勤怠の変更
 */
export const updateAttendance = (
  id: number, 
  type: "start" | "end", 
  index: number, 
  value: string, 
  shifts: ShiftEntry[], 
  setShifts: (shifts: ShiftEntry[]) => void,
  user: User | null
) => {
  const newShifts = shifts.map((shift) => {
    if (shift.id === id) {
      const updatedAttendances = shift.attendances.map((attendance, i) => {
        if (i === index) {
          return { ...attendance, [type]: value }
        }
        return attendance
      })
      return {
        ...shift,
        attendances: updatedAttendances,
        totalPay: calculateShiftPay(shift.hourlyRate, updatedAttendances) || 0,
      }
    }
    return shift
  })
  setShifts(newShifts);
  if (user) {
    saveShiftsToFirestore(newShifts, user);
  }
}

/**
 * 勤怠の削除
 */
export const deleteAttendance = (
  shiftId: number, 
  shifts: ShiftEntry[], 
  setShifts: (shifts: ShiftEntry[]) => void,
  user: User | null
) => {
  const userConfirmed = confirm("このシフトの最後の勤怠を消して良いですか?");
  if (!userConfirmed) return
  const newShifts = shifts.map((shift) => {
    if (shift.id === shiftId && shift.attendances.length > 0) {
      const updatedAttendances = shift.attendances.slice(0, -1)
      return {
        ...shift,
        attendances: updatedAttendances,
        totalPay: calculateShiftPay(shift.hourlyRate, updatedAttendances) || 0,
      }
    }
    return shift
  })
  setShifts(newShifts);
  if (user) {
    saveShiftsToFirestore(newShifts, user);
  }
}
