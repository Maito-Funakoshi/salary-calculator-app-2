"use client"

import { useEffect, useState, useRef } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { ShiftEntry } from "./types/types"
import { loadShiftsFromFirestore } from "./utils/firebaseUtils"
import { Header } from "./components/Header"
import { ShiftCard } from "./components/ShiftCard"
import { ActionButtons } from "./components/ActionButtons"
import { StatisticsCards } from "./components/StatisticsCards"

export default function SalaryCalculator() {
  const { user, signInWithGoogle, logout } = useAuth();
  const [shifts, setShifts] = useState<ShiftEntry[]>([]);
  const [isBlur, setIsBlur] = useState<boolean>(false);
  const shiftsContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) {
      loadShiftsFromFirestore(user, setShifts);
    } else {
      setShifts([{
        id: 0,
        hourlyRate: "",
        totalPay: 0,
        attendances: [{ start: "", end: "" }]
      }]);
    }
  }, [user]);

  useEffect(() => {
    if (shiftsContainerRef.current) {
      shiftsContainerRef.current.scrollTop = shiftsContainerRef.current.scrollHeight;
    }
  }, [shifts.length]);

  const handleLogout = async () => {
    await logout(() => {
      setShifts([]);
    });
  };

  return (
    <div className="w-full max-w-[1200px] mx-auto p-3 sm:p-4 md:p-6 text-gray-800 dark:text-gray-200">
      <Header 
        isBlur={isBlur} 
        setIsBlur={setIsBlur} 
        user={user} 
        signInWithGoogle={signInWithGoogle} 
        handleLogout={handleLogout} 
      />

      <div 
        ref={shiftsContainerRef} 
        className="h-[360px] sm:h-[400px] md:h-[480px] overflow-y-auto rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent"
      >
        {shifts.map((shift) => (
          <ShiftCard 
            key={shift.id} 
            shift={shift} 
            shifts={shifts} 
            setShifts={setShifts} 
            user={user} 
          />
        ))}
      </div>

      <div className="flex flex-col md:flex-row justify-between gap-4 mt-4">
        <ActionButtons shifts={shifts} setShifts={setShifts} user={user} />
        <StatisticsCards shifts={shifts} isBlur={isBlur} />
      </div>
    </div>
  )
}
