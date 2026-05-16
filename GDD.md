🎮 Oyun Tasarım Dökümanı (GDD) - Tam Sürüm (8-Bit Retro Edition)
Oyunun Adı (Geçici): 42 Tycoon: The LogTime Grind
Tür: 8-Bit Web Tabanlı Tycoon / Idle Puan Toplama
Platform: Responsive Web Uygulaması (Masaüstü ve Mobil)
Ana Hedef Kitle: 42 İstanbul Kampüsü Öğrencileri

1. Oyunun Özeti (Game Pitch)
   "Gerçek hayatta kampüste ne kadar ter dökersen, sanal cluster'ın o kadar parlar."
   42 Tycoon, öğrencilerin kampüste geçirdikleri gerçek süreyi (log time) oyun içi devasa bir ekonomiye dönüştürerek, devamlılığı ve kampüs aktifliğini artırmayı hedefleyen 8-bit retro temalı rekabetçi bir oyundur. Oyuncular bilgisayar başında kaldıkça puan kazanır, bu puanlarla arayüzdeki pixel-art sanal masalarını geliştirir ve kampüsün en iyisi olmak için yarışırlar.
2. Temel Oynanış Döngüsü (Core Gameplay Loop)
   Oyun, kullanıcının gerçek hayattaki eforunu sanal bir ödül sistemine bağlar. Oynanış, günlük "Claim" (Talep) mekaniği etrafında döner:

Gerçek Hayat Eforu: Oyuncu gün içinde 42 kampüsüne gelir ve bilgisayar başında zaman geçirir (Log time biriktirir).
Sisteme Giriş: Ertesi gün retro web arayüzüne giriş yapar.
Daily Claim (Günlük Toplama): Sistem, arka planda 42 API'ından dünkü log time verisini çeker.
Çarpan Uygulaması: Oyuncunun mevcut "Kampüse Gelme Serisi"ne (Streak) göre dünkü taban puanı katlanır ve bakiyeye (LogCoin) eklenir.
Harcama ve İlerleme: Kazanılan bu LogCoin'ler ile marketten sanal cluster geliştirmeleri, seriyi koruyan taktiksel eşyalar veya pixel kozmetikler satın alınır. 3. Seri ve Çarpan Mekaniği (The Streak System)
Kampüs devamlılığını sağlamak adına ardışık günlerde kampüse gelmek oyunun en güçlü silahıdır. Seri her Pazartesi günü sıfırlanır (Weekly Reset). Oyuncu kampüse gelmediği an seri bozulur ve 1.0x tabanına düşer.

Pazartesi: 1.0x (Hafta Başlangıcı)
Salı: 1.3x (Seriye bağlanma teşviki)
Çarşamba: 1.4x
Perşembe: 1.5x
Cuma: 1.6x
Cumartesi: 1.7x
Pazar: 1.8x + 0.2x (Hafta Sonu Boss Ödülü) = 2.0x Maksimum Çarpan 4. Ekonomi ve Market (Resource Management)
Oyuncular seriden kazandıkları yüksek çarpanlı LogCoin'leri, Supabase inventory tablosuyla senkronize çalışan 3 ana market kategorisinde harcarlar:

A. Taban Puan Geliştirmeleri (Core Upgrades)
Sistemin çarptığı ana taban log time puanını kalıcı olarak artıran donanımlar.

Ergonomik Koltuk (Pixel): Saatlik taban kazancı %10 artırır.
Mekanik Klavye (Pixel): Saatlik taban kazancı %15 artırır.
Çift Monitör Kurulumu (Pixel): Saatlik taban kazancı %20 artırır.
B. Taktiksel Eşyalar (Consumables)
Oyunun acımasız ceza sistemini taktiksel olarak önleyen pahalı ve tek kullanımlık eşyalar.

Bocal İzni (Grace Period): Yüksek miktarda LogCoin karşılığı alınır. (Envanterde retro bir parşömen kağıdı olarak görünür). Kampüse gelinemeyen bir gün için serinin bozulmasını engeller, veritabanında current_streak değerini bir günlüğüne dondurur.
C. Kozmetik ve Prestij (Cosmetics & Flex)
Sanal masayı kişiselleştiren, arayüzde diğer oyunculara hava atmayı sağlayan prestij objeleri.

