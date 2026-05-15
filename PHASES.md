# 42 Tycoon — Geliştirme Aşamaları

---

## Faz 1 — Temel Altyapı (Foundation)
**Hedef:** Oyuncu kayıt/giriş yapabilir, veritabanı hazır, temel arayüz ayağa kalkar.

### Görevler
- [ ] Supabase projesi kur, `schema.sql` çalıştır
- [ ] `@supabase/ssr` ile auth akışını bağla (OAuth callback → `users` tablosu upsert)
- [ ] 42 OAuth uygulaması oluştur (intra.42.fr/en/oauth/applications)
- [ ] `.env.local` doldur (`SUPABASE_URL`, `SUPABASE_ANON_KEY`, `FT_API_*`)
- [ ] Root layout'a NES.css + Press Start 2P fontu entegre et
- [ ] Login sayfası (`/`) — "42 ile Giriş Yap" butonu çalışır hale getir
- [ ] Auth callback route (`/auth/callback`) — session exchange + yönlendirme
- [ ] Dashboard layout — nav bar, auth guard (giriş yoksa `/`'e redirect)
- [ ] `users` tablosuna yeni kayıt eklendiğinde `intra_login` alanını doldur

**Bitiş Kriteri:** Kullanıcı giriş yapıp `/dashboard`'u görebiliyor.

---

## Faz 2 — Çekirdek Oynanış Döngüsü (Core Loop)
**Hedef:** 42 API'dan log time çekilir, streak hesaplanır, daily claim çalışır.

### Görevler
- [ ] `lib/42api/logtime.js` — client_credentials token + locations_stats endpoint testi
- [ ] `lib/streak.js` — `getNextStreak`, `getMultiplier`, `streakDayLabel` unit testi yaz
- [ ] `lib/economy.js` — `calculateCoins`, `applyUpgradeBonus` unit testi yaz
- [ ] `POST /api/claim` — idempotent, claim edilmişse hata döner
- [ ] `DailyClaimButton` + `DailyClaimModal` — Framer Motion animasyonlu açılış
- [ ] Supabase cron / pg_cron ile `reset_daily_claim()` her gece 00:00'da tetiklenir
- [ ] Supabase cron / pg_cron ile `reset_weekly()` her Pazartesi 00:00'da tetiklenir
- [ ] Dashboard ana sayfasında `StatsPanel` ve `StreakDisplay` gerçek veriyle çalışır

**Bitiş Kriteri:** Kullanıcı "Günlük Claim" butonuna basınca dünkü log time okunur,
çarpan uygulanır, LogCoin bakiyeye eklenir ve modal ekranda belirir.

---

## Faz 3 — Ekonomi ve Market (Economy)
**Hedef:** LogCoin harcanabilir, envanter Supabase'e kaydedilir, pixel masa güncellenir.

### Görevler
- [ ] `POST /api/market` — satın alma endpoint'i (bakiye kontrolü + RLS)
- [ ] `MarketGrid` + `MarketItem` — kategori bazlı listeleme, satın alma butonu
- [ ] `InventoryPanel` — sahip olunan eşyaların gösterimi
- [ ] `PixelDesk` — envantere göre masa objelerinin aktif/pasif hale gelmesi
- [ ] `applyUpgradeBonus` — claim sırasında sahip olunan upgrade'ler log time'a eklenir
- [ ] Market sayfası (`/market`) — bakiye + grid tam çalışır hale getirilir
- [ ] Zustand store'ları (`usePlayerStore`, `useInventoryStore`) sunucu verisinden beslenir
- [ ] Satın alma sonrası masa anlık güncellenir (client-side optimistic update)

**Bitiş Kriteri:** Kullanıcı LogCoin kazanıp market'ten eşya alabilir, masa görsel olarak değişir.

---

## Faz 4 — Sosyal & Rekabetçi Elementler (Social)
**Hedef:** Liderlik tablosu canlı, unvanlar sistemi eklenmiş.

### Görevler
- [ ] Leaderboard sayfası (`/leaderboard`) — haftalık / tüm zamanlar sekmeleri
- [ ] Supabase Realtime ile liderlik tablosunu canlı güncelle (subscribe to `users`)
- [ ] Unvan sistemi — `titles` tablosu oluştur, koşulları tanımla:
  - "Cluster'ın Elden Lord'u" → 7 günlük seri tamamlama
  - "LogTime Büyücüsü" → toplam 1000 LC kazanma
  - "Grind Makinesi" → toplam 50 saat log time
- [ ] Kullanıcı profilinde aktif unvan gösterimi
- [ ] Dashboard'da "Top 3 bu hafta" mini widget

**Bitiş Kriteri:** Liderlik tablosu canlı çalışır, unvanlar kazanılır ve profilde görünür.

---

## Faz 5 — Görsel Cilalanma & Pixel Art (Polish)
**Hedef:** 8-bit ruhu tam oturmuş, pixel-art sprite'lar entegre, animasyonlar tamamdır.

### Görevler
- [ ] Pixel-art masa sprite'larını `public/sprites/` altına ekle (Aseprite önerilir)
  - `chair.png`, `keyboard.png`, `monitor.png`, `cat.gif`, `cup.png`, `frieren.png`
- [ ] `PixelDesk` bileşenini placeholder div'ler yerine gerçek sprite'larla yeniden yaz
- [ ] Framer Motion: item satın alındığında masa'ya "pop-in" animasyonu
- [ ] Framer Motion: LogCoin artışında "sayaç yukarı kayma" efekti
- [ ] NES.css diyalog kutusunda "daktilo yazı" efekti (typewriter)
- [ ] Tema sistemi — kullanıcı farklı renk paletleri seçebilir (CSS variable swap)
- [ ] Mobil responsive düzenleme — grid tek sütuna düşer, nav hamburger menüye geçer
- [ ] `robots.txt`, `og:image`, favicon (pixel logo) ayarla
- [ ] Lighthouse performans denetimi (hedef ≥ 90)

**Bitiş Kriteri:** Tasarım GDD vizyonuyla örtüşür, oyun mobilde de akıcı çalışır.

---

## Faz 6 — Deployment & Üretim Hazırlığı
**Hedef:** Oyun kampüs öğrencilerine erişilebilir.

### Görevler
- [ ] Vercel veya Coolify (Docker) deployment yapılandırması
- [ ] Production env var'larını ayarla
- [ ] Supabase RLS politikalarını production için gözden geçir
- [ ] 42 API rate limit yönetimi (token cache + retry)
- [ ] Hata izleme — Sentry veya basit bir log tablosu
- [ ] Beta test — kampüsten 5-10 öğrenci ile açık test

---

## Teknik Borç & Notlar
- `claimed_today` sıfırlaması sunucu saatine bağlıdır; 42 kampüsü Istanbul TZ'dadır.
- 42 API `locations_stats` endpoint'i bazen boş dönebilir; `fetchYesterdayLogtime` 0 döner.
- Market satın almalarında `inventory` tablosunda RLS `INSERT` policy henüz eklenmedi — Faz 3'te tamamlanacak.
