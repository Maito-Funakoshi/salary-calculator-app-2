import { db } from "../../firebase";
import { collection, doc, setDoc, getDoc, deleteDoc, serverTimestamp } from "firebase/firestore";
import { ShiftEntry } from "../types/types";
import { User } from "firebase/auth";

/**
 * Firestoreからシフトデータを読み込む
 */
export const loadShiftsFromFirestore = async (user: User | null, setShifts: (shifts: ShiftEntry[]) => void) => {
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

/**
 * Firestoreにシフトデータを保存する
 */
export const saveShiftsToFirestore = async (newShifts: ShiftEntry[], user: User) => {
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
 * 履歴の削除
 */
export const deleteHistory = async (user: User | null, setShifts: (shifts: ShiftEntry[]) => void) => {
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
