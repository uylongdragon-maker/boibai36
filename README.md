# Bói Bài 36 — Oracle 36

Ứng dụng xem bài trực tuyến bằng Next.js, gồm hai hệ bài:

- Petit Lenormand 36 lá
- Bài Tây 36 lá: 6, 7, 8, 9, 10, J, Q, K, A của bốn chất

## Tính năng

- Nhập câu hỏi và chọn kiểu trải 3, 5, 9 hoặc Grand Tableau 36 lá
- Chọn bài thủ công hoặc xào/rút ngẫu nhiên
- Mở camera và dùng OpenAI Vision để nhận diện thứ tự lá
- Luận giải theo câu hỏi, vị trí và mạch tương tác giữa các lá
- Lưu lịch sử vào Firebase Firestore bằng Anonymous Authentication
- Giao diện huyền bí, responsive và hiệu ứng xào/đọc bài

## Chạy local

```bash
npm install
cp .env.example .env.local
npm run dev
```

Mở `http://localhost:3000`.

## Cấu hình Firebase

1. Tạo Firebase project và Firestore database.
2. Bật **Authentication → Sign-in method → Anonymous**.
3. Dùng nội dung `firestore.rules` làm Firestore Security Rules.
4. Điền `NEXT_PUBLIC_FIREBASE_API_KEY` và `NEXT_PUBLIC_FIREBASE_PROJECT_ID`.

Nếu chưa cấu hình Firebase, ứng dụng vẫn chạy ở chế độ demo nhưng không lưu lịch sử.

## Cấu hình nhận diện camera

Điền `OPENAI_API_KEY` ở môi trường server. Không dùng tiền tố `NEXT_PUBLIC_` cho khóa này.
Có thể đổi model bằng `OPENAI_VISION_MODEL`.

## Deploy Vercel

1. Import repository này trong Vercel.
2. Framework Preset: **Next.js**.
3. Thêm các biến trong `.env.example` vào **Project Settings → Environment Variables**.
4. Deploy.

Camera trên điện thoại cần HTTPS; Vercel cung cấp HTTPS mặc định.

> Kết quả chỉ mang tính chiêm nghiệm và tham khảo, không thay thế tư vấn y tế, pháp lý hoặc tài chính chuyên môn.
