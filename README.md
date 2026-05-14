# LaunchCanvas

LaunchCanvas, App Store ve Google Play için mağaza görsellerini daha hızlı ve daha tutarlı hazırlamak için geliştirilmiş bir ekran görüntüsü üretim aracıdır. Uygulama; cihaz çerçevesi, metin katmanları, obje katmanları ve arkaplan düzenini tek bir sahne üstünde yönetir.

## Neler Yapabilir?

- Tekli ekran görüntüsü düzenleme
- Toplu kart üretimi ve çoklu görsel yükleme
- Metin katmanları ekleme, silme ve stillerini değiştirme
- Obje katmanları ekleme, görsel yükleme ve katman sırası yönetme
- Arkaplan görseli ekleme ve konumlandırma
- Cihaz çerçevesi, kamera kesiti ve görünüm ayarlarını düzenleme
- PNG dışa aktarma
- Toplu modda ZIP arşivi veya ayrı dosya indirme

## Öne Çıkan Özellikler

### Doğrudan önizleme üstünde sürükleme

Önizleme alanında aşağıdaki katmanlar doğrudan fare/pointer ile taşınabilir:

- Obje katmanları
- Metin katmanları
- Telefon görseli ve çerçevesi

Sürükleme sadece görsel bir efekt değildir; ilgili `x / y`, `frameTop` ve `frameOffsetX` değerleri gerçekten state içine yazılır. Böylece slider kontrolleri ile önizleme etkileşimi aynı veri üzerinde senkron çalışır.

### Tekli düzenleme

Ana editörde:

- cihaz seçebilir,
- ekran görüntüsü yükleyebilir,
- hazır stil uygulayabilir,
- metin katmanlarını düzenleyebilir,
- obje katmanları ekleyebilir,
- arkaplan ve çerçeve ayarlarını değiştirebilir,
- sonucu anında önizleyebilirsiniz.

### Toplu düzenleme

Toplu mod, aynı sahne yapısını çok sayıda karta uygulamak için kullanılır.

- Tekli moddaki sahne toplu moda taşınır.
- Birden fazla görsel aynı anda içe aktarılabilir.
- Kart editörleri varsayılan olarak kapalı gelir.
- İstenirse kart bazında veya topluca editörler açılıp kapatılabilir.
- Her kartın önizlemesinde obje, metin ve telefon görseli ayrı ayrı sürüklenebilir.
- Çıktılar ZIP arşivi ya da ayrı PNG dosyaları olarak alınabilir.

## Teknolojiler

- Next.js 15
- React 19
- TypeScript
- Tailwind CSS
- JSZip
- File Saver
- WebFontLoader

## Gereksinimler

- Node.js
- npm

Güncel bir Node.js LTS sürümü önerilir.

## Kurulum

```bash
npm install
```

## Geliştirme

Geliştirme sunucusunu başlatmak için:

```bash
npm run dev
```

Uygulama varsayılan olarak yerelde çalışır ve arayüz üzerinden doğrudan test edilebilir.

## Build

Projeyi derlemek için:

```bash
npm run build
```

## Production Önizleme

Build sonrası uygulamayı yerelde önizlemek için:

```bash
npm run start
```

Statik çıktı klasörünü ayrıca bir sunucu ile açmak isterseniz:

```bash
npx serve out
```

veya

```bash
python -m http.server 3000 --directory out
```

## Proje Yapısı

### `app/`

- ana sayfa
- toplu yükleme sayfası
- layout ve genel uygulama kabuğu

### `components/`

- ekran görüntüsü oluşturucu
- tekli düzenleme paneli
- toplu kart düzenleme paneli
- metin katman editörü
- obje katman editörü
- arkaplan editörü
- font seçici
- görsel yükleme alanı

### `lib/`

- sahne durumu ve query serileştirme mantığı
- cihaz katalogları
- yükleme doğrulama yardımcıları
- görsel stil tanımları
- font yükleme yardımcıları

## Kullanım Akışı

### Tekli mod

1. Cihaz seçin.
2. Ekran görüntüsü yükleyin.
3. Gerekirse arkaplan görseli ekleyin.
4. Metin katmanlarını ve obje katmanlarını düzenleyin.
5. Önizleme üzerinde sürükleyerek ince ayar yapın.
6. PNG çıktısını indirin veya toplu moda geçin.

### Toplu mod

1. Tekli moddan sahneyi toplu moda taşıyın.
2. Çoklu görsel yükleyin veya manuel kart ekleyin.
3. Gerekli kart editörlerini açın.
4. Kart bazında metin, obje, arkaplan ve çerçeve ayarlarını düzenleyin.
5. Önizlemelerde sürükleyerek son konumları ayarlayın.
6. ZIP veya ayrı PNG dosyaları olarak dışa aktarın.

## Notlar

- Proje ek bir API anahtarı gerektirmez.
- Önizleme sahnesi URL query parametrelerine serileştirilir.
- Geçici görseller tarayıcı `sessionStorage` içinde tutulur.
- `dev-stderr.log` ve `dev-stdout.log` git ignore içindedir.

## Kaynak

Bu proje, `/Yesno-Labs/app-store-screenshot-generator` çalışmasından esinlenerek geliştirilmiştir.
