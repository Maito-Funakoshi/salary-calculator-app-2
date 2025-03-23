"use client"

import { Card } from "@/components/ui/card"
import { ShiftEntry } from "../types/types"
import { calculateTotalWorkHour, calculateTotalPay } from "../utils/calculationUtils"

interface StatisticsCardsProps {
  shifts: ShiftEntry[]
  isBlur: boolean
}

export const StatisticsCards = ({ shifts, isBlur }: StatisticsCardsProps) => {
  return (
    <div id="personal" className={`flex flex-col sm:flex-row justify-evenly md:justify-end gap-6 flex-grow transition-all duration-300 ${isBlur ? "filter blur-md" : ""}`}>
      <Card className="p-4 sm:p-5 text-center bg-white dark:bg-black text-gray-800 dark:text-gray-200 sm:w-[180px] lg:w-[240px] sm:min-h-[120px] rounded-xl shadow-lg hover:shadow-xl transition-all duration-500 border border-gray-200 dark:border-gray-700">
        <div className="flex sm:flex-col items-center justify-between sm:justify-center gap-2">
          <h3 className="text-lg sm:text-base text-gray-700 dark:text-gray-300 mb-0 sm:mb-2 lg:mb-0 font-bold">出勤回数</h3>
          <p className="text-xl sm:text-2xl lg:text-4xl bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent font-bold">
            {shifts.length}
            <span className="text-lg sm:text-xl md:text-2xl ml-1">日</span>
          </p>
        </div>
      </Card>
      <Card className="p-4 sm:p-5 text-center bg-white dark:bg-black text-gray-800 dark:text-gray-200 sm:w-[180px] lg:w-[240px] sm:min-h-[120px] rounded-xl shadow-lg hover:shadow-xl transition-all duration-500 border border-gray-200 dark:border-gray-700">
        <div className="flex sm:flex-col items-center justify-between sm:justify-center gap-2">
          <h3 className="text-lg sm:text-base text-gray-700 dark:text-gray-300 mb-0 sm:mb-2 lg:mb-0 font-bold">総労働時間</h3>
          <p className="text-xl sm:text-2xl lg:text-4xl bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent font-bold">
            {Math.round(calculateTotalWorkHour(shifts))}
            <span className="text-lg sm:text-xl md:text-2xl ml-1">時間</span>
          </p>
        </div>
      </Card>
      <Card className="p-4 sm:p-5 text-center bg-white dark:bg-black text-gray-800 dark:text-gray-200 sm:w-[180px] lg:w-[240px] sm:min-h-[120px] rounded-xl shadow-lg hover:shadow-xl transition-all duration-500 border border-gray-200 dark:border-gray-700">
        <div className="flex sm:flex-col items-center justify-between sm:justify-center gap-2">
          <h3 className="text-lg sm:text-base text-gray-700 dark:text-gray-300 mb-0 sm:mb-2 lg:mb-0 font-bold">総収入</h3>
          <p className="text-xl sm:text-2xl lg:text-4xl bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent font-bold">
            {Math.round(calculateTotalPay(shifts)).toLocaleString()}
            <span className="text-lg sm:text-xl md:text-2xl ml-1">円</span>
          </p>
        </div>
      </Card>
    </div>
  )
}
