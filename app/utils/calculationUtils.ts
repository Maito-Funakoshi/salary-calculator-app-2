import { Attendance } from "../types/types";

/**
 * 日を跨ぐ労働時間の修正
 * (ex. ~23:40→0:15~ 23:40→24:15)
 */
export const fixAttendance = (attendances: Attendance[]) => {
  let prevEndHour = 0;
  return attendances.map(attendance => {
    let spanFlag: boolean = false;
    let startHour = +attendance.start.split(":")[0];
    const startMinute = +attendance.start.split(":")[1];
    let endHour = +attendance.end.split(":")[0];
    const endMinute = +attendance.end.split(":")[1];
    // 日付を跨いだattendanceより先の労働時間はこれで処理
    if (spanFlag) {
      startHour += 24;
      endHour += 24;
    }
    // 労働の途中で日付を跨いだ場合
    else if (startHour > endHour || ((startHour == endHour) && (startMinute > endMinute))) {
      spanFlag = true;
      endHour += 24;
    }
    // 労働の開始までに日付を跨いだ場合
    else if (prevEndHour > startHour) {
      spanFlag = true;
      startHour += 24;
      endHour += 24;
    }

    prevEndHour = endHour;

    return { start: `${startHour}:${startMinute}`, end: `${endHour}:${endMinute}` }
  })
}

/**
 * 各シフトの労働時間の計算
 */
export const calculateShiftWorkHour = (attendances: Attendance[]) => {
  const hours = fixAttendance(attendances).reduce((sum, { start, end }) => {
    if (start && end) {
      const [startHour, startMinute] = start.split(":").map(Number)
      const [endHour, endMinute] = end.split(":").map(Number)
      const duration = (endHour + endMinute / 60) - (startHour + startMinute / 60)
      return sum + (duration > 0 ? duration : 0)
    }
    return sum
  }, 0)
  return hours;
}

/**
 * 総労働時間の計算
 */
export const calculateTotalWorkHour = (shifts: { attendances: Attendance[] }[]) => {
  let totalWorkHour = 0;
  shifts.map(shift => {
    const hours = calculateShiftWorkHour(shift.attendances);
    totalWorkHour += hours;
  })

  return totalWorkHour;
}

/**
 * 深夜労働時間の計算
 */
export const midnightDuration = (startHour: number, startMinute: number, endHour: number, endMinute: number, l: number, g: number) => {
  if (startHour < l) {
    if (l <= endHour && endHour < g) {
      return (endHour + endMinute / 60) - l;
    }
    else if (g <= endHour) {
      return g - l;
    }
    else return 0;
  }

  else if (startHour < g) {
    if (endHour < g) {
      return (endHour + endMinute / 60) - (startHour + startMinute / 60);
    }
    else {
      return g - (startHour + startMinute / 60);
    }
  }

  else return 0;
}

/**
 * 各シフトの給料の計算
 */
export const calculateShiftPay = (hourlyRate: string, attendances: Attendance[]) => {
  let shiftPay = 0;
  // 時給が空欄の場合
  const rate = parseFloat(hourlyRate);
  const additionalRate = rate * 0.25;
  if (isNaN(rate)) return 0
  // 日を跨ぐ場合の処理
  const fixedAttendances = fixAttendance(attendances);

  // 追加時給以外の部分
  const hours = calculateShiftWorkHour(fixedAttendances);
  shiftPay += rate * hours;

  // 超過時給
  const overHours = hours - 8.0;
  shiftPay += additionalRate * Math.max(overHours, 0);

  // 深夜時給
  fixedAttendances.map(attendance => {
    // 開始/終了時刻の変数格納
    const [startHour, startMinute] = attendance.start.split(":").map(Number)
    const [endHour, endMinute] = attendance.end.split(":").map(Number)

    // 0時〜5時
    const duration1 = midnightDuration(startHour, startMinute, endHour, endMinute, 0.0, 5.0);

    // 22時〜29時
    const duration2 = midnightDuration(startHour, startMinute, endHour, endMinute, 22.0, 29.0);

    // 46時~48時
    const duration3 = midnightDuration(startHour, startMinute, endHour, endMinute, 46.0, 48.0);

    shiftPay += additionalRate * (duration1 + duration2 + duration3);
  })

  return shiftPay
}

/**
 * 全てのシフトでの給料の合計の計算
 */
export const calculateTotalPay = (shifts: { totalPay: number }[]) => {
  let totalPay = 0;
  shifts.map(shift => {
    totalPay += shift.totalPay
  })
  return totalPay
}
