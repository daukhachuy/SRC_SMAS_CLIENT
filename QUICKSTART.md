# 🚀 Hướng dẫn Nhanh Chóng (Quick Start)

## 📦 Cài đặt & Chạy

### 1. Cài đặt dependencies (chỉ lần đầu)

```powershell
cd D:\fpt1\SRC_SMAS_CLIENT\frontend
npm install
```

### 2. Chạy development server

```powershell
npm start
```

Ứng dụng sẽ tự động mở ở `http://localhost:3000`

### 3. Build production

```powershell
npm run build
```

Output sẽ nằm trong thư mục `build/`

---

## ✨ Giao diện đã hoàn thành

✅ **Trang Đăng Nhập/Đăng Ký**
- Màu cam chính: `#FF6C1F`
- Nền: `#F9F4F0`
- Responsive design (Mobile/Tablet/Desktop)
- Google OAuth integration ready
- Form validation
- Forgot password link
- Remember me checkbox

---

## 🎨 Màu sắc & Thiết kế

| Element | Màu | Mã Hex |
|---------|-----|--------|
| Màu chính | Cam | `#FF6C1F` |
| Nền | Kem nhạt | `#F9F4F0` |
| Text tối | Đen | `#1a1a1a` |
| Text nhạt | Xám | `#666666` |
| Border | Xám nhạt | `#e0e0e0` |

---

## 📁 File đã tạo/sửa

```
frontend/
├── src/
│   ├── pages/AuthPage.js          ✅ NEW - Component trang đăng nhập
│   ├── styles/AuthPage.css        ✅ NEW - Styles trang đăng nhập
│   ├── App.js                     ✅ UPDATED - Setup routing
│   └── index.js                   ✅ UPDATED - Entry point
├── .env.example                   ✅ NEW - Template biến môi trường
├── vercel.json                    ✅ UPDATED - Config Vercel
├── netlify.toml                   ✅ UPDATED - Config Netlify
├── Dockerfile                     ✅ UPDATED - Docker config
├── docker-compose.yml             ✅ UPDATED - Docker Compose config
├── nginx.conf                     ✅ UPDATED - Nginx config
├── DEPLOYMENT.md                  ✅ NEW - Hướng dẫn deploy chi tiết
└── README.md                      ✅ UPDATED - Readme chính
```

---

## 🌐 Deploy

### Cách nhanh nhất (Vercel - Khuyến nghị)

1. **Push code lên GitHub**
   ```powershell
   git add .
   git commit -m "Initial AuthPage implementation"
   git push origin main
   ```

2. **Vercel Deploy (Free)**
   - Truy cập https://vercel.com
   - Sign in with GitHub
   - Import repository
   - Chọn `frontend` folder
   - Click Deploy

🎉 **DONE!** - Ứng dụng sẽ được deploy tự động

### Các lựa chọn khác

- **Netlify**: Tương tự Vercel, miễn phí, có CDN
- **Docker + Cloud Run**: Hoàn toàn serverless
- **VPS (DigitalOcean)**: Kiểm soát toàn bộ, $5/tháng
- **cPanel**: Shared hosting thường có

Xem chi tiết tại `DEPLOYMENT.md`

---

## 🔐 Setup biến môi trường

1. **Copy `.env.example` thành `.env`**
   ```powershell
   Copy-Item .env.example .env
   ```

2. **Edit `.env` với các giá trị của bạn**
   ```
   REACT_APP_API_URL=http://localhost:5000/api
   REACT_APP_GOOGLE_CLIENT_ID=your_google_id_here
   ```

3. **Restart dev server** để áp dụng

---

## 🧪 Test Application

### Chạy dev server
```powershell
npm start
```

### Test responsive
- Mở DevTools (F12)
- Chọn các breakpoint khác nhau:
  - Desktop (1024px+)
  - Tablet (768px-1024px)
  - Mobile (480px-768px)
  - Small Mobile (<480px)

### Test functionality
- [ ] Form submit
- [ ] Email validation
- [ ] Password input mask
- [ ] Remember me checkbox
- [ ] Links hoạt động
- [ ] Button hover effects

---

## 🐛 Troubleshooting

### Port 3000 đã được sử dụng
```powershell
$env:PORT = 3001; npm start
```

### Module not found
```powershell
rm -r node_modules, package-lock.json
npm install
npm start
```

### Build error
```powershell
npm cache clean --force
npm install
npm run build
```

---

## 📊 Performance

Build kích thước sau gzip:
- JS: 53.2 kB
- CSS: 1.88 kB
- **Tổng: ~55 kB** ✅ (Rất tốt)

---

## 📞 Next Steps

1. **Backend Integration**
   - Kết nối API endpoint
   - Setup authentication
   - Configure CORS

2. **Thêm Pages**
   - Dashboard page
   - Menu page
   - Booking page
   - Profile page

3. **Production Setup**
   - Setup SSL certificate
   - Configure custom domain
   - Setup analytics
   - Setup error tracking

---

**Phiên bản**: 1.0.0  
**Build Status**: ✅ SUCCESS  
**Deploy Ready**: ✅ YES  

---

Hãy chạy `npm start` để xem giao diện! 🎉
