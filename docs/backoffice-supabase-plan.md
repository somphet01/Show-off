# Backoffice Supabase Plan

เอกสารนี้คือแผนฐานข้อมูล, API/actions, และลำดับงานสำหรับระบบหลังบ้านร้านเสื้อผ้าออนไลน์ของ Show Off ตาม PDF ที่อ่านแล้ว โดยวางให้เข้ากับ Next.js App Router และ Supabase

## เป้าหมายระบบ

- เจ้าของร้านเห็นภาพรวมรายได้, รายจ่าย, กำไร, ออเดอร์, สต็อกต่ำในหน้าเดียว
- แอดมินจัดการสินค้า, รูปสินค้า, สต็อก, ลูกค้า, ออเดอร์เว็บ, ออเดอร์จากแชท
- ลูกค้าสามารถสมัคร/ล็อกอิน, ดูประวัติคำสั่งซื้อ, ดู tracking ได้ในอนาคต
- ระบบรองรับการแนบสลิปและให้แอดมินอนุมัติ ก่อนตัดสต็อก
- เก็บประวัติการเคลื่อนไหวสต็อกทุกครั้ง เพื่อย้อนดูได้ว่าสต็อกเพิ่ม/ลดจากอะไร

## Tech Decision

- Database: Supabase Postgres
- Auth: Supabase Auth
- Storage: Supabase Storage
- Next.js integration: `@supabase/supabase-js` + `@supabase/ssr`
- Server-side access: Server Components, Server Actions, Route Handlers
- Admin UI: `/admin/*`
- Customer account UI: `/account/*`

หมายเหตุสำคัญ:
- ห้ามใช้ secret/service key ใน client
- ตารางใน `public` ต้องเปิด RLS ทุกตาราง
- role ของผู้ใช้ให้เก็บในตาราง profile/admin profile หรือ `app_metadata`, ไม่ใช้ `user_metadata` ตัดสินสิทธิ์
- Storage buckets ต้องมี policy แยกสำหรับรูปสินค้า, สลิป, ใบส่งของ

## Roles

### owner

- สิทธิ์เต็มทุกหน้า
- จัดการ admin/staff ได้
- ดู financials, profit/loss, settings, backup/export

### staff

- จัดการสินค้า, ออเดอร์, สต็อก, ลูกค้า
- อนุมัติสลิปได้ถ้า owner อนุญาต
- ไม่ควรลบข้อมูลสำคัญถาวร

### customer

- ดูข้อมูลตัวเอง
- ดูออเดอร์ตัวเอง
- แนบสลิปสำหรับออเดอร์ตัวเอง

## Database Schema Draft

### profiles

ใช้ผูกกับ `auth.users`

| column | type | note |
| --- | --- | --- |
| id | uuid pk | same as auth.users.id |
| role | text | `owner`, `staff`, `customer` |
| display_name | text | ชื่อแสดงผล |
| phone | text | เบอร์โทร |
| line_id | text | LINE |
| facebook | text | Facebook |
| instagram | text | IG |
| created_at | timestamptz | default now |
| updated_at | timestamptz | |

### categories

| column | type | note |
| --- | --- | --- |
| id | uuid pk | |
| name_en | text | |
| name_lo | text | |
| slug | text unique | |
| sort_order | int | |
| is_active | boolean | |

### products

| column | type | note |
| --- | --- | --- |
| id | uuid pk | |
| sku | text unique | รหัสสินค้า |
| name_en | text | |
| name_lo | text | |
| slug | text unique | |
| category_id | uuid fk | categories |
| description_en | text | |
| description_lo | text | |
| sale_price | numeric | ราคาขาย |
| cost_price | numeric | ต้นทุนต่อชิ้น |
| stock_qty | int | สต็อกปัจจุบัน |
| min_stock_qty | int | จุดเตือนสต็อกต่ำ |
| status | text | `active`, `hidden`, `archived` |
| created_at | timestamptz | |
| updated_at | timestamptz | |

หลักการ:
- ลบสินค้าให้ใช้ `status = archived` ก่อน ไม่ลบจริง
- `cost_price` ต้องมี เพราะ dashboard ต้องคำนวณกำไรได้

### product_images

| column | type | note |
| --- | --- | --- |
| id | uuid pk | |
| product_id | uuid fk | products |
| bucket | text | เช่น `product-images` |
| path | text | storage path |
| alt_text | text | |
| sort_order | int | |
| is_primary | boolean | รูปหลัก |
| created_at | timestamptz | |

### customers

| column | type | note |
| --- | --- | --- |
| id | uuid pk | |
| profile_id | uuid nullable fk | ถ้าลูกค้าสมัครเว็บ |
| name | text | |
| phone | text | |
| email | text | |
| line_id | text | |
| facebook | text | |
| instagram | text | |
| default_address | text | |
| customer_type | text | `normal`, `vip` |
| is_vip_manual | boolean | แอดมินติ๊กเอง |
| notes | text | |
| created_at | timestamptz | |
| updated_at | timestamptz | |

