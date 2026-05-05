# StreamVault — IPTV Player

مشغل IPTV احترافي يعمل مع سيرفرات Xtream Codes.

## هيكل المشروع

```
project/
├── backend/
│   ├── server.js          # Express server
│   ├── package.json
│   ├── .env.example
│   └── routes/
│       ├── auth.js        # تسجيل الدخول
│       ├── channels.js    # جلب القنوات والأفلام
│       └── stream.js      # Proxy البث
├── frontend/
│   ├── index.html
│   ├── style.css
│   └── player.js
└── render.yaml
```

## الرفع على Render

### 1. ارفع المشروع على GitHub
```bash
git init
git add .
git commit -m "initial commit"
git remote add origin https://github.com/USERNAME/streamvault.git
git push -u origin main
```

### 2. أنشئ Web Service على Render
- اذهب إلى https://render.com
- New → Web Service
- اربطه بـ GitHub repo
- Root Directory: `backend`
- Build Command: `npm install`
- Start Command: `node server.js`

### 3. متغيرات البيئة على Render
أضف في Environment Variables:
```
PORT = 3000
```

## تشغيل محلي

```bash
cd backend
npm install
node server.js
```

افتح المتصفح على: http://localhost:3000

## API Endpoints

| Method | Route | وصف |
|--------|-------|------|
| POST | /api/auth/login | تسجيل الدخول |
| GET | /api/channels/live | قائمة القنوات |
| GET | /api/channels/movies | قائمة الأفلام |
| GET | /api/channels/categories | التصنيفات |
| GET | /api/stream/live/:id | بث قناة مباشرة |
| GET | /api/stream/movie/:id | تشغيل فيلم |

## ملاحظات
- بيانات الدخول لا تُخزَّن في أي مكان
- كل البث يمر عبر الباكند (Proxy) لتجنب مشاكل CORS
- يدعم HLS و TS streams
