# SHOW OFF — Current Status Checklist

ไฟล์นี้ใช้คู่กับ `CODEX_HANDOFF.md`

ให้ Codex คอมใหม่อ่าน 2 ไฟล์นี้ก่อนเสมอ:

1. `CODEX_HANDOFF.md` — เข้าใจระบบและกฎทั้งหมด
2. `CURRENT_STATUS.md` — รู้สถานะล่าสุดว่าหน้าไหนเสร็จ/ยังต้องทำต่อ

## สถานะล่าสุดโดยรวม

โปรเจกต์ยังอยู่ในช่วงพัฒนา local dev

- Storefront ใช้งานหลักได้แล้ว
- Admin dashboard ทำไปหลายหน้าแล้ว
- Product + Inventory เป็นแกนหลักที่เริ่มเชื่อมข้อมูลจริงแล้ว
- Order / notification / shipping กำลังพัฒนาและยังมีจุดต้องเช็กต่อ
- Website editor / Cover / Intro เริ่มทำให้ใช้งานจริงแล้ว แต่ยังต้อง QA เพิ่ม

## สิ่งที่ห้ามลืมก่อนเริ่มงานต่อ

- ห้ามเดา UX เองถ้าผู้ใช้ระบุว่า “ห้ามยุ่งตัวอื่น”
- ห้ามเปลี่ยนขนาด product card / รูปสินค้า เว้นแต่ผู้ใช้สั่งชัดเจน
- ห้ามให้ demo product เก่ากลับมาโชว์บน storefront
- ห้ามให้ intro โผล่ตอน refresh/navigate
- ถ้าแก้ admin ให้แก้ source ใน `.admin-ui-reference/src/` แล้ว build/sync
- ถ้าแก้ storefront ให้ดูผลจริงที่ `http://127.0.0.1:3000/en`

## คำสั่งตรวจพื้นฐาน

```bash
npm run dev
```

หน้าเว็บ:

```text
http://127.0.0.1:3000/en
```

หน้าแอดมิน:

```text
http://127.0.0.1:3000/admin
```

Build/sync admin:

```bash
npm run admin:ref:build
```

## สถานะแต่ละส่วน

### 1. Storefront / หน้าเว็บหลัก

สถานะ: ใช้งานได้ แต่ต้องระวัง regression

ทำแล้ว:

- หน้า home มี cover หลาย section
- cover แต่ละ section ควร filter product ตามหมวดหมู่
- product card ถูกจูนเรื่องขนาดรูป/card แล้ว
- card ต้องใช้รูป 1920x2400 แบบไม่ crop/zoom/เลื่อน
- รูป card home ของแต่ละสีให้วนแค่ 2 รูปแรก
- ราคา storefront แสดงเป็นเงินบาท
- สี/size เชื่อม stock
- สี/size หมด stock เห็นได้แต่กดไม่ได้

ต้องระวัง:

- อย่าเปลี่ยน sizing ของ product card
- อย่าให้ demo products กลับมา
- ถ้าหมวดหมู่ไม่มีสินค้า ให้แสดง `No products yet`
- ถ้ากด card สีใด ต้องเข้า detail โดยเลือกสีนั้นไว้

### 2. Intro

สถานะ: เคยแก้หลายรอบแล้ว ต้องระวังมาก

พฤติกรรมที่ต้องเป็น:

- โชว์เฉพาะตอนเข้าเว็บครั้งแรก/เปิดเว็บใหม่
- ห้ามแวบตอน refresh หรือ navigate
- ตอนเข้าเว็บครั้งแรกต้องเห็น intro ก่อน ไม่ใช่แวบหน้าเว็บหลักก่อน

ถ้าเกิดปัญหาอีก:

- เช็ก intro boot script / state ใน layout
- เช็ก session/local storage ที่ใช้จำว่า intro เล่นแล้ว
- ห้ามให้ intro overlay mount แบบ active ทุก navigation

### 3. Cover / Home sections

สถานะ: เริ่มใช้จริงได้ แต่ยังต้อง QA เพิ่ม

ทำแล้ว/กฎ:

- Cover ใช้ 1920x1080 บน PC
- บนมือถือ crop ตามพื้นที่มือถือได้
- ทุก cover บน PC ควรสูง/สัดส่วนเท่ากัน
- Cover รองรับ image/video
- ไม่มีเส้นดำหรือเงาดำบน-ล่างของ cover

ยังต้องเช็กต่อ:

- เวลา upload video แล้วต้องเล่นบน storefront จริง
- cover แต่ละอันต้อง link/filter category ถูกต้อง:
  - Jackets → Jackets
  - Baggy Jeans → Jeans
  - T-Shirts → T-Shirts
  - Accessories → Accessories
  - Hoodies → Hoodies

### 4. Product detail

สถานะ: ใช้งานได้ แต่ต้องระวัง image mapping

กฎ:

