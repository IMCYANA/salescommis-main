"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Download, Plus, Trash2, User, IdCard, RotateCcw, AlertCircle } from "lucide-react"
import * as XLSX from "xlsx"

// --- 1. ส่วนของ Logic คำนวณและตรวจสอบ (รวมไว้ที่นี่เลย) ---

interface CommissionBreakdown {
  tier1: number; tier2: number; tier3: number; total: number
}

const PRICE_LOCK = 45.0
const PRICE_STOCK = 30.0
const PRICE_BARREL = 25.0

const calculateSales = (locks: number, stocks: number, barrels: number): number => {
  return (locks * PRICE_LOCK) + (stocks * PRICE_STOCK) + (barrels * PRICE_BARREL)
}

const calculateCommission = (sales: number): CommissionBreakdown => {
  let remainingSales = sales
  let tier1 = 0, tier2 = 0, tier3 = 0

  if (remainingSales > 1000) { tier1 = 1000 * 0.10; remainingSales -= 1000 } 
  else { tier1 = remainingSales * 0.10; remainingSales = 0 }

  if (remainingSales > 800) { tier2 = 800 * 0.15; remainingSales -= 800 } 
  else { tier2 = remainingSales * 0.15; remainingSales = 0 }

  if (remainingSales > 0) { tier3 = remainingSales * 0.20 }

  return { tier1, tier2, tier3, total: tier1 + tier2 + tier3 }
}

// Validation Functions
const validateInput = (value: string, min: number, max: number) => {
  if (!value || value.trim() === "") return { isValid: false, error: "กรุณาระบุจำนวน" }
  if (/\s/.test(value)) return { isValid: false, error: "ห้ามเว้นวรรค" }
  const num = Number(value)
  if (isNaN(num)) return { isValid: false, error: "ต้องเป็นตัวเลขเท่านั้น" }
  if (!Number.isInteger(num)) return { isValid: false, error: "ต้องเป็นจำนวนเต็ม" }
  if (num < min) return { isValid: false, error: `ค่าต้องอยู่ระหว่าง ${min}-${max}` }
  if (num > max) return { isValid: false, error: `ค่าต้องไม่เกิน ${max}` }
  return { isValid: true, error: "" }
}

const validateEmployeeId = (id: string) => {
    if (!id || id.trim() === "") return { isValid: false, error: "กรุณาระบุรหัส" }
    const regex = /^[a-zA-Z0-9]+$/;
    if (/\s/.test(id)) return { isValid: false, error: "ห้ามมีช่องว่าง" }
    if (!regex.test(id)) return { isValid: false, error: "ใช้ภาษาอังกฤษ/ตัวเลขเท่านั้น" }
    if (id.length < 3) return { isValid: false, error: "สั้นเกินไป (3-10 ตัวอักษร)" }
    if (id.length > 10) return { isValid: false, error: "ยาวเกินไป (ไม่เกิน 10 ตัวอักษร)" }
    return { isValid: true, error: "" }
}

const validateNameField = (text: string, fieldName: string) => {
    if (!text || text.trim() === "") return { isValid: false, error: `กรุณาระบุ${fieldName}` }
    const charRegex = /^[a-zA-Zก-๙\s]+$/;
    if (!charRegex.test(text)) return { isValid: false, error: "ห้ามมีตัวเลข/สัญลักษณ์" }
    if (text.trim().length < 2) return { isValid: false, error: "สั้นเกินไป" }
    return { isValid: true, error: "" }
}

// --- 2. ส่วนของ UI หน้าจอ ---

interface InputState { value: string; error: string; isValid: boolean }
interface CalculationRecord {
  id: string; timestamp: Date; employeeId: string; employeeName: string;
  locks: number; stocks: number; barrels: number; sales: number; commission: CommissionBreakdown
}

