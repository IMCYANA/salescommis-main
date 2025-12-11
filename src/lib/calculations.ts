// 📄 ไฟล์: src/lib/calculations.ts

export interface CommissionBreakdown {
  tier1: number
  tier2: number
  tier3: number
  total: number
}

const PRICE_LOCK = 45.0
const PRICE_STOCK = 30.0
const PRICE_BARREL = 25.0

// --- ฟังก์ชันคำนวณยอดขาย ---
export const calculateSales = (locks: number, stocks: number, barrels: number): number => {
  return (locks * PRICE_LOCK) + (stocks * PRICE_STOCK) + (barrels * PRICE_BARREL)
}

// --- ฟังก์ชันคำนวณคอมมิชชั่น ---
export const calculateCommission = (sales: number): CommissionBreakdown => {
  let remainingSales = sales
  let tier1 = 0
  let tier2 = 0
  let tier3 = 0

  // Tier 1: 10% ของ 1,000 แรก
  if (remainingSales > 1000) {
    tier1 = 1000 * 0.10
    remainingSales -= 1000
  } else {
    tier1 = remainingSales * 0.10
    remainingSales = 0
  }

  // Tier 2: 15% ของ 800 ถัดมา (1,001 - 1,800)
  if (remainingSales > 800) {
    tier2 = 800 * 0.15
    remainingSales -= 800
  } else {
    tier2 = remainingSales * 0.15
    remainingSales = 0
  }

  // Tier 3: 20% ของยอดที่เกิน 1,800
  if (remainingSales > 0) {
    tier3 = remainingSales * 0.20
  }

  return { tier1, tier2, tier3, total: tier1 + tier2 + tier3 }
}

// --- โซนตรวจสอบความถูกต้อง (Validation) ---

// 1. ตรวจสอบสินค้า (Locks/Stocks/Barrels)
export const validateInput = (value: string, min: number, max: number) => {
  if (!value || value.trim() === "") return { isValid: false, error: "กรุณาระบุจำนวน" }
  if (/\s/.test(value)) return { isValid: false, error: "ห้ามเว้นวรรค" }

  const num = Number(value)
  if (isNaN(num)) return { isValid: false, error: "ต้องเป็นตัวเลขเท่านั้น" }
  if (!Number.isInteger(num)) return { isValid: false, error: "ต้องเป็นจำนวนเต็ม (ห้ามทศนิยม)" }
  
  if (num < min) return { isValid: false, error: `ค่าที่ยอมรับได้คือ ${min} ถึง ${max}` }
  if (num > max) return { isValid: false, error: `ค่าต้องไม่เกิน ${max}` }
  
  return { isValid: true, error: "" }
}

// 2. ตรวจสอบรหัสพนักงาน (ID)
export const validateEmployeeId = (id: string) => {
    if (!id || id.trim() === "") return { isValid: false, error: "กรุณาระบุรหัสพนักงาน" }

    const regex = /^[a-zA-Z0-9]+$/; // อังกฤษ+ตัวเลข
    if (/\s/.test(id)) return { isValid: false, error: "ห้ามมีช่องว่าง" }
    if (!regex.test(id)) return { isValid: false, error: "ใช้ได้เฉพาะภาษาอังกฤษและตัวเลข" }
    if (id.length < 3) return { isValid: false, error: "รหัสสั้นเกินไป (3-10 ตัวอักษร)" }
    if (id.length > 10) return { isValid: false, error: "รหัสยาวเกินไป (ไม่เกิน 10 ตัวอักษร)" }

    return { isValid: true, error: "" }
}

// 3. ตรวจสอบชื่อ/นามสกุล (แยกเช็คทีละช่อง)
// *** นี่คือฟังก์ชันที่ UI เรียกใช้ ถ้าไม่มีตัวนี้จะ Error ***
export const validateNameField = (text: string, fieldName: string = "ข้อมูล") => {
    if (!text || text.trim() === "") return { isValid: false, error: `กรุณาระบุ${fieldName}` }
    
    // Regex: อนุญาต ไทย, อังกฤษ และช่องว่าง (เผื่อชื่อภาษาอังกฤษที่มีเว้นวรรค)
    const charRegex = /^[a-zA-Zก-๙\s]+$/;
    
    if (!charRegex.test(text)) {
        return { isValid: false, error: "ห้ามมีตัวเลขหรือสัญลักษณ์พิเศษ" }
    }

    if (text.trim().length < 2) {
        return { isValid: false, error: "สั้นเกินไป" }
    }

    return { isValid: true, error: "" }
}