import * as XLSX from 'xlsx';
import { ShiftEntry } from "../types/types";
import { calculateShiftWorkHour, calculateTotalWorkHour, calculateTotalPay } from "./calculationUtils";

/**
 * エクセルファイル出力
 */
export const handleExportToExcel = (shifts: ShiftEntry[]) => {
  if (!shifts.length) {
    alert("エクスポートするデータがありません。");
    return;
  }

  const data = shifts.map((shift: ShiftEntry) => {
    const attendanceEntries = shift.attendances.reduce((acc, attendance, index) => {
      acc[`出勤${index + 1}`] = attendance.start;
      acc[`退勤${index + 1}`] = attendance.end;
      return acc;
    }, {} as Record<string, string>);

    return {
      "勤怠番号": String(shift.id + 1),
      "時給[円]": shift.hourlyRate,
      "労働時間[時間]": String(calculateShiftWorkHour(shift.attendances)),
      "収入[円]": String(shift.totalPay),
      ...attendanceEntries
    };
  });

  data.push(
    {
      "勤怠番号": "",
      "時給[円]": "",
      "労働時間[時間]": "",
      "収入[円]": "",
    },
    {
      "勤怠番号": "合計",
      "時給[円]": "",
      "労働時間[時間]": String(Math.round(calculateTotalWorkHour(shifts))),
      "収入[円]": String(Math.round(calculateTotalPay(shifts))),
    }
  );

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const fileName = prompt("ダウンロードするファイルの名前を入力してください", `${year}年${month}月の給料`);
  if (!fileName) {
    alert("ファイル名が入力されていません。");
    return;
  }

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "WorkTimes");

  XLSX.writeFile(workbook, `${fileName}.xlsx`);
};