- รูปสีแต่ละสีต้องแยกกัน
- detail images ไม่ควรปนกับรูปเลือกสี
- detail images ใส่ขนาดอะไรก็ได้ แต่ต้องแสดงเต็ม ไม่ crop
- เลือกสีแล้วค่อยเลือก size
- สี/size ที่หมดต้องกดไม่ได้

### 5. Admin Dashboard UI

สถานะ: ใช้ดีไซน์ใหม่แล้ว แต่ยังมีบางหน้าต้อง polish ต่อ

ทำแล้ว:

- Modern soft-rounded UI
- Apple-like card/button/input
- ใช้สีเดิม ไม่เปลี่ยน theme
- ฟอนต์ลาวแก้ให้โหลดจาก admin static แล้ว

ล่าสุดที่แก้:

- เพิ่ม font files ใน admin static
- แก้ `.admin-ui-reference/src/styles/fonts.css`
- build/sync ผ่าน

ถ้าฟอนต์ลาวเพี้ยน:

- ลอง `Ctrl + F5`
- เช็ก `/admin-static/fonts/noto-sans-lao-lao.woff2` ต้องโหลดได้

### 6. Admin Products

สถานะ: ผู้ใช้บอกว่าหน้าสินค้าโอเค/เกือบเสร็จแล้ว

ทำแล้ว:

- แสดงสินค้าจริง
- เพิ่ม/แก้ไข/ลบสินค้า
- product card admin compact ขึ้น
- SKU auto ตามหมวดหมู่/สี/size
- ราคาแสดงกีบแบบ `350,000K`
- รูปสินค้าแยกตามสี
- stock/variant เชื่อมกับสินค้า
- ปุ่มลบ/บันทึกมี feedback alert

ต้องระวัง:

- ห้าม SKU ซ้ำ
- อย่าให้ช่อง slug ให้ผู้ใช้กรอกเองถ้าไม่จำเป็น
- ถ้า slug ยังมี ให้ auto generate
- product sequence ต่อหมวดหมู่ เช่น Jeans ตัวที่ 2 = `SO-JEAN-0002`

### 7. Admin Inventory / Stock

สถานะ: ทำไปแล้ว แต่ยังควร QA เพิ่มกับ order/cart

ทำแล้ว:

- แสดง variants จากสินค้าจริง
- รูปควรตรงกับสี variant
- ราคาแสดง `350,000K`
- ปุ่มตั้งค่า stock ควรเลือก variant นั้นให้อัตโนมัติ
- ประวัติ stock เคยมีปัญหา refresh แล้วหาย ตอนหลังผู้ใช้บอกได้แล้ว

ยังควรตรวจ:

- เพิ่ม/ลด/ตั้งค่า stock บันทึกจริง
- history ยังอยู่หลัง refresh
- cart กันจำนวนเกิน stock
- admin approve ไม่ควร approve order ที่เกิน stock

### 8. Cart / Checkout

สถานะ: ยังต้องเช็ก stock protection

ปัญหาที่เคยเจอ:

- ลูกค้ากด + ใน cart ได้เกิน stock จริง
- admin approve ได้แม้ stock มีไม่พอ

สิ่งที่ต้องทำ/ตรวจ:

- frontend ห้ามเพิ่ม quantity เกิน available stock
- server/database ควร validate ก่อนสร้าง/approve order
- ถ้า stock ไม่พอ ต้องแจ้งลูกค้าชัดเจน

### 9. Orders

สถานะ: กำลังพัฒนา flow แยก Web / Chat / Walk-in

ต้องแยก flow ชัดเจน:

#### Web order

- มาจาก storefront
- มี slip/payment verification
- approve/reject payment ได้
- หลัง approve สร้าง notification ให้ลูกค้า
- มี shipping section และแนบรูปใบส่งของได้

#### Chat order

- มาจากแอดมินสร้างผ่าน chat
- ไม่ต้องมีหน้าตรวจ slip เหมือน web
- แอดมินตรวจ/คุยใน chat เอง
- ยังจัดส่งได้
- ปุ่มจัดส่งต้องใช้งานได้

#### Walk-in order

- ซื้อหน้าร้าน
- ไม่ต้องตรวจ slip
- ไม่ต้องมี shipping
- ควรตัด section ที่ไม่จำเป็นออก

ปัญหาล่าสุดที่ควรเช็กต่อ:

- Chat order กดจัดส่งไม่ได้ / dropdown disabled
- Walk-in ยังเห็นบาง section ที่ไม่ควรมีหรือไม่
- Create order เคย error enum `order_source` invalid ต้องเช็ก value ที่ส่งไป database

### 10. Shipping

สถานะ: กำลังทำให้ใช้รูปแทน tracking text

กฎ:

- เอาช่องบริษัทขนส่ง/เลขพัสดุออก
- ใช้ upload รูปใบส่งของแทน
- รองรับหลายรูป
- drag/drop ได้
- ลบรูปผิดได้
- กดบันทึก shipping แล้วสถานะควรเป็น “ส่งแล้ว” อัตโนมัติ
- dropdown มีแค่:
  - ยังไม่ส่ง
  - ส่งแล้ว

