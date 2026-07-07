# SHOW OFF Admin System Functional Brief

เอกสารนี้ใช้ส่งให้นักออกแบบเพื่อออกแบบหน้าระบบหลังบ้านของ SHOW OFF โดยเน้นเฉพาะ “ข้อมูลและฟังก์ชันที่ต้องมี” ในแต่ละหน้าเท่านั้น  
ไม่กำหนดสไตล์ สี ฟอนต์ ระยะห่าง หรือรูปแบบหน้าตา UI เพราะจะอ้างอิงจากเฟรม/เรฟที่เตรียมไว้แล้ว

## 1) ภาพรวมระบบ

SHOW OFF เป็นระบบขายเสื้อผ้าออนไลน์และขายผ่านแชท/หน้าร้าน ระบบหลังบ้านต้องช่วยให้เจ้าของร้านและทีมงานจัดการงานประจำวันได้ครบในที่เดียว

ช่องทางขายที่ต้องรองรับ:

- เว็บไซต์
- แชท
- หน้าร้าน / walk-in

งานหลักที่ระบบหลังบ้านต้องรองรับ:

- ดูภาพรวมยอดขาย รายจ่าย กำไร และงานที่ต้องจัดการ
- จัดการออเดอร์จากเว็บไซต์ แชท และหน้าร้าน
- ตรวจสอบสลิปและอนุมัติ/ปฏิเสธการชำระเงิน
- จัดการสถานะจัดส่งและเลขพัสดุ
- จัดการสินค้า รูปภาพ ราคา ต้นทุน และตัวเลือกสินค้า
- จัดการสต็อกจริง แยกตามสินค้า/variant
- ดูประวัติการเคลื่อนไหวสต็อก
- สร้างออเดอร์เองจากหลังบ้าน
- จัดการข้อมูลลูกค้าและประวัติการซื้อ
- ดูรายรับ รายจ่าย และกำไร
- จัดการใบสั่งซื้อสินค้าเข้า
- จัดการคูปอง
- รับแจ้งเตือนจากระบบ
- ดู activity logs
- ตั้งค่าร้าน การชำระเงิน ค่าเงิน ราคา และสต็อก

## 2) ผู้ใช้งาน

### Owner

สิทธิ์ที่ต้องรองรับ:

- เห็นข้อมูลทั้งหมด
- จัดการสินค้า ราคา สต็อก ออเดอร์ ลูกค้า และการเงิน
- อนุมัติหรือปฏิเสธสลิป
- จัดการใบสั่งซื้อสินค้าเข้า
- ตั้งค่าระบบร้าน
- ดูรายงานและ logs

### Staff

สิทธิ์ที่ต้องรองรับ:

- ดูและจัดการออเดอร์
- ตรวจสอบข้อมูลลูกค้า
- อัปเดตสถานะจัดส่ง
- ปรับสต็อกตามสิทธิ์ที่กำหนด
- สร้างออเดอร์จากแชท/หน้าร้าน

หมายเหตุ: หน้าที่มีข้อมูลการเงินหรือการตั้งค่าสำคัญควรเผื่อ state กรณีผู้ใช้ไม่มีสิทธิ์เข้าถึง

## 3) กติกาหลักของระบบ

- ระบบใช้ LAK เป็นสกุลเงินหลักของหลังบ้าน
- หน้าร้านสามารถแสดงราคา THB ได้
- Checkout ต้องรองรับการเลือกชำระเงิน THB หรือ LAK
- ออเดอร์จากเว็บไซต์ แชท และหน้าร้าน ต้องใช้สต็อกกลางเดียวกัน
- เมื่ออนุมัติสลิปสำเร็จ ระบบต้องเปลี่ยนสถานะการชำระเงินและตัดสต็อก
- ถ้าปฏิเสธสลิป ต้องเก็บเหตุผลการปฏิเสธ
- สินค้าทุกชิ้นต้องมี stock จริง
- สินค้าที่มีตัวเลือก เช่น สี/ไซซ์ ต้องแยก stock ตาม variant
- การปรับ stock ทุกครั้งต้องสร้าง stock movement
- Purchase order เมื่อ mark received ต้องเพิ่ม stock และบันทึก movement
- ระบบต้องเก็บประวัติ action สำคัญ เช่น อนุมัติสลิป, ปรับ stock, เปลี่ยนราคา, ยกเลิกออเดอร์

