"use client"

import { useState, useRef } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { 
  Download, 
  Plus, 
  RotateCcw, 
  Trash2, 
  FileSpreadsheet,
  History
} from "lucide-react"
import * as XLSX from "xlsx"

// --- 1. Logic ส่วนการคำนวณ ---
interface CommissionBreakdown {
  tier1: number; tier2: number; tier3: number; total: number
}

const PRICE_LOCK = 45.0
const PRICE_STOCK = 30.0
const PRICE_BARREL = 25.0

const MAX_LOCKS = 70
const MAX_STOCKS = 80
const MAX_BARRELS = 90

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

const validateInput = (value: string, min: number, max: number) => {
  if (!value || value.trim() === "") return { isValid: false, error: "กรุณาระบุจำนวน" }
  const num = Number(value)
  if (isNaN(num)) return { isValid: false, error: "ต้องเป็นตัวเลข" }
  if (!Number.isInteger(num)) return { isValid: false, error: "ต้องเป็นจำนวนเต็ม" }
  if (num < min) return { isValid: false, error: `ขั้นต่ำคือ ${min}` }
  if (num > max) return { isValid: false, error: `สูงสุดคือ ${max}` }
  return { isValid: true, error: "" }
}

// --- 2. Main Component ---
interface InputState { value: string; error: string; isValid: boolean }
interface CalculationRecord {
  id: string; timestamp: Date; employeeId: string; employeeName: string;
  locks: number; stocks: number; barrels: number; sales: number; commission: CommissionBreakdown
}

