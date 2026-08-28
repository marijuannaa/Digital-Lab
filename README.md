# 🧪 Dijital Laboratuvar (Digital-Lab)

**Dijital Laboratuvar**, spektroskopi ve laboratuvar verilerini tarayıcı üzerinde hızlı, güvenli ve yayın kalitesinde işlemek için tasarlanmış modern, modüler ve açık kaynaklı bir bilimsel analiz platformudur.

Tüm işlemler **%100 istemci tarafında (tarayıcınızda)** gerçekleşir; hiçbir veri sunucuya yüklenmez.

---

## 🚀 Dahili Modüller ve Yetenekler

### 1. 🔬 FTIR Spektrum Maker & Analizörü
- **Geniş Format Desteği:** CSV, TXT ve DAT formatlarındaki spektral verileri okuma.
- **Spektral Dönüşümler:**
  - Transmitans (%T) $\longleftrightarrow$ Absorbans ($A$) çift yönlü dönüşümü ($A = 2 - \log_{10}(\%T)$).
  - Min-Max Normalizasyonu (0 – 1 skalası).
  - Ağırlıklı Hareketli Ortalama (Triangular Weighted) ile Gürültü Azaltma / Spektral Yumuşatma.
  - Şelale (Waterfall) / Yığılma ofseti ile çoklu spektrumları üst üste net biçimde kıyaslama.
- **Otomatik Pik & Fonksiyonel Grup Tespiti:**
  - Ayarlanabilir hassasiyet ile pik tepe ve çukurlarını otomatik etiketleme.
  - O-H, N-H, C-H, C=O (karbonil), C≡C, C=C, C-O ve parmak izi bölgelerini otomatik analiz eden kimyasal fonksiyonel grup motoru.
- **Yüksek Çözünürlüklü Dışa Aktarma:** PNG (yüksek DPI), SVG ve JPEG grafik indirme; pik tablosunu CSV olarak kaydetme.

---

### 2. ☀️ UV-Vis Spektrum Maker & λmax Analizörü
- **Akıllı Sütun Tespiti:**
  - Hem tek dalga boylu (`X, Y1, Y2...`) hem de çoklu çiftli (`X1, Y1, X2, Y2...`) CSV yapılarını otomatik tanıma.
- **$\lambda_{\max}$ Tespiti & Spektral Bölge Sınıflandırması:**
  - Maksimum ve minimum absorbans dalga boylarını ($\lambda_{\max}$) tespit etme.
  - UV-C, UV-B, UV-A ve Görünür bölge (380–750 nm) renk spektrumunu tamamlayıcı renk paleti ile eşleştirme.
- **Spektrum Yönetimi:** Renk paleti seçimi, tekil/toplu görünürlük kontrolü ve yüksek kaliteli grafik çıktısı.

---

### 3. 🔄 Çoklu CSV Karakter & Ayırıcı Dönüştürücü
- **Türkçe/Avrupa Cihaz Formatı Dönüşümü:**
  - Noktalı virgül (`;`) ayırıcılarını virgüle (`,`),
  - Ondalık virgül (`,`) karakterlerini noktaya (`.`) dönüştürür.
- **Canlı Karşılaştırmalı Önizleme:** Dosyayı indirmeden önce "Orijinal vs Dönüştürülmüş" satırlarını yan yana inceleme.
- **⚡ Doğrudan Laboratuvara Aktar (Pipeline):** Dönüştürülen dosyayı kaydetmeden tek tıkla **FTIR** veya **UV-Vis** analizörüne aktarma.
- **Toplu İndirme:** Dosyaları tek tek veya tek bir **.ZIP** arşivi olarak indirme.

---

### 4. 📊 CSV ➔ Excel (.xlsx) Dönüştürücü
- Laboratuvar CSV/TXT dosyalarını biçimlendirilmiş gerçek Excel dosyalarına çevirme (SheetJS).
- Çoklu dosyaları tek bir Excel çalışma kitabında **farklı sekmeler (sheets)** olarak birleştirme veya toplu ZIP indirme.

---

### 5. 🧮 Bilimsel Hesaplayıcılar & Referans Kütüphanesi
- **Beer-Lambert Kanunu Hesaplayıcısı ($A = \varepsilon \cdot b \cdot c$):** Absorbans, Konsantrasyon, Molar Absorptivite veya Küvet Işık Yolu hesaplama.
- **Doğrusal Regresyon & Kalibrasyon Eğrisi Analizi:** Standart veri setlerinden eğim, kesim noktası ve $R^2$ korelasyonunu hesaplama, bilinmeyen numune konsantrasyonunu bulma ve interaktif regresyon grafiği.
- **Spektroskopi Birim Dönüştürücüsü:** Dalga boyu ($\text{nm}$) $\longleftrightarrow$ Dalga sayısı ($\text{cm}^{-1}$) $\longleftrightarrow$ Frekans ($\text{THz}$) $\longleftrightarrow$ Foton Enerjisi ($\text{eV}$) $\longleftrightarrow$ Molar Enerji ($\text{kJ/mol}$).
- **İnteraktif IR Titreşim Korelasyon Tablosu:** Sık karşılaşılan tüm organik kimyasal bağların dalga sayıları ve bant özellikleri aranabilir veritabanı.

---

## 🛠️ Teknoloji Yığını

- **Çekirdek:** Modern HTML5 & Vanilla JavaScript (Modüler Mimari)
- **Stil & Arayüz:** Tailwind CSS + Glassmorphism Özel CSS Tasarım Sistemi
- **Grafik Motoru:** [Plotly.js](https://plot.ly/javascript/) (Bilimsel interaktif grafikler)
- **Veri Ayrıştırma:** [PapaParse](https://www.papaparse.com/)
- **Elektronik Tablo Motoru:** [SheetJS (xlsx)](https://sheetjs.com/)
- **Arşivleme:** [JSZip](https://stuk.github.io/jszip/)
- **İkonlar:** [Lucide Icons](https://lucide.dev/)

---

## 💻 Yerel Olarak Çalıştırma

Projeyi yerel ortamınızda çalıştırmak için herhangi bir kurulum veya bağımlılık yüklemesi gerekmez. `index.html` dosyasını tarayıcınızda açmanız veya bir yerel sunucu başlatmanız yeterlidir:

```bash
# Python ile yerel sunucu başlatmak için:
python -m http.server 3000

# Veya npx serve ile:
npx serve .
```

Tarayıcınızda `http://localhost:3000` adresine gidin.

---

## 📄 Lisans & Geliştirici

Geliştirici: [@marijuannaa](https://github.com/marijuannaa)  
Açık kaynaklı ve bilimsel araştırmalara ücretsizdir.