Masa Üstü Figürleri: 8-bit formatında çizilmiş Frieren ciltleri, hareketli bir Bambu Lab minyatürü veya klavyenin yanında uyuyan pixel bir kedi figürü.
Temalar: Arayüzün renk paletini değiştiren, Loba Coffee bardağı gibi ortam hissini artıran 8-bit detaylar. 5. Sosyal ve Rekabetçi Elementler (Social Features)
Topluluk hissini güçlendirmek ve "grind" motivasyonunu artırmak için:

Canlı Liderlik Tablosu (Leaderboard): Haftalık en çok LogCoin kazananların ve tüm zamanların en zenginlerinin sıralandığı, eski atari salonlarındaki "High Score" ekranlarını andıran tablo.
Özel Unvanlar (Titles): Belirli hedeflere ulaşanlara verilen retro rozetler (Örn: "Cluster'ın Elden Lord'u", "LogTime Büyücüsü"). 6. Teknik Mimari ve Altyapı (Tech Stack)
Frontend (İstemci Tarafı - UI & Logic)
Ana Kütüphane: React (Bileşen tabanlı UI inşası için).
Görsel Tema ve Stil (Hibrit Yapı):
NES.css: Oyunun 8-bit retro ruhunu yansıtmak için kullanılacak ana UI framework'ü. Butonlar, diyalog kutuları (dialog/modals), progress bar'lar, avatar çerçeveleri ve retro tipografi (pixel fontlar) tamamen NES.css üzerinden sağlanacak.
Tailwind CSS: NES.css'in yetersiz kaldığı modern web mizanpajında (grid, flexbox yapıları, responsive ekran tasarımları, boşluklar/margin/padding ve hizalamalar) iskeleti oluşturmak için kullanılacak.
Durum Yönetimi (State): Zustand (Bakiye, mevcut çarpan, aktif envanter gibi verilerin performanslı yönetimi).
Animasyonlar: Framer Motion (8-bit pop-up'ların ekrana sıçrayarak gelmesi, bakiye artış efektleri için).
Backend ve Veritabanı
BaaS: Supabase (Gerçek zamanlı veritabanı, PostgreSQL altyapısı ve Auth çözümleri).
Yetkilendirme: Supabase Auth (Öğrencilerin giriş yapabilmesi ve intra hesaplarıyla eşleşmesi için).
Veri Yönetimi:
users tablosu (bakiye, intra adı, güncel seri, kalıcı çarpanlar).
inventory tablosu (satın alınan market eşyalarının user_id eşleşmesi).
42 API ve Veri Akışı Stratejisi
Hesaplamalar, güvenli bir sunucu/Edge function ortamında (örn: Next.js API Routes) yapılarak Supabase veritabanına yazılacak ve React arayüzüne sadece işlenmiş son veriler yansıtılacaktır.
Yayınlama (Deployment): Vercel veya ARM/VPS sunucularda Coolify aracılığıyla container (Docker) yapısında ayağa kaldırılabilir. 7. UI / UX Vizyonu (Görsel Tasarım - 8-Bit Deneyimi)
Retro Dashboard (Ana Ekran): Modern ve düz tasarımlar yerine, eski JRPG oyunlarını andıran bir ekran. Merkezde pixel art formatında çizilmiş bir bilgisayar masası yer alacak. Tailwind'in grid yapısı sayesinde sağda ve solda NES.css ile şekillendirilmiş retro paneller bulunacak.
Heyecan Verici Modal Ekranları: "Daily Claim" mekaniği tetiklendiğinde klasik, kalın siyah kenarlıklı bir NES.css diyalog kutusu (eski Pokemon veya Final Fantasy oyunlarındaki gibi) ekranda belirecek. Metinler pixel font ile daktilo efektiyle yazılacak: "Dün kampüste 6 saat geçirdin... x1.5 çarpan eklendi... 900 LogCoin kazandın!"
Görsel Geri Bildirim: Oyuncu marketten bir eşya (örn: klavye) aldığında, NES butonuna basma hissiyatıyla birlikte masaüstündeki pixel-art çizim anında güncellenecek.
