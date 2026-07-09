# SHOW OFF — Codex Handoff Context

ไฟล์นี้คือเอกสารส่งต่อสำหรับเปิดงานในคอมใหม่ ให้ Codex อ่านไฟล์นี้ก่อนเริ่มแก้โค้ดทุกครั้ง เพื่อไม่ต้องอธิบายระบบใหม่ทั้งหมด

## วิธีใช้บนคอมใหม่

1. เปิดโปรเจกต์นี้ใน Codex ที่คอมใหม่
2. ส่งข้อความแรกประมาณนี้:

   > อ่าน `CODEX_HANDOFF.md` ก่อน แล้วทำงานต่อจากระบบ SHOW OFF ตาม context นี้ ห้ามเดาหรือรื้อของเดิมโดยไม่จำเป็น

3. ถ้าจะให้แก้ UI ให้ย้ำว่า:

   > ใช้แนวทาง `$impeccable` และรักษาฟังก์ชันเดิมทั้งหมด

## คำสั่งหลัก

- เปิด dev:

  ```bash
  npm run dev
  ```

- หน้าเว็บหลัก:

  ```text
  http://127.0.0.1:3000/en
  ```

- หน้าแอดมิน:

  ```text
  http://127.0.0.1:3000/admin
  ```

- build/sync admin static reference:

  ```bash
  npm run admin:ref:build
  ```

## ภาพรวมระบบ

SHOW OFF เป็นเว็บขายเสื้อผ้า + ระบบหลังบ้าน มีสองส่วนหลัก:

- Storefront / หน้าร้าน: Next.js อยู่ใน `app/`
- Admin dashboard: UI static reference อยู่ใน `.admin-ui-reference/` แล้ว build/sync ไป `public/admin-static/`

ระบบใช้ Supabase เป็นฐานข้อมูล/Storage/Auth บางส่วน

## กฎสำคัญที่ต้องรักษา

### 1. ฟอนต์

- หลังบ้านทั้งหมดต้องใช้ภาษาลาวเป็นหลัก
- ฟอนต์ลาวต้องเป็น Defago / Noto Sans Lao
- แอดมิน static app ต้องโหลดฟอนต์เองจาก:

  ```text
  /admin-static/fonts/noto-sans-lao-lao.woff2
  /admin-static/fonts/noto-sans-lao-latin.woff2
  /admin-static/fonts/noto-sans-lao-latin-ext.woff2
  ```

- ถ้าภาษาลาวเพี้ยน ให้เช็ก `.admin-ui-reference/src/styles/fonts.css`

### 2. ห้ามรื้อ UI/โครงสร้างมั่ว

เจ้าของโปรเจกต์ไม่ต้องการเปลี่ยนธีม สี หรือโครงสร้างโดยไม่สั่ง ต้องรักษาหน้าตาเดิม แต่ปรับให้ premium / Apple-like ได้เมื่อสั่ง

หลัก UI หลังบ้าน:

- Modern soft-rounded UI
- มุมโค้งนุ่ม
- soft shadow ไม่แข็ง
- spacing โปร่ง อ่านง่าย
- ไม่เปลี่ยน business logic โดยไม่จำเป็น

### 3. สินค้าและ stock ต้องเป็นข้อมูลจริง

หน้าเว็บหลักต้องอิงสินค้าจริงจากหลังบ้านเท่านั้น ห้ามโชว์ demo product เก่าที่ไม่มีในระบบ

ถ้าหมวดหมู่ไหนไม่มีสินค้า ให้แสดงข้อความภาษาอังกฤษประมาณ:

```text
No products yet
```

### 4. Product card บนหน้าร้าน

กฎนี้สำคัญมาก:

- รูป card สินค้าใช้สัดส่วน 1920x2400 หรือ 4:5
- card กับรูปต้องตรงกัน ห้าม crop ห้าม zoom ห้ามเลื่อนตำแหน่งมั่ว
- ถ้ารูป upload ถูกขนาดแล้ว หน้าเว็บต้องแสดงเต็มตามต้นฉบับ
- มีเส้นแบ่งบาง ๆ ระหว่าง card ได้เท่าที่เคยตกลงไว้ แต่ห้ามมีขอบดำ/เงาแปลก ๆ บน cover/card
- ราคาบนหน้าร้านแสดงเป็นเงินบาท
- หลังบ้านกรอกราคากีบ
- ระบบมีอัตราแลกรวมในหลังบ้าน

### 5. สี / size / stock หน้าเว็บ

- เลือกสีก่อน แล้วค่อยเลือก size
- สีที่หมด stock ยังโชว์ได้ แต่กดไม่ได้/มีขีดฆ่า
- size ที่หมด stock เห็นได้ แต่กดไม่ได้/มีขีดฆ่า
- สีบนวงกลมต้องตรงกับ color hex ในหลังบ้าน
- วงสีควรมีขอบขาวบาง ๆ กันจม
- ถ้ากดจาก card สีดำ เข้า detail ต้องเลือกสีดำไว้ ไม่ใช่เด้งไปสีแดง

### 6. รูปสินค้า

