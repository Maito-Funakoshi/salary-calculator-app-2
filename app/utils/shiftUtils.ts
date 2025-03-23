import { ShiftEntry, Attendance } from "../types/types";
import { calculateShiftPay } from "../utils/calculationUtils";
import { saveShiftsToFirestore } from "../utils/firebaseUtils";
import { User } from "firebase/auth";

/**
 * シフトの追加
 */
export const addShift = (shifts: ShiftEntry[], setShifts: (shifts: ShiftEntry[]) => void, user: User | null) => {
  const newShift: ShiftEntry = {
    id: shifts.length,
    hourlyRate: shifts.length ? shifts[shifts.length - 1].hourlyRate : "",
    totalPay: 0,
    attendances: [{ start: "", end: "" }]
  }
  const newShifts = [...shifts, newShift];
  setShifts(newShifts);
  if (user) {
    saveShiftsToFirestore(newShifts, user);
  }
}

/**
 * シフトの変更
 */
export const updateShift = (
  id: number, 
  field: keyof ShiftEntry, 
  value: string, 
  shifts: ShiftEntry[], 
  setShifts: (shifts: ShiftEntry[]) => void,
  user: User | null
) => {
  const newShifts = shifts.map((shift) => {
    if (shift.id === id) {
      const updatedShift = { ...shift, [field]: value }
      if (field === "hourlyRate") {
        updatedShift.totalPay = calculateShiftPay(value, updatedShift.attendances) || 0;
      }
      return updatedShift
    }
    return shift
  })
  setShifts(newShifts);
  if (user) {
    saveShiftsToFirestore(newShifts, user);
  }
}

/**
 * シフトの削除
 */
export const removeShift = async (
  id: number, 
  shifts: ShiftEntry[], 
  setShifts: (shifts: ShiftEntry[]) => void,
  user: User | null
) => {
  const userConfirmed = confirm(`シフト${id + 1}の記録を消して良いですか?`);
  if (!userConfirmed) return;
  const newShifts = shifts.filter((shift) => shift.id !== id);
  newShifts.map((newShift, index) => {
    newShift.id = index;
  });
  setShifts(newShifts);
  if (user) {
    saveShiftsToFirestore(newShifts, user);
  }
}
