# LaunchCanvas

LaunchCanvas, App Store ve Google Play için uygulama ekran görüntülerini daha düzenli, daha hızlı ve daha tutarlı şekilde hazırlamayı amaçlayan bir görsel üretim aracıdır. Projenin ana hedefi, farklı cihaz boyutlarına uygun tanıtım görselleri üretirken metin yerleşimini, çerçeve oranlarını ve görsel düzeni tek bir akış içinde yönetilebilir hâle getirmektir.

## Ne İşe Yarar?

Bu proje özellikle mağaza görselleri hazırlarken tekrar eden işleri azaltmak için geliştirilmiştir. Tek tek ekran görüntüsü düzenlemek yerine, aynı görsel sistemi koruyarak daha kontrollü bir üretim süreci sunar.

LaunchCanvas ile:

- farklı cihaz profilleri arasında geçiş yapabilirsiniz,
- ekran görüntüsü yükleyebilirsiniz,
- başlık ve ek metin katmanları ekleyebilirsiniz,
- yazı tipi, renk, boyut ve hizalama ayarlarını düzenleyebilirsiniz,
- tekli çıktı alabilirsiniz,
- toplu mod ile birden fazla görseli aynı yapı üzerinden hazırlayabilirsiniz.

## Temel Özellikler

- Tekli ekran görüntüsü düzenleme
- Toplu ekran görüntüsü hazırlama
- Çoklu metin katmanı desteği
- Farklı cihaz boyutları için ön tanımlı profiller
- Yazı tipi seçimi ve canlı önizleme
- Arka plan, çerçeve ve metin ayarlarını birlikte yönetme
- Statik çıktı üretmeye uygun yapı

## Kullanılan Teknolojiler

Proje aşağıdaki teknolojilerle geliştirilmiştir:

- Next.js 15
- React 19
- TypeScript
- Tailwind CSS
- JSZip
- File Saver
- WebFontLoader

## Gereksinimler

Projeyi yerelde çalıştırmak veya derlemek için şunlara ihtiyacınız vardır:

- Node.js
- npm

Güncel bir Node.js LTS sürümü kullanmanız tavsiye edilir.

## Kurulum

Projeyi kurmak için:

```bash
npm install
```

Kurulum tamamlandıktan sonra doğrudan geliştirme moduna geçebilir veya build alabilirsiniz.

## Geliştirme Modunda Çalıştırma

Yerelde geliştirme sunucusunu başlatmak için:

```bash
npm run dev
```

Bu komut uygulamayı geliştirme modunda ayağa kaldırır. Ardından tarayıcı üzerinden arayüzü açıp düzenleme akışını test edebilirsiniz.

## Build Alma

Projede statik çıktı üretimi kullanılır. Bu nedenle build süreci sonunda dağıtıma hazır statik dosyalar oluşturulur.

Build almak için:

```bash
npm run build
```

Bu işlem sırasında:

- uygulama derlenir,
- tip kontrolleri yapılır,
- sayfalar statik olarak üretilir,
- sonuç `out/` klasörüne yazılır.

## Build Sonrası Önizleme

Bu proje statik çıktı ürettiği için build sonrasında `out/` klasörünü bir statik dosya sunucusuyla açmanız gerekir.

Örneğin:

```bash
npx serve out
```

veya

```bash
python -m http.server 3000 --directory out
```

Bu şekilde build sonrası oluşan dosyaları gerçek yayın ortamına daha yakın bir şekilde test edebilirsiniz.

## Uygulama İçindeki Akış

### Tekli düzenleme

Ana editörde tipik kullanım akışı şöyledir:

1. Cihaz seçilir.
2. Görsel yüklenir.
3. Başlık ve diğer metin katmanları düzenlenir.
4. Yazı tipi ve görünüm ayarları yapılır.
5. Önizleme kontrol edilir.
6. Çıktı alınır.

### Toplu düzenleme

Toplu mod, aynı temel yapı üzerinden birden fazla mağaza görseli üretmek için kullanılır. Özellikle aynı uygulamanın farklı ekranlarını tek seferde hazırlamak isteyenler için faydalıdır.

Tipik toplu kullanım akışı:

1. Temel sahne hazırlanır.
2. Toplu düzenleme ekranına geçilir.
3. Birden fazla görsel içe alınır veya kart eklenir.
4. Her kart için içerik ayrı ayrı düzenlenir.
5. Önizlemeler kontrol edilir.
6. Toplu çıktı alınır.

## Proje Yapısı

### `app/`

Sayfa yapısı ve uygulama kabuğu burada bulunur.

- ana düzenleme ekranı
- toplu düzenleme sayfası
- layout ve genel stil bağlantıları

### `components/`

Arayüz bileşenleri burada yer alır.

- ekran görüntüsü oluşturucu
- toplu kart düzenleyici
- yazı tipi seçici
- görsel yükleme alanı
- metin katmanı düzenleyici

### `lib/`

Uygulamanın iş mantığı burada bulunur.

- cihaz katalogları
- render ve sahne durumu
- yükleme doğrulama mantığı
- marka ve görünüm tanımları
- font yardımcıları

## Notlar

- Proje şu an ek bir API anahtarı gerektirmeden çalışacak şekilde düzenlenmiştir.
- Gereksiz ikon ve görsel dosyaları temizlenmiştir.
- Build sonrası kullanılacak ana çıktı klasörü `out/` dizinidir.
- Statik çıktı yapısı nedeniyle dağıtım için statik hosting yaklaşımı uygundur.

## Özet

LaunchCanvas, mağaza ekran görüntüsü hazırlama sürecini tekli ve toplu üretim akışlarıyla kolaylaştıran, cihaz profillerine dayalı çalışan ve statik çıktı üreten bir Next.js projesidir. Amaç, uygulama tanıtım görsellerini daha az tekrar eden iş yüküyle ve daha tutarlı bir görsel sistemle hazırlamaktır.

thx for /Yesno-Labs/app-store-screenshot-generator