### orders

| column | type | note |
| --- | --- | --- |
| id | uuid pk | |
| order_no | text unique | เช่น SO-20260615-0001 |
| source | text | `web`, `chat` |
| chat_channel | text nullable | `line`, `facebook`, `ig` |
| customer_id | uuid fk | customers |
| created_by | uuid nullable | admin user ถ้าสร้างจากแชท |
| subtotal | numeric | |
| shipping_fee | numeric | |
| discount_total | numeric | |
| total_amount | numeric | |
| payment_method | text | `bank_transfer` |
| payment_status | text | `waiting_slip`, `pending_review`, `paid`, `rejected`, `cancelled` |
| fulfillment_status | text | `not_ready`, `ready_to_ship`, `packing`, `shipped`, `delivered` |
| shipping_address | text | |
| tracking_number | text | |
| shipped_at | timestamptz | |
| notes | text | |
| created_at | timestamptz | |
| updated_at | timestamptz | |

### order_items

| column | type | note |
| --- | --- | --- |
| id | uuid pk | |
| order_id | uuid fk | orders |
| product_id | uuid fk | products |
| sku_snapshot | text | เก็บ ณ ตอนขาย |
| product_name_snapshot | text | เก็บ ณ ตอนขาย |
| quantity | int | |
| unit_price | numeric | ราคาขาย ณ ตอนนั้น |
| unit_cost | numeric | ต้นทุน ณ ตอนนั้น |
| line_total | numeric | quantity * unit_price |

### payment_slips

| column | type | note |
| --- | --- | --- |
| id | uuid pk | |
| order_id | uuid fk | orders |
| uploaded_by | uuid nullable | customer/admin |
| bucket | text | `payment-slips` |
| path | text | storage path |
| amount | numeric nullable | ถ้ากรอกเอง |
| status | text | `pending`, `approved`, `rejected` |
| reviewed_by | uuid nullable | admin |
| reviewed_at | timestamptz nullable | |
| reject_reason | text nullable | |
| created_at | timestamptz | |

### inventory_movements

| column | type | note |
| --- | --- | --- |
| id | uuid pk | |
| product_id | uuid fk | products |
| movement_type | text | `order_paid`, `po_received`, `manual_adjustment`, `order_cancelled` |
| quantity_delta | int | + เพิ่ม, - ลด |
| stock_after | int | สต็อกหลังทำรายการ |
| reference_type | text | `order`, `purchase_order`, `manual` |
| reference_id | uuid nullable | |
| note | text | |
| created_by | uuid nullable | admin |
| created_at | timestamptz | |

### expenses

| column | type | note |
| --- | --- | --- |
| id | uuid pk | |
| expense_date | date | |
| ref_no | text | |
| category | text | `product_cost`, `shipping_from_supplier`, `ads`, `packaging`, `server`, `other` |
| description | text | |
| amount | numeric | |
| bucket | text nullable | receipt bucket |
| path | text nullable | receipt path |
| created_by | uuid | |
| created_at | timestamptz | |

### purchase_orders

| column | type | note |
| --- | --- | --- |
| id | uuid pk | |
| po_no | text unique | |
| supplier_name | text | |
| ordered_at | date | |
| status | text | `draft`, `ordered`, `in_transit`, `received`, `closed` |
| shipping_cost | numeric | |
| tax_fee | numeric | |
| total_amount | numeric | |
| created_by | uuid | |
| created_at | timestamptz | |
| updated_at | timestamptz | |

### purchase_order_items

| column | type | note |
| --- | --- | --- |
| id | uuid pk | |
| purchase_order_id | uuid fk | purchase_orders |
| product_id | uuid fk | products |
| quantity | int | |
| unit_cost | numeric | |
| line_total | numeric | |

เมื่อ PO เปลี่ยนเป็น `received`:
- เพิ่ม stock ตามจำนวนใน `purchase_order_items`
- สร้าง `inventory_movements`
- สร้าง/ผูก `expenses` สำหรับต้นทุนสินค้าและค่าส่งถ้ามี

### store_settings

| column | type | note |
| --- | --- | --- |
| id | text pk | ใช้ค่า `main` |
| store_name | text | |
| logo_path | text | |
| address | text | |
| phone | text | |
| bank_name | text | |
| bank_account_no | text | |
| bank_account_name | text | |
| default_min_stock_qty | int | |
| created_at | timestamptz | |
| updated_at | timestamptz | |

## Storage Buckets

### product-images

