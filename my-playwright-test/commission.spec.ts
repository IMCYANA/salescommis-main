import { test, expect } from '@playwright/test';

test('ทดสอบระบบคำนวณค่าคอมมิชชั่น - เคสปกติ (Locks 10, Stocks 20, Barrels 30)', async ({ page }) => {
  // 1. ไปที่หน้าเว็บระบบ
  // ตรวจสอบว่าคุณได้รัน npm run dev ทิ้งไว้ที่ Terminal อีกตัวหนึ่งแล้ว
  await page.goto('http://localhost:3000');

  // 2. กรอกข้อมูลพนักงาน
  // ใช้ Placeholder ให้ตรงกับที่กำหนดไว้ในไฟล์ React
  await page.getByPlaceholder('EMP001').fill('EMP66827');
  await page.getByPlaceholder('ชื่อภาษาไทย/อังกฤษ').fill('Somchai');
  await page.getByPlaceholder('นามสกุล').fill('ใจดี');

  // 3. กรอกรายการสินค้า
  // ใช้ค่าขอบเขต (Boundary Value) ตามที่ระบบระบุไว้ใน Placeholder
  await page.getByPlaceholder('1-70').fill('10'); // Locks
  await page.getByPlaceholder('1-80').fill('20'); // Stocks
  await page.getByPlaceholder('1-90').fill('30'); // Barrels

  // 4. ดำเนินการคำนวณ
  // กดปุ่มคำนวณเพื่อเริ่มกระบวนการ Dynamic Analysis
  await page.getByRole('button', { name: 'คำนวณ' }).click();

  // 5. การตรวจสอบผลลัพธ์ (Assertion)
  // ตรวจสอบยอดขายรวม: (10*45) + (20*30) + (30*25) = 1,800.00 บาท
  await expect(page.getByText('1,800.00')).toBeVisible();
  
  // ตรวจสอบว่าระบบแสดงปุ่มสำหรับขั้นตอนถัดไปหรือไม่
  await expect(page.getByRole('button', { name: 'Save & New' })).toBeVisible();

  // 6. ทดสอบการบันทึกประวัติ (เพิ่มเพื่อให้รายงานสมบูรณ์)
  await page.getByRole('button', { name: 'Save & New' }).click();
  
  // ตรวจสอบว่ารายการถูกเพิ่มเข้าไปใน "ประวัติล่าสุด" หรือไม่
  const historyItem = page.locator('div:has-text("Somchai ใจดี")').first();
  await expect(historyItem).toBeVisible();
  await expect(page.getByText('1,800 บาท')).toBeVisible();
});