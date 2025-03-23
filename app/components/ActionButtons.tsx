"use client"

import { Button } from "@/components/ui/button"
import { ShiftEntry } from "../types/types"
import { addShift } from "../utils/shiftUtils"
import { handleExportToExcel } from "../utils/exportUtils"
import { deleteHistory } from "../utils/firebaseUtils"
import { User } from "firebase/auth"

interface ActionButtonsProps {
  shifts: ShiftEntry[]
  setShifts: (shifts: ShiftEntry[]) => void
  user: User | null
}

export const ActionButtons = ({ shifts, setShifts, user }: ActionButtonsProps) => {
  return (
    <div className="flex md:flex-col justify-evenly items-start w-[100%]">
      <Button
        onClick={() => addShift(shifts, setShifts, user)}
        className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 
        dark:bg-black dark:from-black dark:to-black dark:text-blue-500 dark:border dark:border-gray-800 
        text-white shadow-md transition-all duration-300 transform hover:scale-105 rounded-lg min-w-[120px]"
      >
        出勤日を追加
      </Button>

      <Button
        onClick={() => handleExportToExcel(shifts)}
        className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 
        dark:bg-black dark:from-black dark:to-black dark:text-green-500 dark:border dark:border-gray-800 
        text-white shadow-md transition-all duration-300 transform hover:scale-105 rounded-lg min-w-[120px]"
      >
        記録を出力
      </Button>

      <Button
        onClick={() => deleteHistory(user, setShifts)}
        className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 
        dark:bg-black dark:from-black dark:to-black dark:text-red-500 dark:border dark:border-gray-800 
        text-white shadow-md transition-all duration-300 transform hover:scale-105 rounded-lg min-w-[120px]"
      >
        履歴を削除
      </Button>
    </div>
  )
}