- ใช้เก็บรูปสินค้า
- public read ได้ถ้าเป็นรูปสินค้าที่แสดงหน้าร้าน
- upload/update/delete เฉพาะ owner/staff

### payment-slips

- ใช้เก็บสลิป
- ไม่ควร public
- customer เห็นเฉพาะสลิปของ order ตัวเอง
- admin เห็นทุกสลิป

### shipping-documents

- ใช้เก็บใบส่งของ/รูปพัสดุ
- customer เห็นเฉพาะ order ตัวเอง
- admin เห็นทุกไฟล์

### expense-receipts

- ใช้เก็บใบเสร็จค่าใช้จ่าย
- owner/staff เท่านั้น

## RLS Policy Plan

### Public storefront

- products: anon/authenticated อ่านได้เฉพาะ `status = active`
- product_images: anon/authenticated อ่านได้เฉพาะรูปของ product active
- categories: anon/authenticated อ่าน active ได้

### Customer

- customers: user อ่าน/แก้เฉพาะ record ของตัวเอง
- orders: user อ่านเฉพาะ order ของตัวเอง
- order_items: user อ่านเฉพาะ item ที่อยู่ใน order ตัวเอง
- payment_slips: user insert/อ่านเฉพาะ order ตัวเอง

### Admin

- owner/staff อ่านหลังบ้านได้ตาม role
- owner ทำทุกอย่างได้
- staff จำกัดตามงาน เช่น products/orders/customers
- sensitive settings, admin users, financial exports ให้ owner เท่านั้น

## API / Server Actions Draft

ใน Next.js App Router ให้เน้น Server Actions สำหรับฟอร์มหลังบ้าน และ Route Handlers เฉพาะจุดที่ต้อง upload/callback

### Auth

- `signInAdmin(email, password)`
- `signOut()`
- `requireAdmin()`
- `requireOwner()`
- `getCurrentProfile()`

### Dashboard

- `getDashboardSummary(dateRange)`
  - revenueToday
  - expensesToday
  - profitToday
  - newOrdersToday
  - lowStockCount
  - pendingSlipCount
  - newCustomersToday
- `getRevenueSeries(days = 7)`
- `getLatestOrders(limit = 5)`
- `getDashboardAlerts()`

### Products

- `listProducts(filters)`
- `getProduct(id)`
- `createProduct(input)`
- `updateProduct(id, input)`
- `archiveProduct(id)`
- `uploadProductImage(productId, file)`
- `setPrimaryProductImage(productId, imageId)`
- `adjustStock(productId, quantityDelta, note)`

### Orders

- `listOrders(filters)`
- `getOrder(id)`
- `createChatOrder(input)`
- `createWebOrder(input)`
- `uploadPaymentSlip(orderId, file)`
- `approvePaymentSlip(orderId, slipId)`
- `rejectPaymentSlip(orderId, slipId, reason)`
- `updateFulfillmentStatus(orderId, status)`
- `addTracking(orderId, trackingNumber, file?)`

สำคัญ:
- `approvePaymentSlip` ต้องเป็น transaction หรือ RPC ใน Postgres:
  - ตรวจว่า order ยังไม่ได้ paid
  - เปลี่ยน payment_status เป็น `paid`
  - เปลี่ยน fulfillment_status เป็น `ready_to_ship`
  - ลด stock ทุก order_items
  - เขียน inventory_movements

### Financials

- `listRevenue(filters)`
- `listExpenses(filters)`
- `createExpense(input)`
- `updateExpense(id, input)`
- `deleteExpense(id)`
- `getProfitLoss(dateRange)`
- `exportFinancialReport(format, dateRange)`

### Purchase Orders

- `listPurchaseOrders(filters)`
- `getPurchaseOrder(id)`
- `createPurchaseOrder(input)`
- `updatePurchaseOrder(id, input)`
- `markPurchaseOrderReceived(id)`

สำคัญ:
- `markPurchaseOrderReceived` ต้องเพิ่ม stock และสร้าง inventory movements

### Customers

- `listCustomers(filters)`
- `getCustomer(id)`
- `createCustomer(input)`
- `updateCustomer(id, input)`
- `archiveCustomer(id)`
- `getCustomerOrderHistory(customerId)`
- `setCustomerVip(customerId, isVip)`

### Settings

- `getStoreSettings()`
- `updateStoreSettings(input)`
- `updateDefaultMinimumStock(qty)`
- `updateBankAccount(input)`

## Admin Pages

### `/admin/login`

- ฟอร์ม email/password
- redirect เข้า `/admin`
- ถ้าไม่ใช่ owner/staff ห้ามเข้า

### `/admin`

- summary cards 4 ใบ: รายได้วันนี้, รายจ่ายวันนี้, กำไรวันนี้, ออเดอร์ใหม่วันนี้
- alerts: สต็อกต่ำ, รอตรวจสลิป, ลูกค้าใหม่
- chart รายได้ 7 วัน
- ตาราง 5 ออเดอร์ล่าสุด

