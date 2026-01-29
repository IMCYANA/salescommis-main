"use client";

import { useState, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Download,
  Plus,
  RotateCcw,
  Calculator,
  Trash2,
  CheckSquare,
  Square,
} from "lucide-react";
import * as XLSX from "xlsx";

// --- 1. Logic ส่วนการคำนวณ (คงเดิม) ---
interface CommissionBreakdown {
  tier1: number;
  tier2: number;
  tier3: number;
  total: number;
}
const PRICE_LOCK = 45.0,
  PRICE_STOCK = 30.0,
  PRICE_BARREL = 25.0;
const MAX_LOCKS = 70,
  MAX_STOCKS = 80,
  MAX_BARRELS = 90;

const calculateSales = (
  locks: number,
  stocks: number,
  barrels: number,
): number => locks * PRICE_LOCK + stocks * PRICE_STOCK + barrels * PRICE_BARREL;

const calculateCommission = (sales: number): CommissionBreakdown => {
  let remainingSales = sales;
  let tier1 = 0,
    tier2 = 0,
    tier3 = 0;
  if (remainingSales > 1000) {
    tier1 = 1000 * 0.1;
    remainingSales -= 1000;
  } else {
    tier1 = remainingSales * 0.1;
    remainingSales = 0;
  }
  if (remainingSales > 800) {
    tier2 = 800 * 0.15;
    remainingSales -= 800;
  } else {
    tier2 = remainingSales * 0.15;
    remainingSales = 0;
  }
  if (remainingSales > 0) {
    tier3 = remainingSales * 0.2;
  }
  return { tier1, tier2, tier3, total: tier1 + tier2 + tier3 };
};

const validateInput = (value: string, min: number, max: number) => {
  if (!value || value.trim() === "")
    return { isValid: false, error: "กรุณาระบุจำนวน" };
  const num = Number(value);
  if (isNaN(num) || !Number.isInteger(num))
    return { isValid: false, error: "ต้องเป็นจำนวนเต็ม" };
  if (num < min || num > max) return { isValid: false, error: `${min}-${max}` };
  return { isValid: true, error: "" };
};

// --- 2. Main Component ---
interface InputState {
  value: string;
  error: string;
  isValid: boolean;
}
interface CalculationRecord {
  id: string;
  timestamp: Date;
  employeeId: string;
  employeeName: string;
  locks: number;
  stocks: number;
  barrels: number;
  sales: number;
  commission: CommissionBreakdown;
}

