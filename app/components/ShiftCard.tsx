"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { X } from "lucide-react"
import { ShiftEntry, Attendance } from "../types/types"
import { calculateShiftWorkHour, calculateShiftPay } from "../utils/calculationUtils"
import { updateShift, removeShift } from "../utils/shiftUtils"
import { addAttendance, updateAttendance, deleteAttendance } from "../utils/attendanceUtils"
import { saveShiftsToFirestore } from "../utils/firebaseUtils"
import { User } from "firebase/auth"

interface ShiftCardProps {
  shift: ShiftEntry
  shifts: ShiftEntry[]
  setShifts: (shifts: ShiftEntry[]) => void
  user: User | null
}

export const ShiftCard = ({ shift, shifts, setShifts, user }: ShiftCardProps) => {
  // 特定の勤怠を削除する関数
  const deleteSpecificAttendance = (shiftId: number, attendanceIndex: number) => {
    const userConfirmed = confirm("この勤怠を削除してもよろしいですか？");
    if (!userConfirmed) return;

    const newShifts = shifts.map((s) => {
      if (s.id === shiftId) {
        // 指定されたインデックスの勤怠を除外した新しい配列を作成
        const updatedAttendances = s.attendances.filter((_, index) => index !== attendanceIndex);
        return {
          ...s,
          attendances: updatedAttendances,
          totalPay: calculateShiftPay(s.hourlyRate, updatedAttendances) || 0,
        };
      }
      return s;
    });

    setShifts(newShifts);
    if (user) {
      saveShiftsToFirestore(newShifts, user);
    }
  };

  return (
    <div className="relative mb-3 py-4 sm:py-6 px-3 sm:px-4 md:px-8 bg-white dark:bg-black border border-gray-00 dark:border-gray-800 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 mx-2 my-2">
      <button
        onClick={() => removeShift(shift.id, shifts, setShifts, user)}
        className="absolute top-2 left-2 text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors duration-200 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
        aria-label={`シフト${shift.id + 1}を削除`}
      >
        <X className="h-4 sm:h-5 w-4 sm:w-5" />
      </button>
      <div className="flex items-center">
        <h2 className="absolute top-2 left-10 sm:left-12 font-bold text-lg sm:text-2xl text-gray-800 dark:text-white">シフト{shift.id + 1}</h2>
      </div>

      <div className="flex flex-col md:flex-row gap-2 md:gap-6 mt-2 sm:mt-0">
        <div className="flex flex-col sm:flex-row gap-6 sm:gap-8">
          {/* 時給と給料 */}
          <div className="mt-4 md:mt-6 bg-gray-50 dark:bg-black p-3 sm:p-4 rounded-lg shadow-sm border dark:border-gray-800">
            <div className="grid grid-cols-1 gap-3">
              <div className="grid grid-cols-3 md:grid-cols-1 gap-2 md:gap-3">
                {/* スクロール可能なコンテナ */}
                <div className="col-span-3 md:col-span-1 overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent">
                  <div className="flex md:flex-col gap-4 md:gap-3 min-w-max">
                    {/* 時給 */}
                    <div className="flex items-center gap-2 text-black dark:text-white whitespace-nowrap">
                      <span className="text-sm sm:text-base font-medium">時給：</span>
                      <Input
                        type="number"
                        className="w-24 h-8 text-sm sm:text-base 
                        bg-white dark:bg-black text-black dark:text-white 
                        border border-gray-300 dark:border-gray-700 duration-200
                        focus:outline-none focus:border-white dark:focus:border-white"
                        value={shift.hourlyRate}
                        onChange={(e) => updateShift(shift.id, "hourlyRate", e.target.value, shifts, setShifts, user)}
                        placeholder="0"
                      />
                      <span className="text-sm sm:text-base">円</span>
                    </div>

                    {/* 労働時間 */}
                    <div className="flex items-center gap-2 text-black dark:text-white whitespace-nowrap">
                      <span className="text-sm sm:text-base font-medium">労働時間：</span>
                      <span className="text-base sm:text-lg font-medium">
                        {Math.round(calculateShiftWorkHour(shift.attendances))}
                      </span>
                      <span className="text-sm sm:text-base">時間</span>
                    </div>

                    {/* 収入 */}
                    <div className="flex items-center gap-2 text-black dark:text-white whitespace-nowrap">
                      <span className="text-sm sm:text-base font-medium">収入：</span>
                      <span className="text-base sm:text-lg font-semibold">
                        {Math.round(shift.totalPay).toLocaleString()}
                      </span>
                      <span className="text-sm sm:text-base">円</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 mt-4 md:mt-6 overflow-x-auto bg-gray-50 dark:bg-black p-3 sm:p-4 rounded-lg shadow-sm border dark:border-gray-800">
          <div className="flex gap-2 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent pb-2">
            {/* 出勤/退勤時刻テキスト */}
            <div className="flex flex-col gap-6 justify-center text-black dark:text-white sticky">
              <Button
                onClick={() => {
                  // 現在時刻を取得
                  const now = new Date();
                  const timeString = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

                  // 新しい勤怠を追加し、その後で最後の勤怠の開始時間を設定
                  const newShifts = shifts.map((s) => {
                    if (s.id === shift.id) {
                      // 新しい勤怠を作成し、開始時間を現在時刻に設定
                      const newAttendance = { start: timeString, end: "" };
                      return {
                        ...s,
                        attendances: [...s.attendances, newAttendance],
                        totalPay: calculateShiftPay(s.hourlyRate, [...s.attendances, newAttendance]) || 0,
                      };
                    }
                    return s;
                  });

                  // 状態を更新
                  setShifts(newShifts);
                  if (user) {
                    saveShiftsToFirestore(newShifts, user);
                  }
                }}
                className="text-sm sm:text-md py-1 px-4
                bg-white hover:bg-gray-100 border border-gray-400 text-black
                dark:bg-black dark:hover:bg-gray-900 dark:border-gray-800 dark:text-white
                transition-all duration-300 transform hover:scale-105 rounded-lg"
              >
                出勤
              </Button>

              <Button
                onClick={() => {
                  const attendances = shift.attendances;
                  const lastIndex = attendances.length - 1;
                  if (lastIndex >= 0) {
                    const now = new Date();
                    const timeString = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
                    updateAttendance(shift.id, "end", lastIndex, timeString, shifts, setShifts, user);
                  }
                }}
                className="text-sm sm:text-md py-1 px-4
                bg-white hover:bg-gray-100 border border-gray-400 text-black
                dark:bg-black dark:hover:bg-gray-900 dark:border-gray-800 dark:text-white
                transition-all duration-300 transform hover:scale-105 rounded-lg"
              >
                退勤
              </Button>
            </div>
            {/* 時間入力 */}
            <div className="flex gap-4 sm:gap-6 h-[104px] px-5 py-1 overflow-x-auto">
              {shift.attendances.map((attendance, index) => (
                <div key={index} className="flex flex-col justify-center items-center relative">
                  {/* 削除ボタン */}
                  <button
                    onClick={() => deleteSpecificAttendance(shift.id, index)}
                    className="absolute -top-1 -right-3 sm:-right-5 md:-right-3 text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors duration-200 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
                    aria-label={`勤怠${index + 1}を削除`}
                  >
                    <X className="h-3 w-3 sm:h-4 sm:w-4" />
                  </button>
                  <Input
                    type="time"
                    className="max-w-24 sm:w-24 md:w-28 text-sm sm:text-base 
                    bg-white text-gray-800 dark:bg-black dark:text-white 
                    border border-gray-300 dark:border-gray-700 duration-200 rounded-md
                    [color-scheme:light] dark:[color-scheme:dark]
                    focus:outline-none focus:border-white dark:focus:border-white"
                    value={attendance.start}
                    onChange={(e) => updateAttendance(shift.id, "start", index, e.target.value, shifts, setShifts, user)}
                  />
                  <div className="w-20 sm:w-24 md:w-28 flex items-center justify-between">
                    <div className="flex-grow text-center">
                      <p>〜</p>
                    </div>
                  </div>
                  <Input
                    type="time"
                    className="max-w-24 sm:w-24 md:w-28 text-sm sm:text-base 
                    bg-white text-gray-800 dark:bg-black dark:text-white 
                    border border-gray-300 dark:border-gray-700 duration-200 rounded-md
                    [color-scheme:light] dark:[color-scheme:dark]
                    focus:outline-none focus:border-white dark:focus:border-white"
                    value={attendance.end}
                    onChange={(e) => updateAttendance(shift.id, "end", index, e.target.value, shifts, setShifts, user)}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