export default function SalesCommissionCalculator() {
  const [employeeId, setEmployeeId] = useState<InputState>({ value: "", error: "", isValid: false })
  const [firstName, setFirstName] = useState<InputState>({ value: "", error: "", isValid: false })
  const [lastName, setLastName] = useState<InputState>({ value: "", error: "", isValid: false })

  const [locks, setLocks] = useState<InputState>({ value: "", error: "", isValid: false })
  const [stocks, setStocks] = useState<InputState>({ value: "", error: "", isValid: false })
  const [barrels, setBarrels] = useState<InputState>({ value: "", error: "", isValid: false })
  
  const [calculated, setCalculated] = useState(false)
  const [sales, setSales] = useState(0)
  const [commission, setCommission] = useState({ tier1: 0, tier2: 0, tier3: 0, total: 0 })
  const [history, setHistory] = useState<CalculationRecord[]>([])

  const handleIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value.toUpperCase()
      const val = validateEmployeeId(value)
      setEmployeeId({ value, error: val.error, isValid: val.isValid })
  }
  const handleName = (e: React.ChangeEvent<HTMLInputElement>, isFirst: boolean) => {
      const val = validateNameField(e.target.value, isFirst ? "ชื่อ" : "นามสกุล")
      if (isFirst) setFirstName({ value: e.target.value, error: val.error, isValid: val.isValid })
      else setLastName({ value: e.target.value, error: val.error, isValid: val.isValid })
  }
  const handleNum = (e: React.ChangeEvent<HTMLInputElement>, max: number, setter: any) => {
      const val = validateInput(e.target.value, 1, max)
      setter({ value: e.target.value, error: val.error, isValid: val.isValid })
      setCalculated(false)
  }

  const handleCalculate = () => {
    const l = parseInt(locks.value), s = parseInt(stocks.value), b = parseInt(barrels.value)
    const totalSales = calculateSales(l, s, b)
    setSales(totalSales)
    setCommission(calculateCommission(totalSales))
    setCalculated(true)
  }

  const handleSaveAndNew = () => {
    const fullName = `${firstName.value.trim()} ${lastName.value.trim()}`
    const newRecord = {
      id: Date.now().toString(), timestamp: new Date(), employeeId: employeeId.value, employeeName: fullName,
      locks: parseInt(locks.value), stocks: parseInt(stocks.value), barrels: parseInt(barrels.value),
      sales, commission
    }
    setHistory([newRecord, ...history])
    // Reset Form
    setLocks({ value: "", error: "", isValid: false })
    setStocks({ value: "", error: "", isValid: false })
    setBarrels({ value: "", error: "", isValid: false })
    setCalculated(false)
  }

  const handleDownloadCurrent = () => {
    const fullName = `${firstName.value.trim()} ${lastName.value.trim()}`
    const l = parseInt(locks.value), s = parseInt(stocks.value), b = parseInt(barrels.value)
    const data = [
        ["Report"], ["Date", new Date().toLocaleString()], ["ID", employeeId.value], ["Name", fullName], [],
        ["Item", "Qty", "Price", "Total"],
        ["Locks", l, 45, l*45], ["Stocks", s, 30, s*30], ["Barrels", b, 25, b*25], [],
        ["Total Sales", sales], ["Commission", commission.total]
    ]
    const wb = XLSX.utils.book_new(), ws = XLSX.utils.aoa_to_sheet(data)
    XLSX.utils.book_append_sheet(wb, ws, "Report")
    XLSX.writeFile(wb, "report.xlsx")
  }

  const isFormValid = locks.isValid && stocks.isValid && barrels.isValid && employeeId.isValid && firstName.isValid && lastName.isValid

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 font-sans text-slate-900">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-center text-blue-700 mb-8">ระบบคำนวณค่าคอมมิชชั่น</h1>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white p-8 rounded-xl shadow border border-slate-200">
                <div className="flex justify-between mb-6">
                    <h2 className="text-xl font-bold">ข้อมูลพนักงาน</h2>
                    <Button variant="ghost" size="sm" onClick={() => window.location.reload()}><RotateCcw className="w-4 h-4 mr-1"/> รีเซ็ต</Button>
                </div>
                <div className="space-y-4">
                    <div>
                        <label className="text-sm font-bold block mb-1">รหัสพนักงาน</label>
                        <Input value={employeeId.value} onChange={handleIdChange} className={employeeId.error ? "border-red-500 bg-red-50" : ""} placeholder="EMP001" />
                        {employeeId.error && <p className="text-red-500 text-xs mt-1 flex gap-1"><AlertCircle className="w-3 h-3"/>{employeeId.error}</p>}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-bold block mb-1">ชื่อ</label>
                            <Input value={firstName.value} onChange={(e) => handleName(e, true)} className={firstName.error ? "border-red-500 bg-red-50" : ""} />
                            {firstName.error && <p className="text-red-500 text-xs mt-1">{firstName.error}</p>}
                        </div>
                        <div>
                            <label className="text-sm font-bold block mb-1">นามสกุล</label>
                            <Input value={lastName.value} onChange={(e) => handleName(e, false)} className={lastName.error ? "border-red-500 bg-red-50" : ""} />
                            {lastName.error && <p className="text-red-500 text-xs mt-1">{lastName.error}</p>}
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white p-8 rounded-xl shadow border border-slate-200">
                <h2 className="text-xl font-bold mb-6">รายการสินค้า</h2>
                <div className="grid grid-cols-3 gap-4">
                    {[
                        { l: "Locks", max: 70, p: 45, s: locks, f: (e:any)=>handleNum(e, 70, setLocks) },
                        { l: "Stocks", max: 80, p: 30, s: stocks, f: (e:any)=>handleNum(e, 80, setStocks) },
                        { l: "Barrels", max: 90, p: 25, s: barrels, f: (e:any)=>handleNum(e, 90, setBarrels) }
                    ].map((i, idx) => (
                        <div key={idx}>
                            <label className="text-sm font-medium block mb-1">{i.l}</label>
                            <Input type="number" value={i.s.value} onChange={i.f} className={i.s.error ? "border-red-500 bg-red-50" : ""} placeholder={`Max ${i.max}`}/>
                            {i.s.error && <p className="text-red-500 text-xs mt-1">{i.s.error}</p>}
                        </div>
                    ))}
                </div>
                <Button onClick={handleCalculate} disabled={!isFormValid} className="w-full mt-6 bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl">
                    คำนวณ
                </Button>
            </div>

            {calculated && (
                <div className="bg-white p-8 rounded-xl shadow border border-slate-200 animate-in slide-in-from-bottom-2">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold">ผลลัพธ์</h2>
                        <div className="flex gap-2">
                            <Button onClick={handleDownloadCurrent} variant="outline" size="sm"><Download className="w-4 h-4 mr-1"/> Excel</Button>
                            <Button onClick={handleSaveAndNew} size="sm" className="bg-green-600 hover:bg-green-700 text-white"><Plus className="w-4 h-4 mr-1"/> Save & New</Button>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-slate-50 rounded-lg">
                            <p className="text-xs text-slate-500 font-bold uppercase">ยอดขายรวม</p>
                            <p className="text-3xl font-bold text-slate-800">${sales.toLocaleString()}</p>
                        </div>
                        <div className="p-4 bg-blue-600 rounded-lg text-white">
                            <p className="text-xs text-blue-100 font-bold uppercase">คอมมิชชั่นสุทธิ</p>
                            <p className="text-3xl font-bold">${commission.total.toLocaleString()}</p>
                            <div className="text-xs mt-2 pt-2 border-t border-blue-400 space-y-1">
                                <p>T1: ${commission.tier1} | T2: ${commission.tier2} | T3: ${commission.tier3}</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow border border-slate-200 h-fit">
            <h2 className="font-bold mb-4">ประวัติ ({history.length})</h2>
            <div className="space-y-3 max-h-[600px] overflow-auto">
                {history.length === 0 && <p className="text-center text-slate-400 py-10">ไม่มีรายการ</p>}
                {history.map(r => (
                    <div key={r.id} className="p-3 bg-slate-50 rounded border text-xs">
                        <div className="flex justify-between font-bold text-slate-700">
                            <span>{r.employeeName}</span>
                            <span className="text-green-600">${r.commission.total}</span>
                        </div>
                        <div className="flex justify-between text-slate-400 mt-1">
                            <span>{r.employeeId}</span>
                            <span>Sales: ${r.sales}</span>
                        </div>
                    </div>
                ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 