ในหลังบ้าน product editor:

- แต่ละสีมีรูปของตัวเอง
- รูป card/home ควรวนเฉพาะ 2 รูปแรกของสีนั้น
- Detail image แยกต่างหาก ไม่ควรไปรวมกับรูปเลือกสี
- Detail image ใส่ขนาดอะไรก็ได้ แต่หน้า detail ต้องแสดงเต็มรูป ไม่ crop

### 7. SKU / รหัสสินค้า

ระบบควร auto-generate SKU ไม่ให้ผู้ใช้ต้องกรอกเอง แต่สามารถเห็นและแก้ได้เมื่อจำเป็น

รูปแบบหลัก:

```text
SO-{CATEGORY}-{0001}-{COLOR}-{SIZE}
```

ตัวอย่าง:

```text
SO-JACK-0001-RE-M
SO-JEAN-0002-IB-S
```

แนวคิด:

- `SO` = ชื่อร้าน
- `JACK / JEAN / ...` = หมวดสินค้า
- `0001` = ลำดับสินค้าตามหมวด
- `RE / BLK / GRN / IB` = ย่อสี
- `M / L / XL` = size

ห้าม SKU ซ้ำ โดยเฉพาะ variant สี+size เดียวกัน

### 8. หมวดหมู่สินค้า

หมวดหมู่ในหลังบ้านต้องเชื่อมกับหน้าร้านจริง

ตัวอย่างที่ใช้:

- Jackets
- Jeans
- Pants
- T-Shirts
- Accessories
- Hoodies

Cover หน้า home แต่ละอันต้อง filter สินค้าใต้ cover ตามหมวดหมู่ของ cover นั้น

ตัวอย่าง:

- Cover Jackets → สินค้าใต้ cover เป็น Jackets เท่านั้น
- Cover Baggy Jeans → Jeans เท่านั้น
- Cover T-Shirts → T-Shirts เท่านั้น
- Cover Accessories → Accessories เท่านั้น
- Cover Hoodies → Hoodies เท่านั้น

### 9. Cover / Home editor

หน้าแก้ไขเว็บในแอดมินมี Home Cover 5 slot และ Intro

Cover:

- เพิ่ม/แก้ไข/ลบ รูปภาพและวิดีโอได้
- แนะนำขนาด desktop: 1920x1080
- บน PC ให้ cover เท่ากันทุกอัน และ fit กับ 1920x1080
- บนมือถือ crop ตามพื้นที่มือถือได้
- ห้ามมีเส้นดำ/เงาดำบน-ล่างของ cover ถ้าไม่จำเป็น

Intro:

- เพิ่ม/แก้ไข/ลบ รูปภาพและวิดีโอได้
- Intro ต้องโชว์เฉพาะตอนเข้าเว็บครั้งแรกเท่านั้น
- ห้าม flash intro เวลา refresh หรือ navigate ไปหน้าอื่น
- ตอนเข้าเว็บครั้งแรกต้องเห็น intro ก่อน ไม่ใช่แวบหน้าเว็บหลักก่อน

### 10. Admin product page

หน้าสินค้าในหลังบ้านถือว่าเกือบเสร็จแล้ว:

- แสดงเฉพาะสินค้าจริง
- card admin ควร compact, modern, premium
- มีปุ่มแก้ไข/ลบ
- ปุ่มลบต้องมี confirm alert สวย ๆ
- บันทึกสำเร็จ/ล้มเหลว ใช้ feedback alert พร้อม icon/เสียงตามที่ทำไว้
- ราคากีบในหลังบ้านแสดงแบบ `350,000K`

### 11. Inventory / Stock

หน้าสต็อก:

- ต้องลิงก์กับ product variants จริง
- รูปสินค้าต้องตรงกับสี variant
- ราคาใน stock แสดง `350,000K`
- column แจ้งเตือนไม่จำเป็น ถ้าทำให้กินพื้นที่
- ปุ่มปรับ stock จากแถว variant ควรเปิดหน้า/ฟอร์มโดยเลือก product+variant นั้นให้อัตโนมัติ
- การเพิ่ม/ลด/ตั้งค่า stock ต้องใช้งานได้จริงและบันทึก history ได้

### 12. Orders

Order มี source หลัก:

- Web
- Chat
- Walk-in

แต่ละ source ต้องมี UI/flow ไม่เหมือนกัน:

- Web order: ลูกค้า checkout จากเว็บ มี slip/payment verification และ shipping
- Chat order: แอดมินคุยกับลูกค้าในแชทเอง ไม่ต้องมีหน้าตรวจ slip แบบเว็บ แต่ยังจัดส่งได้
- Walk-in: ซื้อหน้าร้านโดยตรง ไม่ต้องมี slip verification และไม่ต้องมี shipping

สำหรับ Chat/Walk-in ต้องไม่ใส่ขั้นตอนที่ไม่จำเป็น

### 13. Shipping / แนบใบส่งของ

ใน admin order detail:

