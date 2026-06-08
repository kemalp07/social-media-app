# GlowUp — Social Media Simulator

Sahte etkileşimli sosyal medya simülatörü. Gerçek kullanıcılar post atar; Tier 1/2/3 botlar beğeni, yorum ve DM ile etkileşim sağlar.

## Mimari

| Katman | Teknoloji |
|--------|-----------|
| Frontend | React Native (Expo) |
| Backend | FastAPI |
| Veritabanı | Supabase (PostgreSQL) |
| AI | Gemini Flash |
| Avatarlar | DiceBear |
| Push | Firebase FCM |

## Proje Yapısı

```
social-media-app/
├── backend/          # FastAPI API + scheduler
├── mobile/           # Expo React Native app
└── supabase/         # SQL migrations + seed
```

## Kurulum

### 1. Supabase

1. [supabase.com](https://supabase.com) üzerinde proje oluştur
2. SQL Editor'de sırayla çalıştır:
   - `supabase/migrations/001_initial_schema.sql`
   - `supabase/seed/comment_templates.sql`
3. Storage'da `posts` bucket'ı oluştur (public)
4. Project Settings → API'den URL ve `service_role` key al

### 2. Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
pip install -r requirements.txt
cp .env.example .env         # Anahtarları doldur
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

`.env` dosyası:
```
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_KEY=service-role-key
GEMINI_API_KEY=your-key
FIREBASE_CREDENTIALS_PATH=./firebase-credentials.json
```

### 3. Fake User Seed

```bash
cd backend
# Önce Tier 1 (200 karakter - DM + AI yorum)
python -m scripts.seed_fake_users --tier 1

# Tier 2 (4800 - yorum + profil)
python -m scripts.seed_fake_users --tier 2

# Tier 3 (995K - sadece beğeni, batch halinde)
python -m scripts.seed_fake_users --tier 3 --batch 10000
```

### 4. Mobile (Expo)

```bash
cd mobile
npm install
cp .env.example .env
# Fiziksel cihazda test için EXPO_PUBLIC_API_URL=http://SENIN-IP:8000
npx expo start
```

## API Endpoints

| Method | Path | Açıklama |
|--------|------|----------|
| POST | `/api/users` | Kullanıcı oluştur |
| POST | `/api/posts?user_id=` | Post at (AI analiz + engagement) |
| GET | `/api/posts/feed/{user_id}` | Feed |
| GET | `/api/notifications/{user_id}` | Bildirimler |
| GET | `/api/messages/conversations/{user_id}` | DM listesi |
| POST | `/api/messages/conversations/{id}/send` | Mesaj gönder |
| GET | `/api/fake-users/tier1/list` | DM açık karakterler |

## Özellikler

- **Post akışı:** AI kalite skoru → beğeni damlaması → yorumlar → takipçi artışı
- **Beğeni algoritması:** `quality_score × takipçi_oranı`, 4 zaman penceresinde dağılım
- **Viral:** Skor 8+ → %20 ihtimal → 10x beğeni
- **Yorumlar:** 400 template + Tier 1 AI yorumları (Gemini)
- **DM:** Tier 1 karakterler, kişilik koruyan AI cevaplar
- **Pasif büyüme:** Saatlik cron (+2-8 takipçi, premium 2x)
- **Milestone:** 100 → 1M takipçi, beğeni eşikleri
- **Premium:** ₺49/ay — sınırsız post/DM, 2x büyüme

## Scheduler (Otomatik)

Backend başladığında APScheduler çalışır:

| Job | Sıklık | Görev |
|-----|--------|-------|
| `deliver_likes` | 1 dk | Zamanlanmış beğenileri teslim et |
| `passive_growth` | 1 saat | Pasif takipçi artışı |
| `bot_dms` | Günlük 10:00 | Tier 1 botlar DM başlatır |
| `daily_digest` | Günlük 09:00 | Push özet bildirimleri |

## Monetizasyon

| | Ücretsiz | Premium |
|--|----------|---------|
| Post | 3/gün | Sınırsız |
| DM | 5/gün | Sınırsız |
| Büyüme | Normal | 2x |
| Viral boost | — | Haftada 1 |
