# Vibe — Sosyal Medya Simülatörü

Kullanıcı gerçek bir kişi; etrafındaki herkes AI karakter. Post at, beğeni/yorum/DM al, takipçi kazan.

**Repo:** [github.com/kemalp07/social-media-app](https://github.com/kemalp07/social-media-app.git)

## Stack

| Katman | Teknoloji |
|--------|-----------|
| Frontend | React Native (Expo) |
| Backend | FastAPI |
| Database | Supabase |
| AI | Gemini Flash |
| Avatar | DiceBear |
| Push | Firebase FCM |

## Renk Paleti

- Primary: `#378ADD`
- Secondary: `#1D9E75`
- Dark bg: `#0f1117`
- Dark card: `#1e2130`

## Kurulum

### Supabase
```sql
-- Sırayla çalıştır:
supabase/migrations/001_initial_schema.sql
supabase/migrations/002_vibe_updates.sql
supabase/seed/comment_templates.sql
```
Storage'da `posts` bucket oluştur (public).

### Backend
```bash
cd backend
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Fake Users
```bash
python -m scripts.seed_fake_users --tier 1
python -m scripts.seed_fake_users --tier 2
python -m scripts.seed_fake_users --tier 3 --batch 1000
```

### Mobile
```bash
cd mobile
npm install
cp .env.example .env
npx expo start
```

## Proje Yapısı

```
backend/     → FastAPI (engagement, growth, DM, AI)
mobile/      → Expo app (feed, explore, DM, profil)
supabase/    → SQL migrations
```

## Özellikler

- AI post analizi (kalite skoru 1-10)
- Zaman bazlı beğeni damlaması
- Template + AI yorumlar
- Tier 1 DM (kişilik bazlı Gemini)
- Organik takipçi büyümesi (saatlik cron)
- Milestone sistemi (100 → 1M)
- Premium monetizasyon
