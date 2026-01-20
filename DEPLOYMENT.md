# 📚 Hướng dẫn Triển khai (Deployment Guide)

## 🎯 Tổng quan

Tài liệu này hướng dẫn cách triển khai ứng dụng Nhà hàng Lẩu Nướng lên các nền tảng khác nhau.

---

## 1️⃣ Chuẩn bị trước khi Deploy

### ✅ Checklist trước deployment

- [ ] Kiểm tra tất cả lỗi build: `npm run build`
- [ ] Cập nhật `.env` với các giá trị production
- [ ] Kiểm tra responsive trên mobile/tablet
- [ ] Test tất cả forms và buttons
- [ ] Kiểm tra Google OAuth credentials
- [ ] Cập nhật SEO meta tags
- [ ] Kiểm tra performance: `npm run build` kích thước

### 📦 Build production

```bash
npm run build
```

Output sẽ nằm trong thư mục `build/`

---

## 🌐 Phương pháp Deploy

### **Option 1: Vercel (Khuyến nghị - Miễn phí & dễ nhất)**

#### Bước 1: Kết nối GitHub

```bash
# 1. Push code lên GitHub
git add .
git commit -m "Initial commit"
git push origin main
```

#### Bước 2: Cấu hình Vercel

1. Truy cập https://vercel.com
2. Đăng nhập bằng GitHub
3. Nhấp "New Project"
4. Chọn repository `SRC_SMAS_CLIENT`
5. Cấu hình:
   - **Framework**: React
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `build`

#### Bước 3: Thiết lập biến môi trường

1. Vào "Settings" → "Environment Variables"
2. Thêm các biến:
   ```
   REACT_APP_API_URL=https://your-api.com/api
   REACT_APP_GOOGLE_CLIENT_ID=your_google_id
   ```

#### Bước 4: Deploy

Nhấp "Deploy" - Vercel sẽ tự động build và deploy

**Lợi ích:**
- ✅ Miễn phí
- ✅ Tự động build từ GitHub
- ✅ CDN toàn cầu
- ✅ HTTPS tự động
- ✅ Custom domain miễn phí

---

### **Option 2: Netlify**

#### Bước 1: Install Netlify CLI

```bash
npm install -g netlify-cli
```

#### Bước 2: Đăng nhập Netlify

```bash
netlify login
```

#### Bước 3: Khởi tạo & Deploy

```bash
# Tạo tệp netlify.toml (đã có sẵn)
netlify init

# Deploy
npm run build
netlify deploy --prod --dir=build
```

#### Hoặc kết nối GitHub (dễ hơn):

1. Truy cập https://netlify.com
2. Đăng nhập GitHub
3. Chọn "New site from Git"
4. Chọn repository
5. Cấu hình:
   - **Build command**: `npm run build`
   - **Publish directory**: `build`

**Lợi ích:**
- ✅ Miễn phí
- ✅ Kết hợp với GitHub dễ dàng
- ✅ Analytics được tích hợp
- ✅ Serverless functions

---

### **Option 3: AWS Amplify**

#### Bước 1: Install Amplify CLI

```bash
npm install -g @aws-amplify/cli
```

#### Bước 2: Khởi tạo dự án

```bash
amplify init
```

#### Bước 3: Thêm hosting

```bash
amplify add hosting
amplify publish
```

**Lợi ích:**
- ✅ Tích hợp AWS services
- ✅ Scalable
- ✅ Serverless

---

### **Option 4: Docker + Cloud Run (Google/AWS)**

#### Bước 1: Build Docker image

```bash
docker build -t restaurant-app:latest .
```

#### Bước 2: Test locally

```bash
docker run -p 3000:80 restaurant-app:latest
```

#### Bước 3: Upload lên Container Registry

**Google Cloud Run:**

```bash
# Xác thực
gcloud auth login

# Configure Docker
gcloud auth configure-docker

# Tag image
docker tag restaurant-app:latest gcr.io/PROJECT_ID/restaurant-app:latest

# Push
docker push gcr.io/PROJECT_ID/restaurant-app:latest

# Deploy
gcloud run deploy restaurant-app \
  --image gcr.io/PROJECT_ID/restaurant-app:latest \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

**AWS ECR + ECS:**

```bash
# Tạo repository
aws ecr create-repository --repository-name restaurant-app

