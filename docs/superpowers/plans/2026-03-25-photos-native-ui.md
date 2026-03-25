# Photos Native UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Làm gọn lại app `Ảnh` theo cảm giác gần app Ảnh trên iPhone, thêm trang album riêng, và giữ đầy đủ thao tác upload/chia sẻ/di chuyển/xóa.

**Architecture:** Giữ API và model hiện có, nhưng tách lại UI thành các khối rõ ràng: shell hai tab, grid ảnh, grid album, viewer ảnh, và trang album chi tiết. Viewer và menu thao tác dùng lại giữa thư viện chung và từng album để giao diện đồng nhất và dễ bảo trì.

**Tech Stack:** Next.js App Router, React, TypeScript, TanStack Query, Supabase, Tailwind CSS, `lucide-react`

---

### Task 1: Khảo sát và tách lại cấu trúc UI ảnh

**Files:**
- Modify: `C:\Users\nam17\OneDrive\Desktop\namtuoc\src\modules\photos\components\photo-shell.tsx`
- Create: `C:\Users\nam17\OneDrive\Desktop\namtuoc\src\modules\photos\components\photo-viewer.tsx`
- Create: `C:\Users\nam17\OneDrive\Desktop\namtuoc\src\modules\photos\components\photo-grid.tsx`
- Create: `C:\Users\nam17\OneDrive\Desktop\namtuoc\src\modules\photos\components\album-grid.tsx`

- [ ] **Step 1: Viết test kiểm tra render cơ bản nếu repo đã có test setup; nếu chưa có thì ghi chú bỏ qua**

Kiểm tra xem repo có `vitest`, `jest`, hoặc test setup cho component hay không. Nếu không có, dùng build verification thay cho test UI tự động.

- [ ] **Step 2: Chạy kiểm tra hiện trạng**

Run: `npm run build`
Expected: thấy lỗi hiện tại nếu có, đồng thời xác nhận app ảnh là điểm đang chỉnh.

- [ ] **Step 3: Tách `photo-shell.tsx` thành các phần nhỏ**

Tạo các component:
- `photo-grid.tsx`: render lưới ảnh 3 cột
- `album-grid.tsx`: render lưới album 3 cột
- `photo-viewer.tsx`: viewer ảnh nền tối với toolbar icon-first

- [ ] **Step 4: Dọn `photo-shell.tsx`**

Để file này chỉ còn:
- state tab
- upload trigger
- feedback chung
- nối data hooks với các component con

- [ ] **Step 5: Commit**

```bash
git add src/modules/photos/components/photo-shell.tsx src/modules/photos/components/photo-viewer.tsx src/modules/photos/components/photo-grid.tsx src/modules/photos/components/album-grid.tsx
git commit -m "feat: restructure photos ui components"
```

### Task 2: Làm lại tab Tất cả ảnh theo kiểu native-like

**Files:**
- Modify: `C:\Users\nam17\OneDrive\Desktop\namtuoc\src\modules\photos\components\photo-shell.tsx`
- Modify: `C:\Users\nam17\OneDrive\Desktop\namtuoc\src\modules\photos\components\photo-grid.tsx`
- Modify: `C:\Users\nam17\OneDrive\Desktop\namtuoc\src\modules\photos\components\photo-viewer.tsx`

- [ ] **Step 1: Làm header gọn**

Header gồm:
- tiêu đề ngắn
- segmented tab gọn
- nút upload dạng tròn, chỉ icon hoặc icon + nhãn rất ngắn

- [ ] **Step 2: Chuyển grid ảnh về 3 cột mobile, ít viền**

Yêu cầu:
- `grid-cols-3`
- gap nhỏ
- ảnh vuông, `object-cover`
- bỏ card dày hoặc padding dư

- [ ] **Step 3: Thiết kế lại viewer ảnh**

Viewer cần:
- nền đen
- ảnh lớn
- nút đóng gọn
- toolbar dưới cho `Chia sẻ`, `Di chuyển`, `Xóa`
- `Lấy đường dẫn ảnh` là thao tác phụ gọn hơn

- [ ] **Step 4: Chạy build kiểm tra**

Run: `npm run build`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/modules/photos/components/photo-shell.tsx src/modules/photos/components/photo-grid.tsx src/modules/photos/components/photo-viewer.tsx
git commit -m "feat: refresh all photos mobile ui"
```

### Task 3: Làm lại tab Album và thêm route album riêng

**Files:**
- Modify: `C:\Users\nam17\OneDrive\Desktop\namtuoc\src\modules\photos\components\album-grid.tsx`
- Modify: `C:\Users\nam17\OneDrive\Desktop\namtuoc\src\modules\photos\components\photo-shell.tsx`
- Create: `C:\Users\nam17\OneDrive\Desktop\namtuoc\src\app\apps\photos\album\[folderId]\page.tsx`
- Modify: `C:\Users\nam17\OneDrive\Desktop\namtuoc\src\modules\photos\hooks.ts`
- Modify: `C:\Users\nam17\OneDrive\Desktop\namtuoc\src\modules\photos\api.ts`

- [ ] **Step 1: Tạo route album riêng**

Trang mới cần:
- đọc `folderId` từ route
- tải danh sách ảnh theo album
- header back + tên album + menu `...`
- mở viewer giống thư viện chung

- [ ] **Step 2: Cho album tile điều hướng vào trang album**

Trong `Album` tab:
- bấm tile album => chuyển route vào trang album
- nút `...` vẫn đứng riêng, không cản navigation

- [ ] **Step 3: Đảm bảo rename/delete album cập nhật lại các query liên quan**

Sau rename/delete:
- list album cập nhật
- số lượng ảnh cập nhật
- ảnh chuyển về không album nếu xóa album

- [ ] **Step 4: Chạy build kiểm tra**

Run: `npm run build`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/modules/photos/components/album-grid.tsx src/modules/photos/components/photo-shell.tsx src/app/apps/photos/album/[folderId]/page.tsx src/modules/photos/hooks.ts src/modules/photos/api.ts
git commit -m "feat: add album detail screen"
```

### Task 4: Tinh chỉnh cache, empty states, và hoàn tất polish

**Files:**
- Modify: `C:\Users\nam17\OneDrive\Desktop\namtuoc\src\modules\photos\hooks.ts`
- Modify: `C:\Users\nam17\OneDrive\Desktop\namtuoc\src\modules\photos\components\photo-shell.tsx`
- Modify: `C:\Users\nam17\OneDrive\Desktop\namtuoc\src\modules\photos\components\photo-viewer.tsx`
- Modify: `C:\Users\nam17\OneDrive\Desktop\namtuoc\src\modules\photos\components\album-grid.tsx`

- [ ] **Step 1: Làm cache phản hồi nhanh hơn**

Khi upload/move/delete:
- invalidate đúng query
- nếu cần, cập nhật optimistic cache cho trải nghiệm mượt hơn

- [ ] **Step 2: Tối ưu empty state**

Empty state phải ngắn, rõ, không chiếm nhiều chiều cao:
- chưa có ảnh
- chưa có album
- album rỗng

- [ ] **Step 3: Kiểm tra icon/SVG và độ gọn**

Rà lại toàn bộ app ảnh:
- icon đủ rõ nghĩa
- nhãn ngắn
- tránh lặp chữ thừa

- [ ] **Step 4: Chạy build cuối**

Run: `npm run build`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/modules/photos/hooks.ts src/modules/photos/components/photo-shell.tsx src/modules/photos/components/photo-viewer.tsx src/modules/photos/components/album-grid.tsx
git commit -m "feat: polish photos interactions"
```
