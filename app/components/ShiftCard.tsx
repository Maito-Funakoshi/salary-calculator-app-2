"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { X } from "lucide-react"
import { ShiftEntry, Attendance } from "../types/types"
import { calculateShiftWorkHour } from "../utils/calculationUtils"
import { updateShift, removeShift } from "../utils/shiftUtils"
import { addAttendance, updateAttendance, deleteAttendance } from "../utils/attendanceUtils"
import { User } from "firebase/auth"

interface ShiftCardProps {
  shift: ShiftEntry
  shifts: ShiftEntry[]
  setShifts: (shifts: ShiftEntry[]) => void
  user: User | null
}

export const ShiftCard = ({ shift, shifts, setShifts, user }: ShiftCardProps) => {
  return (
    <div className="relative mb-3 py-4 sm:py-6 px-3 sm:px-4 md:px-8 bg-white dark:bg-black border border-gray-00 dark:border-gray-800 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 mx-2 my-2">
      <button
        onClick={() => removeShift(shift.id, shifts, setShifts, user)}
        className="absolute top-2 left-2 text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors duration-200 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
        aria-label={`シフト${shift.id + 1}を削除`}
      >
        <X className="h-4 sm:h-5 w-4 sm:w-5" />
      </button>
      <h2 className="absolute top-2 left-10 sm:left-12 font-bold text-lg sm:text-2xl text-gray-800 dark:text-white">シフト{shift.id + 1}</h2>

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
          <div className="flex gap-4 md:gap-8 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent pb-2">
            {/* 追加/削除ボタン */}
            <div className="flex flex-col gap-8 justify-center h-full min-w-[100px] sm:min-w-[120px]">
              <Button
                onClick={() => addAttendance(shift.id, shifts, setShifts, user)}
                className="text-sm sm:text-md py-1.5 sm:py-2 px-3 sm:px-4 
                bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 
                dark:bg-black dark:from-black dark:to-black dark:text-blue-500 dark:border dark:border-gray-800 
                text-white shadow-md transition-all duration-300 transform hover:scale-105 rounded-lg"
              >
                勤怠を追加
              </Button>

              <Button
                onClick={() => deleteAttendance(shift.id, shifts, setShifts, user)}
                className="text-sm sm:text-md py-1.5 sm:py-2 px-3 sm:px-4 
                bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 
                dark:bg-black dark:from-black dark:to-black dark:text-red-500 dark:border dark:border-gray-800 
                text-white shadow-md transition-all duration-300 transform hover:scale-105 rounded-lg"
              >
                勤怠を削除
              </Button>
            </div>
            {/* 出勤/退勤時刻テキスト */}
            <div className="flex flex-col gap-12 justify-center text-black dark:text-white sticky left-0 z-10">
              <span className="text-sm sm:text-base min-w-[60px] sm:min-w-[70px] font-medium">出勤時刻</span>
              <span className="text-sm sm:text-base min-w-[60px] sm:min-w-[70px] font-medium">退勤時刻</span>
            </div>
            {/* 時間入力 */}
            <div className="flex gap-4 sm:gap-6 h-[104px] overflow-x-auto">
              {shift.attendances.map((attendance, index) => (
                <div key={index} className="flex flex-col items-center gap-4">
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
                  <div className="w-20 sm:w-24 md:w-28 flex justify-center items-center">
                    <div className="w-4 sm:w-6 h-0.5 bg-gray-400 dark:bg-gray-500"></div>
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
