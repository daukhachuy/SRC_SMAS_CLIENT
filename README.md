# 🍲 Nhà hàng Lẩu Nướng - Frontend

Giao diện frontend cho ứng dụng quản lý nhà hàng Lẩu Nướng được xây dựng với React.

## 🎨 Thiết kế

- **Màu chính**: `#FF6C1F` (Cam)
- **Nền**: `#F9F4F0` (Kem nhạt)
- **Thiết kế đáp ứng**: Hỗ trợ đầy đủ mobile, tablet, desktop

## 📋 Yêu cầu

- Node.js >= 14.0.0
- npm >= 6.0.0

## 🚀 Cài đặt & Chạy

### 1. Cài đặt dependencies

```bash
cd frontend
npm install
```

### 2. Chạy development server

```bash
npm start
```

Ứng dụng sẽ mở tại `http://localhost:3000`

### 3. Build cho production

```bash
npm run build
```

Các file tối ưu hóa sẽ nằm trong thư mục `build/`

## 📁 Cấu trúc thư mục

```
frontend/
├── public/
│   ├── index.html          # HTML chính
│   └── images/             # Ảnh static
├── src/
│   ├── pages/
│   │   └── AuthPage.js     # Trang đăng nhập/đăng ký
│   ├── components/         # React components
│   ├── contexts/           # Context API
│   ├── api/                # API calls
│   ├── styles/
│   │   └── AuthPage.css    # Style trang Auth
│   ├── assets/             # Assets (hình ảnh, font)
│   ├── utils/              # Utility functions
│   ├── App.js              # App component chính
│   └── index.js            # Entry point
├── package.json            # Dependencies
└── README.md              # File này
```

## 🔧 Công nghệ sử dụng

- **React** 18.2.0 - Library UI
- **React Router** 6.30.2 - Định tuyến
- **React Icons** 5.5.0 - Icons
- **Axios** 1.4.0 - HTTP client
- **Framer Motion** 12.23.25 - Animations
- **React Helmet** 6.1.0 - SEO

## 🎯 Tính năng chính

✅ Trang đăng nhập/đăng ký đẹp mắt  
✅ Đăng nhập với Google OAuth  
✅ Responsive design (Mobile, Tablet, Desktop)  
✅ Form validation  
✅ Remember me checkbox  
✅ Forgot password link  

## 📱 Responsive Breakpoints

- **Desktop**: > 1024px
- **Tablet**: 768px - 1024px
- **Mobile**: < 768px
- **Small Mobile**: < 480px

## 🌐 Triển khai

### Vercel

1. Đẩy code lên GitHub
2. Kết nối repository với Vercel
3. Vercel sẽ tự động build và deploy

### Netlify

```bash
npm install -g netlify-cli
npm run build
netlify deploy --prod --dir=build
```

### AWS Amplify

```bash
npm install -g @aws-amplify/cli
amplify init
amplify publish
```

### Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

### cPanel/Shared Hosting

1. Build locally: `npm run build`
2. Upload thư mục `build/` lên server
3. Cấu hình `.htaccess` để hỗ trợ React Router

## 🔐 Biến môi trường

Tạo file `.env` trong thư mục `frontend/`:

```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_GOOGLE_CLIENT_ID=your_google_client_id_here
```

## 🐛 Khắc phục sự cố

### Port 3000 đã được sử dụng

```bash
PORT=3001 npm start
```

### Module không tìm thấy

```bash
rm -rf node_modules package-lock.json
npm install
```

### Build thất bại

```bash
npm cache clean --force
npm install
npm run build
```

## 📝 License

Private - Bản quyền thuộc về Nhà hàng Lẩu Nướng

## 👥 Liên hệ

- Email: support@launutong.vn
- Điện thoại: (84) XXX-XXXX-XXXX

---

**Phiên bản**: 0.1.0  
**Cập nhật lần cuối**: 18/01/2026
npm install
npm start
```

Notes:
- The `package.json` has been updated to use `react-scripts` (CRA) rather than Vite/webpack custom setup.
- If you choose Option A, the `npx create-react-app` command will fully scaffold a standard CRA app (recommended).
- `src/` contains components, pages and an `api/` folder for Axios helpers to call backend APIs.
- Implement an Auth context and route guards for admin vs. customer views.