## 4) เมนูหลักที่ต้องมี

1. Dashboard
2. Orders
3. Create Order
4. Products
5. Inventory
6. Customers
7. Financials
8. Purchase Orders
9. Coupons
10. Notifications
11. Activity Logs
12. Settings

## 5) รายชื่อหน้าทั้งหมดที่ควรออกแบบ

### Authentication

1. Admin Login

### Dashboard

2. Dashboard Overview

### Orders

3. Orders List
4. Order Detail
5. Slip Review Section
6. Shipping Update Section
7. Create Chat Order
8. Create Walk-in Order

### Products

9. Products List
10. Create Product
11. Edit Product
12. Product Detail Preview

### Inventory

13. Inventory Overview
14. Stock Movement History
15. Stock Adjustment

### Customers

16. Customers List
17. Customer Detail

### Financials

18. Financial Overview
19. Expense Management

### Purchase Orders

20. Purchase Orders List
21. Create Purchase Order
22. Purchase Order Detail

### Coupons

23. Coupons List
24. Create Coupon
25. Edit Coupon

### Notifications

26. Notifications Center

### Activity Logs

27. Activity Logs List

### Settings

28. Store Settings
29. Payment / Bank Settings
30. Exchange Rate Settings
31. Pricing Settings
32. Stock Settings

## 6) ส่วนกลางที่ต้องมีทุกหน้า

ทุกหน้าหลังบ้านควรมีข้อมูล/ฟังก์ชันพื้นฐานเหล่านี้:

- เมนูหลัก
- ชื่อหน้าปัจจุบัน หรือ breadcrumb
- Search หรือช่องค้นหาเมื่อหน้านั้นมีข้อมูลจำนวนมาก
- ปุ่ม action สำคัญของหน้านั้น
- Notification access
- User/account area
- Logout
- State เมื่อโหลดข้อมูล
- State เมื่อไม่มีข้อมูล
- State เมื่อค้นหาไม่เจอ
- State เมื่อเกิด error
- Feedback เมื่อบันทึกสำเร็จหรือไม่สำเร็จ

## 7) Status ที่ต้องรองรับ

### Order status

- pending
- awaiting_payment_slip
- awaiting_confirmation
- paid
- cancelled

### Payment status

- waiting_slip
- pending_review
- paid
- rejected
- cancelled

### Shipping status

- not_shipped
- shipping
- delivered

### Product status

- active
- hidden
- archived

### Purchase order status

- draft
- ordered
- in_transit
- received
- closed

### Coupon status

- active
- inactive
- expired
- usage_limit_reached

### Alert priority

- normal
- warning
- critical

## 8) Dashboard Overview

เป้าหมาย:

- ให้เจ้าของร้านเห็นภาพรวมร้านและงานที่ต้องรีบจัดการในหน้าเดียว

ข้อมูลที่ต้องแสดง:

- Revenue Today
- Expenses Today
- Profit Today
- New Orders Today
- Pending payment slips
- Low stock items
- New customers
- Latest orders 5-10 รายการ
- Sales trend 7 วัน
- Sales trend 30 วัน
- Sales by channel
- Top selling products
- Alerts ที่ต้องจัดการ

Actions ที่ควรมี:

- ไปหน้า Orders
- ไปหน้า Slip Review
- ไปหน้า Inventory
- ไปหน้า Create Order
- ไปหน้า Products

States ที่ต้องมี:

- ไม่มีออเดอร์ใหม่
- ไม่มี alert
- โหลดข้อมูลไม่ได้

## 9) Orders List

เป้าหมาย:

- ดูและจัดการออเดอร์ทั้งหมด

ข้อมูลที่ต้องแสดงในรายการ:

- Order number
- Customer name
- Customer phone
- Channel: web / chat / walk-in
- Total amount
- Payment currency
- Payment status
- Order status
- Shipping status
- Created date/time
- Latest action หรือ next action

Search / Filters:

- ค้นหาด้วย order number
- ค้นหาด้วยชื่อลูกค้า
- ค้นหาด้วยเบอร์โทร
- Filter by channel
- Filter by payment status
- Filter by shipping status
- Filter by date range

Actions:

- เปิด Order Detail
- Approve slip ถ้ามีสลิปรอตรวจ
- Reject slip
- Update shipping
- Cancel order
- Create new order

States:

- ไม่มีออเดอร์
- ค้นหาไม่เจอ
- มีออเดอร์รอตรวจสลิป
- มีออเดอร์รอจัดส่ง

## 10) Order Detail

เป้าหมาย:

- ดูข้อมูลออเดอร์ทั้งหมดและทำ action สำคัญ

Sections ที่ต้องมี:

### Order Summary

- Order number
- Channel
- Order status
- Payment status
- Shipping status
- Created date/time
- Created by
- Notes

### Customer Info

- Customer name
- Phone
- Email ถ้ามี
- Shipping address
- Customer notes

### Products

- Product image
- Product name
- SKU
- Variant เช่น color / size
- Quantity
- Unit price
- Discount
- Line total

### Amount Summary

- Subtotal
- Discount
- Shipping fee
- Final amount
- Payment currency
- Exchange rate ถ้ามี
- Payment amount

### Payment / Slip Review

- Payment method
- Slip image preview
- Slip amount
- Slip upload time
- Slip status
- Reject reason ถ้ามี

Actions:

- Approve slip
- Reject slip พร้อมเหตุผล
- Update payment status

### Shipping

- Carrier
- Tracking number
- Shipping status
- Shipped date
- Delivered date

Actions:

- Update carrier
- Update tracking number
- Mark shipping
- Mark delivered

### Timeline / Activity

- Created order
- Uploaded slip
- Approved/rejected slip
- Stock deducted
- Shipping updated
- Delivered
- Cancelled

## 11) Create Chat Order / Walk-in Order

เป้าหมาย:

- ให้แอดมินสร้างออเดอร์เองจากแชทหรือหน้าร้าน

ข้อมูลที่ต้องกรอก:

- Order source: chat / walk-in
- Customer select หรือ create new customer
- Customer name
- Phone
- Shipping address
- Product select
- Variant select
- Quantity
- Discount
- Shipping fee
- Payment method
- Payment currency
- Notes

ข้อมูลที่ต้องแสดงระหว่างสร้าง:

- Current stock ของสินค้าที่เลือก
- Price ของสินค้า/variant
- Subtotal
- Discount total
- Final amount
- Warning ถ้า stock ไม่พอ

Actions:

- Add product item
- Remove product item
- Create order
- Create and mark paid ถ้าชำระแล้ว
- Cancel draft

States:

- ยังไม่ได้เลือกลูกค้า
- ยังไม่ได้เลือกสินค้า
- Stock ไม่พอ
- สร้างออเดอร์สำเร็จ
- สร้างออเดอร์ไม่สำเร็จ

## 12) Products List

เป้าหมาย:

- ดูและจัดการสินค้าทั้งหมด

ข้อมูลที่ต้องแสดง:

- Product image
- Product name
- SKU / parent SKU
- Category
- Sale price
- Cost price
- Stock summary
- Low stock warning
- Status
- Created date

Search / Filters:

- ค้นหาด้วยชื่อสินค้า
- ค้นหาด้วย SKU
- Filter by category
- Filter by status
- Filter by stock status

Actions:

- Create product
- Edit product
- View product detail/preview
- Hide product
- Archive product

States:

- ไม่มีสินค้า
- ค้นหาไม่เจอ
- สินค้า stock ต่ำ
- สินค้าถูกซ่อน