- ไม่ใช้ช่องบริษัทขนส่ง/เลขพัสดุแบบ text
- ใช้ upload รูปใบส่งของแทน
- รองรับหลายรูป
- drag/drop ได้
- ลบรูปที่ใส่ผิดได้
- หลัง admin แนบรูปและกดบันทึก shipping สำเร็จ ให้สถานะเป็น “ส่งแล้ว” อัตโนมัติ
- dropdown shipping เอาไว้แค่:
  - ยังไม่ส่ง
  - ส่งแล้ว

### 14. Notifications / Bell

หน้าร้านมีกระดิ่ง notification:

- badge เลขแจ้งเตือนต้องเป็นสีแดง
- กดกระดิ่งแล้ว panel slide จากฝั่งซ้าย ด้านเดียวกับกระดิ่ง
- panel กระดิ่งเป็น quick alerts เหมือนเดิม แต่จัดวางสวย ไม่ชิดขอบ
- มี link ไปหน้า notification inbox ได้ แม้ไม่มีแจ้งเตือนใหม่
- ถ้ากดอ่าน notification แล้ว:
  - จุด unread หาย
  - badge ลด/หาย
  - รายการอ่านแล้วไม่ควรค้างใน quick bell panel
- notification inbox เป็นหน้าเต็ม มี list ซ้าย รายละเอียดขวา คล้าย message inbox แต่ไม่ต้องมีช่องพิมพ์

### 15. Account / Order history

ใน account panel:

- Order history ต้องเห็นรูปสินค้า
- ชื่อ/รูปต้องตรงกับสินค้าที่สั่งจริง
- กดดูสินค้าได้ เพื่อซื้อซ้ำ
- ถ้ายาว ต้อง scroll ได้
- ควรพับ/กาง order history ได้ เพื่อลดความยาว

### 16. Cart / Stock protection

ต้องกันลูกค้าเพิ่มจำนวนเกิน stock:

- ถ้า stock มี 1 ตัว กด + ใน cart ไม่ควรเพิ่มเกิน 1
- admin ก็ไม่ควร approve order ที่เกิน stock
- ควรเช็ก stock ทั้งฝั่ง frontend และ server/database

## Supabase / Migration

โปรเจกต์ใช้ Supabase จริง ต้องระวัง RLS/policies

ถ้ามี error เช่น:

```text
new row violates row-level security policy
```

แปลว่าตาราง/Storage bucket policy ยังไม่อนุญาต role ปัจจุบัน

เคยมีการใช้ Supabase access token จาก user เพื่อ push migration / policy แต่ไม่ควร commit token ลง repo

## ปัญหาล่าสุดที่เพิ่งแก้

### ฟอนต์ลาวหน้าแอดมินเพี้ยน

สาเหตุ:

- Admin static app แยกจาก Next layout
- ไม่ได้รับ Noto Sans Lao font variables จาก Next
- CSS เดิมใช้แค่ `local()` ถ้าเครื่องหา font ไม่เจอจะ fallback แล้วเพี้ยน

แก้แล้ว:

- เพิ่มฟอนต์ใน `.admin-ui-reference/public/fonts`
- แก้ `.admin-ui-reference/src/styles/fonts.css`
- build/sync ไป `public/admin-static`
- ตรวจแล้ว `/admin-static/fonts/noto-sans-lao-lao.woff2` ตอบ `200`

ถ้ายังเห็นเพี้ยนบน browser ให้กด `Ctrl + F5`

## สิ่งที่ต้องระวังมาก

- ห้ามแก้ขนาด product card / รูปสินค้า ถ้าผู้ใช้ไม่ได้สั่ง เพราะเคยจูนจนถูกแล้ว
- ห้ามให้ demo product กลับมาโชว์บน storefront
- ห้ามให้ intro โผล่ตอน navigate/refresh
- ห้ามทำ UI เกินที่ผู้ใช้สั่ง ถ้าบอกว่า “ห้ามยุ่งตัวอื่น”
- เวลาแก้ admin static ต้องแก้ใน `.admin-ui-reference/src` แล้ว build/sync ไม่ควรแก้ minified assets โดยตรง

## ไฟล์สำคัญ

- `app/` — Storefront / Next.js app
- `.admin-ui-reference/src/` — Admin dashboard source
- `public/admin-static/` — Admin static build output
- `scripts/sync-admin-reference.mjs` — sync admin reference ไป public
- `supabase/` — migration / database related
- `ADMIN_WEBSITE_EDITOR_FUNCTIONAL_SPEC.md` — spec หน้าแก้ไขเว็บ
- `ADMIN_UI_DESIGN_BRIEF.md` — brief ระบบหลังบ้าน

## โทนการทำงานที่ผู้ใช้ต้องการ

- ตอบเป็นไทย/ลาวแบบเข้าใจง่าย
- ถ้าจะแก้โค้ด ให้บอกก่อนสั้น ๆ ว่ากำลังทำอะไร
- แก้ให้ตรงจุด ไม่เดา ไม่รื้อ
- หลังแก้ควร build/test เท่าที่ทำได้
- ถ้ามี warning เก่าไม่เกี่ยวกับงาน ให้บอกว่าไม่เกี่ยว