export default function SalesCommissionCalculator() {
  const resultRef = useRef<HTMLDivElement>(null)

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

  const formatNumber = (val: number) => new Intl.NumberFormat('th-TH', { style: 'decimal', minimumFractionDigits: 2 }).format(val)

  const handleCalculate = () => {
    const l = parseInt(locks.value), s = parseInt(stocks.value), b = parseInt(barrels.value)
    const totalSales = calculateSales(l, s, b)
    setSales(totalSales)
    setCommission(calculateCommission(totalSales))
    setCalculated(true)

    setTimeout(() => {
      resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
    }, 100)
  }

  const handleSaveAndNew = () => {
    const newRecord: CalculationRecord = {
      id: Date.now().toString(), 
      timestamp: new Date(), 
      employeeId: employeeId.value,
      employeeName: `${firstName.value} ${lastName.value}`,
      locks: parseInt(locks.value), 
      stocks: parseInt(stocks.value), 
      barrels: parseInt(barrels.value),
      sales, 
      commission
    }
    setHistory([newRecord, ...history])
    setLocks({ value: "", error: "", isValid: false })
    setStocks({ value: "", error: "", isValid: false })
    setBarrels({ value: "", error: "", isValid: false })
    setCalculated(false)
  }

  // --- ฟังก์ชัน Export เป็น Excel ---
  const handleExportExcel = () => {
    if (history.length === 0) return;

    const exportData = history.map((r) => ({
      "วันที่/เวลา": r.timestamp.toLocaleString("th-TH"),
      "รหัสพนักงาน": r.employeeId,
      "ชื่อ-นามสกุล": r.employeeName,
      "ยอดขาย Locks": r.locks,
      "ยอดขาย Stocks": r.stocks,
      "ยอดขาย Barrels": r.barrels,
      "ยอดขายรวม (บาท)": r.sales,
      "คอมมิชชั่น Tier 1": r.commission.tier1,
      "คอมมิชชั่น Tier 2": r.commission.tier2,
      "คอมมิชชั่น Tier 3": r.commission.tier3,
      "คอมมิชชั่นรวมสุทธิ": r.commission.total,
    }))

    const worksheet = XLSX.utils.json_to_sheet(exportData)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "Commission Report")
    
    // สร้างไฟล์และดาวน์โหลด
    XLSX.writeFile(workbook, `Commission_Report_${new Date().toISOString().split('T')[0]}.xlsx`)
  }

  // --- ฟังก์ชันล้างประวัติ ---
  const handleClearHistory = () => {
    if (confirm("คุณแน่ใจหรือไม่ว่าต้องการล้างประวัติการคำนวณทั้งหมด?")) {
      setHistory([])
    }
  }

  const isFormValid = locks.isValid && stocks.isValid && barrels.isValid && employeeId.isValid && firstName.value && lastName.value

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 text-slate-900 font-sans">
      <div className="max-w-6xl mx-auto">
        
        {/* หัวข้อระบบ */}
        <div className="flex items-center justify-center gap-3 mb-10">
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-800 uppercase">ระบบคำนวณค่าคอมมิชชั่น</h1>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* ส่วนซ้าย (ข้อมูลพนักงาน + รายการสินค้า + ผลลัพธ์) */}
          <div className="lg:w-2/3 space-y-8">
            
            {/* 1. ข้อมูลพนักงาน */}
            <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm w-full">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold">ข้อมูลพนักงาน</h2>
                    <Button variant="ghost" size="sm" onClick={() => window.location.reload()} className="text-slate-400 hover:text-purple-600">
                      <RotateCcw className="w-4 h-4 mr-1"/> รีเซ็ตหน้าจอ
                    </Button>
                </div>
                <div className="space-y-6">
                    <div className="w-full max-w-[300px]">
                        <label className="text-sm font-bold block mb-1">รหัสพนักงาน</label>
                        <Input 
                          value={employeeId.value} 
                          onChange={(e) => setEmployeeId({
                            value: e.target.value.toUpperCase().replace(/\s/g, ''), 
                            error: "", 
                            isValid: e.target.value.length >= 3
                          })} 
                          className={employeeId.error ? "border-red-500" : ""} 
                          placeholder="EMP001" 
                        />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                        <div className="w-full">
                            <label className="text-sm font-bold block mb-1">ชื่อ</label>
                            <Input 
                              value={firstName.value} 
                              onChange={(e) => setFirstName({ ...firstName, value: e.target.value })} 
                              placeholder="ชื่อ" 
                              className="w-full"
                            />
                        </div>
                        <div className="w-full">
                            <label className="text-sm font-bold block mb-1">นามสกุล</label>
                            <Input 
                              value={lastName.value} 
                              onChange={(e) => setLastName({ ...lastName, value: e.target.value })} 
                              placeholder="นามสกุล" 
                              className="w-full"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* 2. รายการสินค้า */}
            <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm w-full">
                <h2 className="text-xl font-bold mb-6">รายการสินค้า</h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8 w-full">
                    {[
                        { label: "Locks", max: MAX_LOCKS, s: locks, setter: setLocks, color: "bg-purple-50" },
                        { label: "Stocks", max: MAX_STOCKS, s: stocks, setter: setStocks, color: "bg-purple-50" },
                        { label: "Barrels", max: MAX_BARRELS, s: barrels, setter: setBarrels, color: "bg-purple-50" }
                    ].map((item, idx) => (
                        <div key={idx} className={`p-4 rounded-lg border border-slate-100 ${item.color} w-full`}>
                            <label className="text-xs font-bold text-slate-600 block mb-1">{item.label}</label>
                            <Input 
                              type="number" 
                              value={item.s.value} 
                              onChange={(e) => {
                                const val = validateInput(e.target.value, 1, item.max)
                                item.setter({ value: e.target.value, error: val.error, isValid: val.isValid })
                              }} 
                              className="bg-white w-full"
                              placeholder={`1-${item.max}`} 
                            />
                            {item.s.error && <p className="text-red-500 text-[10px] mt-1 font-medium">{item.s.error}</p>}
                        </div>
                    ))}
                </div>
                <Button 
                  onClick={handleCalculate} 
                  disabled={!isFormValid} 
                  className="w-full bg-purple-600 hover:bg-purple-700 h-12 rounded-full font-bold text-white shadow-lg transition-all"
                >
                  คำนวณค่าคอมมิชชั่น
                </Button>
            </div>

            {/* 3. ส่วนผลลัพธ์ */}
            {calculated && (
                <div ref={resultRef} className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm scroll-mt-10 animate-in fade-in slide-in-from-bottom-4 w-full">
                    <div className="flex justify-between items-center mb-8">
                        <h2 className="text-2xl font-bold text-slate-800">สรุปยอด</h2>
                        <div className="flex gap-2">
                            <Button onClick={handleSaveAndNew} className="bg-purple-600 hover:bg-purple-700 text-white h-10 px-6 rounded-full font-bold">
                              <Plus className="w-4 h-4 mr-2"/> บันทึกข้อมูล
                            </Button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start w-full">
                        <div className="flex flex-col w-full px-2">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">ยอดขายรวมทั้งหมด</p>
                            <div className="flex flex-row items-baseline gap-2 leading-tight">
                                <span className="text-4xl font-black text-slate-800 tracking-tight">
                                    {formatNumber(sales)}
                                </span>
                                <span className="text-xl font-black text-slate-800">
                                    บาท
                                </span>
                            </div>
                        </div>
                        <div className="bg-purple-600 p-6 rounded-xl text-white relative shadow-lg shadow-purple-100 overflow-hidden w-full">
                            <p className="text-xs font-bold text-purple-100 uppercase mb-1 tracking-widest">คอมมิชชั่นที่ได้รับ</p>
                            <p className="text-3xl font-black mb-6">{formatNumber(commission.total)} บาท</p>
                            <div className="pt-4 border-t border-purple-400 text-[10px] font-bold text-purple-100 flex justify-between uppercase">
                                <span>T1: {formatNumber(commission.tier1)}</span>
                                <span>T2: {formatNumber(commission.tier2)}</span>
                                <span>T3: {formatNumber(commission.tier3)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
          </div>
          
          {/* ส่วนประวัติ (Sidebar) */}
          <div className="lg:w-1/3">
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm h-fit sticky top-8 w-full">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <History className="w-5 h-5 text-purple-600"/> ประวัติการบันทึก
                </h2>
                <div className="flex gap-1">
                  <Button 
                    variant="outline" 
                    size="icon" 
                    onClick={handleExportExcel} 
                    disabled={history.length === 0}
                    className="h-8 w-8 text-emerald-600 border-emerald-100 hover:bg-emerald-50"
                    title="Export to Excel"
                  >
                    <FileSpreadsheet className="w-4 h-4"/>
                  </Button>
                  <Button 
                    variant="outline" 
                    size="icon" 
                    onClick={handleClearHistory} 
                    disabled={history.length === 0}
                    className="h-8 w-8 text-red-400 border-red-50 hover:bg-red-50"
                    title="Clear History"
                  >
                    <Trash2 className="w-4 h-4"/>
                  </Button>
                </div>
              </div>

              <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                  {history.length === 0 ? (
                    <div className="text-center py-10 text-slate-400 text-sm border-2 border-dashed border-slate-100 rounded-lg">
                      <p>ไม่มีประวัติการบันทึก</p>
                    </div>
                  ) : (
                    history.map(r => (
                      <div key={r.id} className="p-4 bg-slate-50 rounded-lg border border-slate-100 hover:border-purple-200 transition-colors group">
                          <div className="flex justify-between items-start mb-2">
                              <span className="font-bold text-sm text-slate-700 truncate max-w-[120px]">{r.employeeName}</span>
                              <span className="text-purple-600 font-bold text-sm">+{formatNumber(r.commission.total)}</span>
                          </div>
                          <div className="text-[11px] text-slate-500 mb-2 flex items-center justify-between">
                              <span className="bg-white px-1.5 py-0.5 rounded border border-slate-200 font-bold uppercase">{r.employeeId}</span>
                              <span>ยอดขาย: {formatNumber(r.sales)}</span>
                          </div>
                          <div className="text-[10px] text-slate-400 flex justify-between border-t border-slate-200/60 pt-2 mt-2">
                              <span>L:{r.locks} S:{r.stocks} B:{r.barrels}</span>
                              <span>{r.timestamp.toLocaleTimeString("th-TH", { hour: '2-digit', minute: '2-digit' })} น.</span>
                          </div>
                      </div>
                    ))
                  )}
              </div>

              {history.length > 0 && (
                <Button 
                  variant="ghost" 
                  onClick={handleExportExcel}
                  className="w-full mt-4 text-xs font-bold text-emerald-600 hover:bg-emerald-50 flex items-center justify-center gap-2"
                >
                  <Download className="w-3 h-3"/> ดาวน์โหลดรายงาน Excel
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}