### `/admin/products`

- ตารางสินค้า
- filter: ชื่อ, SKU, category, status
- ปุ่มเพิ่มสินค้า
- drawer/modal แก้ไขสินค้า
- upload รูปสินค้า
- ปรับ stock แบบ manual

### `/admin/orders`

- ตารางออเดอร์
- filter: payment_status, fulfillment_status, source, date, customer
- detail drawer
- slip preview
- approve/reject slip
- form tracking
- create chat order

### `/admin/inventory`

- รายการ stock ต่ำ
- stock movement log
- manual adjustment

### `/admin/customers`

- ตารางลูกค้า
- profile ลูกค้า
- ประวัติออเดอร์
- flag VIP

### `/admin/financials`

- revenue table
- expense table
- create/edit expense
- profit/loss summary
- export CSV/XLSX/PDF ในเฟสหลัง

### `/admin/purchase-orders`

- PO list
- create PO
- receive PO
- link PO to stock and expenses

### `/admin/settings`

- ข้อมูลร้าน
- บัญชีธนาคาร
- minimum stock default
- admin users ในเฟสหลัง

## Implementation Phases

### Phase 1: Supabase Foundation

- ติดตั้ง `@supabase/supabase-js` และ `@supabase/ssr`
- เพิ่ม `.env.local` keys
- สร้าง Supabase client สำหรับ browser/server
- เพิ่ม middleware/proxy auth refresh ตาม pattern ปัจจุบันของ Supabase
- สร้าง migration schema ชุดแรก
- เปิด RLS ทุกตาราง
- สร้าง storage buckets

### Phase 2: Admin Auth + Layout

- `/admin/login`
- `/admin` protected layout
- role check owner/staff
- sidebar/menu
- logout

### Phase 3: Products + Images + Inventory

- CRUD products
- upload product images
- stock adjustment
- stock movement log
- low-stock alert

### Phase 4: Orders + Payment Slips

- create web/chat order
- upload slip
- admin approve/reject
- automatic stock deduction
- order detail
- tracking update

### Phase 5: Dashboard

- cards, alerts, chart, latest orders
- data pulled from real orders/expenses/stocks

### Phase 6: Customers

- customer list/detail
- order history
- VIP logic

### Phase 7: Financials + Purchase Orders

- expenses
- profit/loss
- purchase orders
- receive PO updates stock and expenses

### Phase 8: Customer Account

- customer login/account
- order history
- tracking
- slip upload from customer side

## Files To Add In Codebase

```text
app/admin/login/page.tsx
app/admin/layout.tsx
app/admin/page.tsx
app/admin/products/page.tsx
app/admin/orders/page.tsx
app/admin/inventory/page.tsx
app/admin/customers/page.tsx
app/admin/financials/page.tsx
app/admin/purchase-orders/page.tsx
app/admin/settings/page.tsx
app/account/login/page.tsx
app/account/orders/page.tsx
app/lib/supabase/client.ts
app/lib/supabase/server.ts
app/lib/admin/auth.ts
app/lib/admin/actions/*.ts
supabase/migrations/*.sql
```

## First Migration Checklist

- Create enums or text check constraints for statuses
- Create tables in dependency order
- Add indexes:
  - products sku/slug/status/category
  - orders order_no/customer_id/payment_status/fulfillment_status/source/created_at
  - inventory_movements product_id/created_at/reference_id
  - payment_slips order_id/status
  - customers phone/email
- Enable RLS on every table
- Add basic policies
- Create buckets and storage policies
- Add RPC for approving slips and receiving PO

## Decisions To Confirm Later

- จะให้ staff อนุมัติสลิปได้ไหม หรือ owner เท่านั้น
- ต้องการหลายไซซ์/หลายสีแบบ variant จริงไหม เช่น product_variants
- จะคิดค่าส่งอย่างไร: fixed, manual, หรือตามพื้นที่
- จะมี coupon/discount ตั้งแต่แรกไหม
- จะใช้เลขออเดอร์ format ไหน
- จะให้ลูกค้า checkout เองตั้งแต่แรก หรือเริ่มจากแอดมินสร้าง order จากแชทก่อน

## Recommended MVP Scope

เพื่อให้หลังบ้านใช้งานจริงเร็วที่สุด ให้เริ่มจาก:

1. Supabase foundation
2. Admin login
3. Products + stock
4. Orders from chat
5. Slip approve/reject
6. Auto stock deduction
7. Dashboard summary

Checkout ลูกค้า, customer account, PO, financial exports ทำตามหลังได้โดยไม่เสียโครง ถ้าวาง schema ตามนี้ตั้งแต่แรก