## 13) Create / Edit Product

เป้าหมาย:

- สร้างหรือแก้ไขสินค้า รวมถึง variant, ราคา, รูป และ stock

Sections ที่ต้องมี:

### Basic Info

- Product name EN
- Product name LO
- SKU
- Slug
- Category
- Status
- Description EN
- Description LO

### Images

- Upload image
- Primary image
- Sort order
- Alt text
- Remove image

### Variants

ข้อมูลต่อ variant:

- Variant SKU
- Size label
- Color name
- Color hex
- Option label
- Sale price
- Cost price
- Stock quantity
- Minimum stock
- Status

Actions:

- Add variant
- Edit variant
- Remove/archive variant

### Pricing

- Sale price
- Cost price
- Profit
- Margin
- Price in LAK
- Price in THB ถ้ามี

### Stock

- Base stock ถ้าไม่มี variant
- Minimum stock
- Stock warning

States:

- SKU ซ้ำ
- Slug ซ้ำ
- รูป upload ไม่สำเร็จ
- ราคาหรือ stock ไม่ถูกต้อง
- บันทึกสำเร็จ

## 14) Inventory Overview

เป้าหมาย:

- ดูภาพรวมสต็อกและรายการที่ต้องเติม

ข้อมูลที่ต้องแสดง:

- Total stock units
- Inventory value
- Low stock count
- Out of stock count
- Product / SKU list
- Variant stock
- Minimum stock
- Last movement

Search / Filters:

- Product name
- SKU
- Low stock only
- Out of stock only
- Category

Actions:

- Open stock adjustment
- Open movement history
- Open product edit

## 15) Stock Movement History

เป้าหมาย:

- ดูประวัติการเคลื่อนไหว stock ทุกครั้ง

ข้อมูลที่ต้องแสดง:

- Movement type
- Product
- SKU
- Variant
- Quantity delta
- Stock after
- Reference type: order / purchase_order / manual
- Reference ID หรือ link
- Note / reason
- Created by
- Created time

Movement types:

- order_paid
- po_received
- manual_adjustment
- order_cancelled

Filters:

- Movement type
- Product / SKU
- Date range
- Created by
- Reference type

## 16) Stock Adjustment

เป้าหมาย:

- ให้แอดมินปรับ stock ด้วยเหตุผลที่ชัดเจน

ข้อมูลที่ต้องกรอก:

- Product / SKU select
- Variant select ถ้ามี
- Current stock
- Adjustment type: increase / decrease / set
- Quantity
- Reason / note

Reason options:

- stock count correction
- damaged
- lost
- giveaway
- return
- manual correction

Actions:

- Preview stock after adjustment
- Confirm adjustment
- Cancel

ต้องมี warning:

- ถ้าปรับแล้ว stock ติดลบ
- ถ้าไม่มีเหตุผล
- ถ้าเป็น action ที่แก้ไขย้อนหลังไม่ได้

## 17) Customers List

เป้าหมาย:

- ดูข้อมูลลูกค้าและประวัติการซื้อแบบย่อ

ข้อมูลที่ต้องแสดง:

- Customer name
- Phone
- Email
- Customer type
- VIP flag
- Total orders
- Total spent
- Last order date
- Created date

Search / Filters:

- Name
- Phone
- Email
- Customer type
- VIP

Actions:

- Open customer detail
- Edit customer note

## 18) Customer Detail

เป้าหมาย:

- ดูข้อมูลลูกค้ารายคนและประวัติออเดอร์

Sections ที่ต้องมี:

- Profile
- Phone / email / social contact
- Default address
- Address list
- Notes
- VIP flag
- Order history
- Total spent
- Last order

Actions:

- Edit customer
- Add/Edit address
- Add note
- Open order detail

## 19) Financial Overview

เป้าหมาย:

- ดูรายรับ รายจ่าย และกำไรของร้าน

ข้อมูลที่ต้องแสดง:

- Revenue
- Expenses
- Profit
- Order count
- Average order value
- Revenue by date range
- Expense by category
- Payment currency breakdown

Filters:

- Date range
- Channel
- Payment status

Actions:

- Add expense
- Export report ถ้ามี
- Open expense list

## 20) Expense Management

เป้าหมาย:

- บันทึกและดูรายจ่ายของร้าน

ข้อมูลที่ต้องแสดง/กรอก:

- Expense date
- Ref no
- Category
- Description
- Amount
- Related purchase order ถ้ามี
- Created time

Expense categories:

- product cost
- shipping
- ads
- packaging
- rent
- salary
- other

Actions:

- Add expense
- Edit expense
- Delete expense ตามสิทธิ์

## 21) Purchase Orders List

เป้าหมาย:

- ดูและจัดการใบสั่งซื้อสินค้าเข้า

ข้อมูลที่ต้องแสดง:

- PO number
- Supplier
- Status
- Currency
- Subtotal
- Shipping cost
- Other cost
- Total cost
- Created date
- Expected date
- Received date

Filters:

- Status
- Supplier
- Date range

Actions:

- Create PO
- Open PO detail
- Mark received

## 22) Create Purchase Order

เป้าหมาย:

- สร้างใบสั่งซื้อสินค้าเข้าและเตรียมข้อมูลต้นทุน

ข้อมูลที่ต้องกรอก:

- Supplier name
- Supplier contact
- Order date
- Expected date
- Currency
- Exchange rate
- Product items
- Variant
- Quantity
- Unit cost
- Shipping cost
- Other cost
- Notes

ข้อมูลที่ต้องคำนวณ:

- Subtotal
- Total cost
- Cost per unit
- Estimated landed cost

Actions:

- Add item
- Remove item
- Save draft
- Mark ordered

## 23) Purchase Order Detail

เป้าหมาย:

- ดูข้อมูล PO และรับสินค้าเข้าสต็อก

Sections ที่ต้องมี:

- PO summary
- Supplier info
- Item list
- Cost summary
- Additional costs
- Notes
- Timeline

Actions:

- Edit PO ถ้ายังไม่ received
- Mark received
- Close PO

เมื่อ mark received ต้องสื่อข้อมูลนี้ให้ชัด:

- Stock จะเพิ่มตามจำนวนสินค้า
- Inventory movement จะถูกสร้าง
- ต้นทุนสินค้าอาจถูกอัปเดต
- Action นี้มีผลต่อ stock จริง

## 24) Coupons List

เป้าหมาย:

- ดูและจัดการคูปองส่วนลด

ข้อมูลที่ต้องแสดง:

- Code
- Active status
- Discount type
- Discount value
- Minimum order amount
- Usage limit
- Used count
- Expires at
- Created date

Actions:

- Create coupon
- Edit coupon
- Disable coupon
- Delete coupon ตามสิทธิ์

## 25) Create / Edit Coupon

ข้อมูลที่ต้องกรอก:

- Code
- Active toggle
- Discount type: percentage / fixed amount
- Discount value
- Minimum order amount
- Usage limit
- Start date
- Expires at
- Applicable products/categories ถ้ามีในอนาคต

States:

- Code ซ้ำ
- Discount value ไม่ถูกต้อง
- Expired date ไม่ถูกต้อง
- บันทึกสำเร็จ

## 26) Notifications Center

เป้าหมาย:

- รวมการแจ้งเตือนจากระบบหลังบ้าน

ข้อมูลที่ต้องแสดง:

- Notification title
- Message
- Type
- Priority
- Read/unread
- Created time
- Related link

Notification types ที่ควรรองรับ:

- New order
- Awaiting slip verification
- Slip rejected
- Payment approved
- Low stock
- Out of stock
- Purchase order received
- Shipping update required
- System warning
- Admin announcement

Actions:

- Mark as read
- Mark all as read
- Open related page

## 27) Activity Logs

เป้าหมาย:

- ดูประวัติการทำงานสำคัญในระบบ

ข้อมูลที่ต้องแสดง:

- User
- Role
- Action
- Target type
- Target ID
- Summary
- Created time

ตัวอย่าง actions:

- sign in
- approve slip
- reject slip
- create order
- cancel order
- update shipping
- create product
- update product
- update price
- adjust stock
- mark PO received
- update settings

Filters:

- User
- Action type
- Target type
- Date range

## 28) Settings

เป้าหมาย:

- จัดการค่าพื้นฐานของร้านและระบบ

Sections ที่ต้องมี:

### Store Information

- Store name
- Logo
- Contact email
- Phone
- Address
- Social links

### Payment / Bank Settings

- Bank account name
- Bank account number
- Bank name
- QR payment image THB
- QR payment image LAK
- Payment note

### Exchange Rate Settings

- THB to LAK rate
- Last updated
- Updated by

### Pricing Settings

- Default currency
- Rounding rule
- Markup settings ถ้ามี

### Stock Settings

- Default minimum stock
- Low stock notification threshold
- Stock movement rules

### Admin Users

- Admin name
- Email
- Role
- Status
- Last login

Actions:

- Save settings
- Reset setting section
- Invite admin ถ้ามี

## 29) Required Global States

ทุกหน้าที่มีข้อมูลต้องออกแบบ state เหล่านี้:

- Loading
- Empty
- No search results
- Error loading data
- Saving
- Save success
- Save failed
- Delete/disable confirm
- Permission denied

ตัวอย่าง state เฉพาะ:

- Orders: ไม่มีออเดอร์
- Products: ไม่มีสินค้า
- Inventory: stock ต่ำ
- Coupons: คูปองหมดอายุ
- Notifications: ไม่มีแจ้งเตือนใหม่
- Settings: บันทึกสำเร็จ

## 30) Risky Actions ที่ต้องมี confirmation

Actions เหล่านี้ต้องมีการยืนยันก่อนทำ:

- Reject slip
- Cancel order
- Manual stock adjustment
- Mark purchase order as received
- Archive product
- Disable coupon
- Delete coupon
- Change exchange rate
- Update bank/payment settings

ข้อมูลที่ confirmation ควรบอก:

- กำลังจะทำอะไร
- กระทบข้อมูลอะไร
- หลังทำแล้วแก้กลับได้หรือไม่
- ปุ่มยืนยันและปุ่มยกเลิก

## 31) Phase 1 ที่ต้องออกแบบก่อน

1. Admin Login
2. Dashboard Overview
3. Orders List
4. Order Detail
5. Create Chat / Walk-in Order
6. Products List
7. Create/Edit Product
8. Inventory Overview
9. Stock Movement History
10. Stock Adjustment
11. Customers List
12. Customer Detail
13. Financial Overview
14. Expense Management
15. Purchase Orders List
16. Create Purchase Order
17. Purchase Order Detail
18. Coupons List
19. Create/Edit Coupon
20. Notifications Center
21. Activity Logs
22. Settings

## 32) Phase 2 เผื่ออนาคต

- POS
- Barcode scanner
- Return / exchange system
- VIP levels
- OCR slip verification
- WhatsApp automation
- Advanced analytics
- Multi-warehouse stock
- Staff permission management แบบละเอียด

## 33) Definition of Done

ถือว่างานออกแบบครบเมื่อมี:

- ครบทุกหน้าใน Phase 1
- ครบทุกข้อมูลหลักที่ระบุในแต่ละหน้า
- ครบ actions สำคัญของแต่ละหน้า
- ครบ loading / empty / error / success states
- ครบ confirm state สำหรับ risky actions
- ครบ status ที่ระบบต้องรองรับ
- ครบ flow หลัก: order, slip review, shipping, product, stock, purchase order, coupon, settings
- ทีมพัฒนาสามารถดูแล้วรู้ว่าแต่ละหน้าต้องมีข้อมูลอะไรและทำ action อะไรได้บ้าง
