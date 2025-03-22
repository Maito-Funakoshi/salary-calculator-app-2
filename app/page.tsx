"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { X } from "lucide-react"
import * as XLSX from 'xlsx';
import { useAuth } from "@/contexts/AuthContext"
import { db } from "@/firebase"
import { collection, doc, setDoc, getDoc, deleteDoc, serverTimestamp } from "firebase/firestore"
import { UserMenu } from "@/components/UserMenu"
import { ThemeToggle } from '@/components/ThemeToggle'

interface Attendance {
  start: string
  end: string
}

interface ShiftEntry {
  id: number
  hourlyRate: string
  totalPay: number
  attendances: Attendance[]
}

export default function SalaryCalculator() {
  const { user, signInWithGoogle, logout } = useAuth();
  const [shifts, setShifts] = useState<ShiftEntry[]>([]);
  const [isBlur, setIsBlur] = useState<boolean>(false);

  useEffect(() => {
    if (user) {
      loadShiftsFromFirestore();
    } else {
      setShifts([{
        id: 0,
        hourlyRate: "",
        totalPay: 0,
        attendances: [{ start: "", end: "" }]
      }]);
    }
  }, [user]);

  const loadShiftsFromFirestore = async () => {
    if (!user) return;
    try {
      const docRef = doc(db, "shifts", user.uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setShifts(docSnap.data().shifts);
      } else {
        setShifts([{
          id: 0,
          hourlyRate: "",
          totalPay: 0,
          attendances: [{ start: "", end: "" }]
        }]);
      }
    } catch (error) {
      console.error("シフトデータの読み込みエラー:", error);
    }
  };

  const saveShiftsToFirestore = async (newShifts: ShiftEntry[]) => {
    if (!user) return;
    try {
      const shiftsRef = doc(db, "shifts", user.uid);
      await setDoc(shiftsRef, {
        shifts: newShifts,
        updatedAt: serverTimestamp(),
        userId: user.uid
      }, { merge: true });
    } catch (error) {
      console.error("シフトデータの保存エラー:", error);
      alert("データの保存に失敗しました。もう一度お試しください。");
    }
  };

  /**
   * エクセルファイル出力
   */
  const handleExportToExcel = () => {
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
        "労働時間[時間]": String(Math.round(calculateTotalWorkHour())),
        "収入[円]": String(Math.round(calculateTotalPay())),
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

  /**
  * 日を跨ぐ労働時間の修正
  * (ex. ~23:40→0:15~ 23:40→24:15)
  */
  const fixAttendance = (attendances: Attendance[]) => {
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
  const calculateShiftWorkHour = (attendances: Attendance[]) => {
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
  const calculateTotalWorkHour = () => {
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
  const midnightDuration = (startHour: number, startMinute: number, endHour: number, endMinute: number, l: number, g: number) => {
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
  const calculateShiftPay = (hourlyRate: string, attendances: Attendance[]) => {
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
  const calculateTotalPay = () => {
    let totalPay = 0;
    shifts.map(shift => {
      totalPay += shift.totalPay
    })
    return totalPay
  }

  /**
  * 履歴の削除
  */
  const deleteHistory = async () => {
    const userConfirmed = confirm("全てのシフトの記録を消して良いですか?");
    if (!userConfirmed) return;

    setShifts([]);
    if (user) {
      try {
        await deleteDoc(doc(db, "shifts", user.uid));
      } catch (error) {
        console.error("履歴の削除エラー:", error);
      }
    }
  }

  /**
  * シフトの追加
  */
  const addShift = () => {
    const newShift: ShiftEntry = {
      id: shifts.length,
      hourlyRate: shifts.length ? shifts[shifts.length - 1].hourlyRate : "",
      totalPay: 0,
      attendances: [{ start: "", end: "" }]
    }
    const newShifts = [...shifts, newShift];
    setShifts(newShifts);
    if (user) {
      saveShiftsToFirestore(newShifts);
    }
  }

  /**
  * シフトの変更
  */
  const updateShift = (id: number, field: keyof ShiftEntry, value: string) => {
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
    saveShiftsToFirestore(newShifts);
  }

  /**
  * シフトの削除
  */
  const removeShift = async (id: number) => {
    const userConfirmed = confirm(`シフト${id + 1}の記録を消して良いですか?`);
    if (!userConfirmed) return;
    const newShifts = shifts.filter((shift) => shift.id !== id);
    newShifts.map((newShift, index) => {
      newShift.id = index;
    });
    setShifts(newShifts);
    saveShiftsToFirestore(newShifts);
  }

  /**
  * 勤怠の追加
  */
  const addAttendance = (shiftId: number) => {
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
    saveShiftsToFirestore(newShifts);
  }

  /**
  * 勤怠の変更
  */
  const updateAttendance = (id: number, type: "start" | "end", index: number, value: string) => {
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
    saveShiftsToFirestore(newShifts);
  }

  /**
  * 勤怠の削除
  */
  const deleteAttendance = (shiftId: number) => {
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
    saveShiftsToFirestore(newShifts);
  }

  const handleLogout = async () => {
    await logout(() => {
      setShifts([]);
    });
  };

  return (
    <div className="w-full max-w-[1200px] mx-auto p-3 sm:p-4 md:p-6 text-gray-800 dark:text-gray-200">
      <div className="flex justify-between items-center mb-4">
        <div className="flex gap-4">
          <h1 className="text-2xl font-bold text-center text-gray-800 dark:text-white">給料計算機</h1>
          <Button
            onClick={() => setIsBlur(!isBlur)}
            className="rounded-full h-8 px-4 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
          >
            {isBlur ? "表示する" : "ぼかす"}
          </Button>
        </div>
        <div className="flex items-center gap-2 sm:gap-4">
          <ThemeToggle />
          {user ? (
            <UserMenu user={user} onLogout={handleLogout} />
          ) : (
            <Button 
              onClick={signInWithGoogle}
              className="w-16 h-8 text-xs sm:text-md"
            >
              ログイン
            </Button>
          )}
        </div>
      </div>

      <div className="h-[360px] sm:h-[400px] md:h-[480px] overflow-y-auto rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent">
        {shifts.map((shift) => (
          <div key={shift.id} className="relative mb-3 py-4 sm:py-6 px-3 sm:px-4 md:px-8 bg-white dark:bg-black border border-gray-00 dark:border-gray-800 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 mx-2 my-2">
            <button
              onClick={() => removeShift(shift.id)}
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
                              onChange={(e) => updateShift(shift.id, "hourlyRate", e.target.value)}
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
                      onClick={() => addAttendance(shift.id)}
                      className="text-sm sm:text-md py-1.5 sm:py-2 px-3 sm:px-4 
                      bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 
                      dark:bg-black dark:from-black dark:to-black dark:text-blue-500 dark:border dark:border-gray-800 
                      text-white shadow-md transition-all duration-300 transform hover:scale-105 rounded-lg"
                    >
                      勤怠を追加
                    </Button>

                    <Button
                      onClick={() => deleteAttendance(shift.id)}
                      className="text-sm sm:text-md py-1.5 sm:py-2 px-3 sm:px-4 
                      bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 
                      dark:bg-black dark:from-black dark:to-black dark:text-red-500 dark:border dark:border-gray-800 
                      text-white shadow-md transition-all duration-300 transform hover:scale-105 rounded-lg"
                    >
                      勤怠を削除
                    </Button>
                  </div>
                  {/* 出勤/退勤時刻テキスト */}
                  <div className="flex flex-col gap-12 mt-2 md:mt-1 text-black dark:text-white sticky left-0 z-10">
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
                          onChange={(e) => updateAttendance(shift.id, "start", index, e.target.value)}
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
                          onChange={(e) => updateAttendance(shift.id, "end", index, e.target.value)}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-col md:flex-row justify-between gap-4 mt-4">
        <div className="flex md:flex-col justify-evenly items-start w-[100%]">
          <Button
            onClick={addShift}
            className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 
            dark:bg-black dark:from-black dark:to-black dark:text-blue-500 dark:border dark:border-gray-800 
            text-white shadow-md transition-all duration-300 transform hover:scale-105 rounded-lg min-w-[120px]"
          >
            出勤日を追加
          </Button>

          <Button
            onClick={handleExportToExcel}
            className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 
            dark:bg-black dark:from-black dark:to-black dark:text-green-500 dark:border dark:border-gray-800 
            text-white shadow-md transition-all duration-300 transform hover:scale-105 rounded-lg min-w-[120px]"
          >
            記録を出力
          </Button>

          <Button
            onClick={deleteHistory}
            className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 
            dark:bg-black dark:from-black dark:to-black dark:text-red-500 dark:border dark:border-gray-800 
            text-white shadow-md transition-all duration-300 transform hover:scale-105 rounded-lg min-w-[120px]"
          >
            履歴を削除
          </Button>
        </div>

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
                {Math.round(calculateTotalWorkHour())}
                <span className="text-lg sm:text-xl md:text-2xl ml-1">時間</span>
              </p>
            </div>
          </Card>
          <Card className="p-4 sm:p-5 text-center bg-white dark:bg-black text-gray-800 dark:text-gray-200 sm:w-[180px] lg:w-[240px] sm:min-h-[120px] rounded-xl shadow-lg hover:shadow-xl transition-all duration-500 border border-gray-200 dark:border-gray-700">
            <div className="flex sm:flex-col items-center justify-between sm:justify-center gap-2">
              <h3 className="text-lg sm:text-base text-gray-700 dark:text-gray-300 mb-0 sm:mb-2 lg:mb-0 font-bold">総収入</h3>
              <p className="text-xl sm:text-2xl lg:text-4xl bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent font-bold">
                {Math.round(calculateTotalPay()).toLocaleString()}
                <span className="text-lg sm:text-xl md:text-2xl ml-1">円</span>
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