ต้องเช็ก:

- upload รูปทำงานกับ Supabase Storage/RLS
- หลังบันทึก รูปไปโชว์ใน notification/order detail ฝั่งลูกค้าอย่างถูกต้อง

### 11. Notifications / Bell

สถานะ: พัฒนาไปเยอะ แต่ยังต้อง QA ต่อ

ทำแล้ว:

- Bell panel
- Notification inbox page
- unread badge
- จุด unread
- read แล้ว badge/จุดควรหาย
- rejected payment notification ควรส่งได้แล้ว

กฎ UX:

- กดกระดิ่งแล้ว slide จากฝั่งซ้าย ด้านเดียวกับกระดิ่ง
- หน้า PC และมือถือกดได้เหมือนกัน
- badge สีแดง
- quick bell panel ไม่ต้องเป็นกาดกลมเยอะเกิน
- มี link ไป notification inbox
- ถ้าอ่านแล้ว ไม่ควรค้างใน quick panel
- inbox เป็น list + detail
- detail พื้นขาว ฟอนต์ดำ ไม่ใช้กาดดำใหญ่

ต้องระวัง:

- อย่าให้กด notification แล้ว intro flash
- อย่าให้ panel กดไม่ได้บน PC
- อย่าให้ notification ซ้ำ/ไม่หายเมื่ออ่านแล้ว

### 12. Account / Order history

สถานะ: แก้รูป/ชื่อสินค้าให้ตรงแล้ว แต่ควร QA ต่อ

ทำแล้ว:

- มีรูปสินค้าใน history
- กดดูสินค้าได้
- scroll ได้
- รูป/ชื่อเคยผิดและแก้แล้ว

ยังควรทำ/เช็ก:

- ทำให้พับ/กาง order history ได้
- history ไม่ยาวเกิน
- รูปสินค้าอิงข้อมูลจริง ไม่ใช้ demo image

### 13. Website editor / Admin page for cover + intro

สถานะ: เริ่มใช้งานได้ แต่ยังมี issue upload/save video/image บ้าง

ทำแล้ว:

- Home Cover 5 slots
- Intro card
- แก้ cover label/link/CTA/media ได้
- upload image ได้
- upload video เริ่มได้แล้ว หลังเคยมี error

ปัญหาที่เคยเจอ:

- Missing `NEXT_PUBLIC_SUPABASE_URL`
- RLS policy error ตอน save
- video upload แล้ว storefront ดำ/ไม่เล่น
- Failed to parse body as FormData

ต้องเช็กต่อ:

- image upload → save → storefront update จริง
- video upload → save → storefront เล่นจริง
- media type image/video sync ถูก
- public URL จาก Supabase ถูกต้อง
- RLS/policy ถูกต้อง

### 14. Admin Login/Auth

สถานะ: เคยมีปัญหา login/password แล้วแก้ทาง Supabase

หมายเหตุ:

- Admin login ใช้ Supabase auth/user
- เคยมี user `somphet.do2021@gmail.com`
- อย่าใส่ token/password ลงไฟล์ repo

### 15. Supabase / Database / RLS

สถานะ: ใช้งานจริง ต้องระวังมาก

เคยมีปัญหา:

- command `supabase` ไม่เจอ
- PowerShell execution policy block `npx`
- Supabase login URL error
- RLS policy block insert/update

สิ่งที่ต้องตรวจเมื่อติด:

- `.env.local` มีค่า Supabase ครบหรือไม่
- Storage bucket policy อนุญาต upload หรือไม่
- table policy อนุญาต admin role หรือไม่
- migration ได้ push ไป database จริงหรือยัง

ห้าม:

- commit access token
- hardcode service role key ใน client

## งานถัดไปที่เหมาะจะทำ

เรียงความสำคัญ:

1. เช็ก/แก้ Chat order shipping ให้กดจัดส่งได้จริง
2. เช็ก Walk-in order ให้ตัด slip/shipping ออกตาม source
3. เช็ก cart/order stock protection ไม่ให้ขายเกิน stock
4. QA notification read/unread + bell panel PC/mobile
5. QA website editor cover/intro image/video upload/save/display
6. QA storefront ไม่มี demo product เหลือ
7. QA product card/card image sizing หลังทุกการแก้

## ข้อความเริ่มงานแนะนำสำหรับ Codex คอมใหม่

```text
อ่าน CODEX_HANDOFF.md และ CURRENT_STATUS.md ก่อน แล้วทำงานต่อจากสถานะล่าสุดนี้
อย่าเดา อย่ารื้อของเดิม แก้เฉพาะจุดที่ผมสั่ง และถ้าเกี่ยวกับ UI ให้รักษาแนวทาง impeccable/Apple-like เดิม
```