export default function SalesCommissionCalculator() {
  const resultRef = useRef<HTMLDivElement>(null);
  const [employeeId, setEmployeeId] = useState<InputState>({
    value: "",
    error: "",
    isValid: false,
  });
  const [firstName, setFirstName] = useState<InputState>({
    value: "",
    error: "",
    isValid: false,
  });
  const [lastName, setLastName] = useState<InputState>({
    value: "",
    error: "",
    isValid: false,
  });
  const [locks, setLocks] = useState<InputState>({
    value: "",
    error: "",
    isValid: false,
  });
  const [stocks, setStocks] = useState<InputState>({
    value: "",
    error: "",
    isValid: false,
  });
  const [barrels, setBarrels] = useState<InputState>({
    value: "",
    error: "",
    isValid: false,
  });

  const [calculated, setCalculated] = useState(false);
  const [sales, setSales] = useState(0);
  const [commission, setCommission] = useState({
    tier1: 0,
    tier2: 0,
    tier3: 0,
    total: 0,
  });
  const [history, setHistory] = useState<CalculationRecord[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const formatNumber = (val: number) =>
    new Intl.NumberFormat("th-TH", {
      style: "decimal",
      minimumFractionDigits: 2,
    }).format(val);

  const handleCalculate = () => {
    const totalSales = calculateSales(
      Number(locks.value),
      Number(stocks.value),
      Number(barrels.value),
    );
    setSales(totalSales);
    setCommission(calculateCommission(totalSales));
    setCalculated(true);
    setTimeout(
      () =>
        resultRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        }),
      100,
    );
  };

  const handleSaveAndNew = () => {
    const newRecord: CalculationRecord = {
      id: Date.now().toString(),
      timestamp: new Date(),
      employeeId: employeeId.value,
      employeeName: `${firstName.value} ${lastName.value}`,
      locks: Number(locks.value),
      stocks: Number(stocks.value),
      barrels: Number(barrels.value),
      sales,
      commission,
    };
    setHistory([newRecord, ...history]);
    setLocks({ value: "", error: "", isValid: false });
    setStocks({ value: "", error: "", isValid: false });
    setBarrels({ value: "", error: "", isValid: false });
    setCalculated(false);
  };

  const handleDeleteSelected = () => {
    setHistory(history.filter((r) => !selectedIds.includes(r.id)));
    setSelectedIds([]);
  };

  const handleClearAll = () => {
    if (confirm("คุณต้องการลบประวัติทั้งหมดใช่หรือไม่?")) {
      setHistory([]);
      setSelectedIds([]);
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((sid) => sid !== id) : [...prev, id],
    );
  };

  const handleExportExcel = () => {
    if (history.length === 0) return;
    const data = history.map((item) => ({
      วันที่: item.timestamp.toLocaleString("th-TH"),
      รหัสพนักงาน: item.employeeId,
      ชื่อ: item.employeeName,
      Locks: item.locks,
      Stocks: item.stocks,
      Barrels: item.barrels,
      ยอดขาย: item.sales,
      ค่าคอม: item.commission.total,
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Report");
    XLSX.writeFile(wb, `Report_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const isFormValid =
    locks.isValid &&
    stocks.isValid &&
    barrels.isValid &&
    employeeId.isValid &&
    firstName.value.trim() !== "" &&
    lastName.value.trim() !== "";

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 text-slate-900 font-sans">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-center gap-3 mb-10">
          <Calculator className="w-8 h-8 text-purple-600" />
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-800 uppercase">
            โปรแกรมคำนวณคอมมิชชั่น
          </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            {/* ส่วนข้อมูลพนักงาน */}
            <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">ข้อมูลพนักงาน</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => window.location.reload()}
                  className="text-slate-400 hover:text-purple-600"
                >
                  <RotateCcw className="w-4 h-4 mr-1" /> รีเซ็ต
                </Button>
              </div>
              <div className="space-y-6">
                <div className="max-w-[calc(50%-12px)]">
                  <label className="text-sm font-bold block mb-1">
                    รหัสพนักงาน
                  </label>
                  
                  <Input
                    value={employeeId.value}
                    onChange={(e) =>
                      setEmployeeId({
                        value: e.target.value.toUpperCase().replace(/\s/g, ""),
                        error: "",
                        isValid: e.target.value.length >= 3,
                      })
                    }
                    placeholder="EMP001"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Input
                    value={firstName.value}
                    onChange={(e) =>
                      setFirstName({
                        ...firstName,
                        value: e.target.value,
                        isValid: !!e.target.value,
                      })
                    }
                    placeholder="ชื่อ"
                  />
                  <Input
                    value={lastName.value}
                    onChange={(e) =>
                      setLastName({
                        ...lastName,
                        value: e.target.value,
                        isValid: !!e.target.value,
                      })
                    }
                    placeholder="นามสกุล"
                  />
                </div>
              </div>
            </div>

            {/* รายการสินค้า */}
            <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm">
              <h2 className="text-xl font-bold mb-6">รายการสินค้า</h2>
              <div className="grid grid-cols-3 gap-6 mb-8">
                {[
                  {
                    label: "Locks",
                    max: MAX_LOCKS,
                    s: locks,
                    setter: setLocks,
                    color: "bg-purple-50",
                  },
                  {
                    label: "Stocks",
                    max: MAX_STOCKS,
                    s: stocks,
                    setter: setStocks,
                    color: "bg-purple-50",
                  },
                  {
                    label: "Barrels",
                    max: MAX_BARRELS,
                    s: barrels,
                    setter: setBarrels,
                    color: "bg-purple-50",
                  },
                ].map((item, idx) => (
                  <div
                    key={idx}
                    className={`p-4 rounded-lg border border-slate-100 ${item.color}`}
                  >
                    <label className="text-xs font-bold text-slate-600 block mb-1">
                      {item.label}
                    </label>
                    <Input
                      type="number"
                      value={item.s.value}
                      onChange={(e) => {
                        const val = validateInput(e.target.value, 1, item.max);
                        item.setter({
                          value: e.target.value,
                          error: val.error,
                          isValid: val.isValid,
                        });
                      }}
                      placeholder={`1-${item.max}`}
                    />
                    {item.s.error && (
                      <p className="text-red-500 text-[10px] mt-1">
                        {item.s.error}
                      </p>
                    )}
                  </div>
                ))}
              </div>
              <Button
                onClick={handleCalculate}
                disabled={!isFormValid}
                className="w-full bg-purple-600 hover:bg-purple-700 h-12 rounded-full font-bold"
              >
                คำนวณ
              </Button>
            </div>

            {/* ผลลัพธ์ */}
            {calculated && (
              <div
                ref={resultRef}
                className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm animate-in fade-in slide-in-from-bottom-4"
              >
                <div className="flex justify-between items-center mb-8">
                  <h2 className="text-2xl font-bold">ผลลัพธ์</h2>
                  <Button
                    onClick={handleSaveAndNew}
                    className="bg-purple-600 font-bold"
                  >
                    <Plus className="w-4 h-4 mr-2" /> บันทึกประวัติ
                  </Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      ยอดขายรวม
                    </p>
                    <p className="text-4xl font-black text-slate-800">
                      {formatNumber(sales)} <span className="text-xl">USD</span>
                    </p>
                  </div>
                  <div className="bg-purple-600 p-6 rounded-xl text-white shadow-lg shadow-purple-100">
                    <p className="text-xs font-bold text-purple-100 uppercase mb-1">
                      คอมมิชชั่นสุทธิ
                    </p>
                    <p className="text-3xl font-black">
                      {formatNumber(commission.total)} USD
                    </p>
                    <div className="pt-4 mt-4 border-t border-purple-400 text-[10px] flex justify-between font-bold text-purple-100">
                      <span>Tier1: {formatNumber(commission.tier1)}</span>
                      <span>Tier2: {formatNumber(commission.tier2)}</span>
                      <span>Tier3: {formatNumber(commission.tier3)}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ส่วนประวัติ (ไม่มีปุ่มลบรายบุคคลแล้ว) */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm h-fit sticky top-8">
            <div className="flex flex-col gap-4 mb-4">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-bold text-slate-700 flex items-center gap-2">
                  ประวัติล่าสุด{" "}
                  <span className="bg-purple-100 text-purple-600 text-xs px-2.5 py-1 rounded-full">
                    {history.length}
                  </span>
                </h2>
                <div className="flex gap-1">
                  {history.length > 0 && (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleExportExcel}
                        className="text-purple-600 hover:bg-purple-50"
                        title="Excel"
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleClearAll}
                        className="text-red-400 hover:text-red-600 hover:bg-red-50"
                        title="ลบทั้งหมด"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </Button>
                    </>
                  )}
                </div>
              </div>

              {selectedIds.length > 0 && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleDeleteSelected}
                  className="w-full text-xs font-bold animate-in zoom-in-95"
                >
                  <Trash2 className="w-3.5 h-3.5 mr-2" /> ลบที่เลือก (
                  {selectedIds.length})
                </Button>
              )}
            </div>

            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
              {history.length === 0 ? (
                <div className="text-center py-10 border-2 border-dashed border-slate-100 rounded-xl text-slate-400 text-sm italic">
                  ยังไม่มีรายการบันทึก
                </div>
              ) : (
                history.map((r) => (
                  <div
                    key={r.id}
                    onClick={() => toggleSelect(r.id)}
                    className={`p-4 rounded-lg border transition-all relative flex gap-3 cursor-pointer ${selectedIds.includes(r.id) ? "bg-purple-50 border-purple-200" : "bg-slate-50 border-slate-100 hover:border-purple-200"}`}
                  >
                    <div className="pt-1">
                      {selectedIds.includes(r.id) ? (
                        <CheckSquare className="w-4 h-4 text-purple-600" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-300" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between font-bold text-sm">
                        <span className="truncate pr-2 text-slate-700">
                          {r.employeeName}
                        </span>
                        <span className="text-purple-600">
                          +{r.commission.total.toFixed(2)} $  
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1 font-bold uppercase">
                        {r.employeeId} • ยอด {r.sales.toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