# Login ECR
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin \
  YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com

# Tag & Push
docker tag restaurant-app:latest YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/restaurant-app:latest
docker push YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/restaurant-app:latest
```

---

### **Option 5: cPanel / Shared Hosting**

#### Bước 1: Build locally

```bash
npm run build
```

#### Bước 2: Upload files

1. Kết nối FTP với server
2. Tạo folder mới (ví dụ: `app`)
3. Upload tất cả files từ thư mục `build/`

#### Bước 3: Cấu hình `.htaccess`

Tạo file `.htaccess` trong thư mục gốc:

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>
```

#### Bước 4: Cấu hình Node.js (nếu cPanel hỗ trợ)

```bash
cd ~
npm install
npm run build
```

**Chi phí:** Từ $5-10/tháng

---

### **Option 6: VPS (DigitalOcean, Linode, Vultr)**

#### Bước 1: Kết nối SSH

```bash
ssh root@your_server_ip
```

#### Bước 2: Cài đặt Node.js

```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

#### Bước 3: Clone dự án

```bash
cd /var/www
git clone your_repo_url restaurant-app
cd restaurant-app/frontend
npm install
npm run build
```

#### Bước 4: Cấu hình Nginx

```bash
sudo apt-get install nginx
```

File `/etc/nginx/sites-available/restaurant-app`:

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    root /var/www/restaurant-app/frontend/build;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location ~ \.js$ {
        add_header Cache-Control "public, max-age=31536000, immutable";
    }

    location ~ \.css$ {
        add_header Cache-Control "public, max-age=31536000, immutable";
    }
}
```

#### Bước 5: Enable & Restart

```bash
sudo ln -s /etc/nginx/sites-available/restaurant-app /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

#### Bước 6: Cấu hình SSL (Let's Encrypt)

```bash
sudo apt-get install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

**Chi phí:** $5-20/tháng

---

## 🔒 Biến môi trường Production

Tạo file `.env.production` (không commit):

```env
REACT_APP_API_URL=https://api.restaurant-app.com
REACT_APP_GOOGLE_CLIENT_ID=xxxxxxxxxxxx.apps.googleusercontent.com
REACT_APP_ENV=production
REACT_APP_ENABLE_ANALYTICS=true
```

---

## 📊 Monitoring & Logging

### Vercel Analytics

```javascript
// src/index.js
import { Analytics } from '@vercel/analytics/react';

root.render(
  <React.StrictMode>
    <App />
    <Analytics />
  </React.StrictMode>
);
```

### Google Analytics

```javascript
// src/index.js
import ReactGA from 'react-ga4';

ReactGA.initialize('G-XXXXXXXXXX');
```

---

## ✅ Kiểm tra sau Deploy

- [ ] Trang home load đúng
- [ ] Form submit hoạt động
- [ ] Responsive trên mobile
- [ ] Google login hoạt động
- [ ] Console không có errors
- [ ] Performance tốt (< 3s)
- [ ] SEO meta tags render đúng

---

## 🆘 Troubleshooting

### Build Error: "Module not found"

```bash
rm -rf node_modules package-lock.json
npm install
npm run build
```

### CORS Error khi call API

Thêm vào backend:

```javascript
app.use(cors({
  origin: ['https://yourdomain.com', 'http://localhost:3000']
}));
```

### Route 404 trên production

Đảm bảo cấu hình `.htaccess` hoặc Nginx để redirect về `index.html`

### Slow Performance

```bash
npm run build -- --analyze
```

Cài đặt `source-map-explorer`:

```bash
npm install --save-dev source-map-explorer
```

---

## 📞 Hỗ trợ

- Vercel: https://vercel.com/support
- Netlify: https://docs.netlify.com
- AWS: https://docs.aws.amazon.com

---

**Last Updated**: 18/01/2026
