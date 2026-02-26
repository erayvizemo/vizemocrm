export interface ServiceOption {
  label: string;
  value: string;
  score: number;
  cssClass?: 'boost' | 'disqualify';
}

export interface ServiceAlert {
  type: 'red' | 'green' | 'yellow' | 'blue';
  text: string;
}

export interface SubField {
  id: string;
  label: string;
  placeholder?: string;
}

export interface ServiceQuestion {
  id: string;
  text: string;
  script: string;
  type: 'options' | 'textarea';
  hasNote?: boolean;
  required: boolean;
  options?: ServiceOption[];
  alerts?: Record<string, ServiceAlert>;
  placeholder?: string;
  subFields?: {
    showOnValues: string[];
    fields: SubField[];
  };
}

export interface ServiceStep {
  id: string;
  label: string;
  title: string;
  hint: string;
  questions: ServiceQuestion[];
}

export interface LeodessaService {
  name: string;
  icon: string;
  steps: ServiceStep[];
}

export type ServiceKey = 'schengen' | 'ispanya' | 'ingiltere' | 'amerika';

export const IKAMET: ServiceOption[] = [
  { label: '🏙️ İstanbul', value: 'istanbul', score: 5 },
  { label: '🏙️ Ankara', value: 'ankara', score: 5 },
  { label: '🌇 Eskişehir', value: 'eskisehir', score: 5 },
  { label: '🌊 İzmir', value: 'izmir', score: 4 },
  { label: '🌴 Antalya', value: 'antalya', score: 4 },
  { label: '🏙️ Bursa', value: 'bursa', score: 4 },
  { label: '🏙️ Adana', value: 'adana', score: 3 },
  { label: '🏙️ Konya', value: 'konya', score: 3 },
  { label: '🌇 Diğer Büyükşehir', value: 'diger_buyuk', score: 3 },
  { label: '🏘️ Küçük Şehir', value: 'diger', score: 2 },
];

export const ULKELER: ServiceOption[] = [
  { label: '🇩🇪 Almanya', value: 'almanya', score: 5 },
  { label: '🇫🇷 Fransa', value: 'fransa', score: 5 },
  { label: '🇮🇹 İtalya', value: 'italya', score: 5 },
  { label: '🇪🇸 İspanya', value: 'ispanya_ulke', score: 5 },
  { label: '🇬🇷 Yunanistan', value: 'yunanistan', score: 7 },
  { label: '🇧🇪 Belçika', value: 'belcika', score: 6 },
  { label: '🇦🇹 Avusturya', value: 'avusturya', score: 6 },
  { label: '🇨🇭 İsviçre', value: 'isvicre', score: 5 },
  { label: '🇳🇱 Hollanda', value: 'hollanda', score: 5 },
  { label: '🇵🇹 Portekiz', value: 'portekiz', score: 5 },
  { label: '🇸🇪 İsveç', value: 'isvec', score: 5 },
  { label: '🇳🇴 Norveç', value: 'norvec', score: 5 },
  { label: '🇩🇰 Danimarka', value: 'danimarka', score: 5 },
  { label: '🇫🇮 Finlandiya', value: 'finlandiya', score: 5 },
  { label: '🇵🇱 Polonya', value: 'polonya', score: 5 },
  { label: '🇨🇿 Çekya', value: 'cekya', score: 5 },
  { label: '🇸🇰 Slovakya', value: 'slovakya', score: 5 },
  { label: '🇸🇮 Slovenya', value: 'slovenya', score: 5 },
  { label: '🇭🇺 Macaristan', value: 'macaristan', score: 5 },
  { label: '🇷🇴 Romanya', value: 'romanya', score: 5 },
  { label: '🇧🇬 Bulgaristan', value: 'bulgaristan', score: 5 },
  { label: '🇭🇷 Hırvatistan', value: 'hirvatistan', score: 5 },
  { label: '🇱🇺 Lüksemburg', value: 'luksemburg', score: 5 },
  { label: '🇲🇹 Malta', value: 'malta', score: 5 },
  { label: '🇱🇹 Litvanya', value: 'litvanya', score: 5 },
  { label: '🇱🇻 Letonya', value: 'letonya', score: 5 },
  { label: '🇪🇪 Estonya', value: 'estonya', score: 5 },
  { label: '🇮🇸 İzlanda', value: 'izlanda', score: 5 },
  { label: '🇬🇧 İngiltere', value: 'ingiltere_ulke', score: 6 },
  { label: '🇺🇸 Amerika', value: 'amerika_ulke', score: 6 },
  { label: '🇦🇪 Dubai / BAE', value: 'dubai', score: 6 },
  { label: '🌍 Birden Fazla Ülke', value: 'cok_ulke', score: 8, cssClass: 'boost' },
  { label: '❓ Henüz Karar Vermedim', value: 'bilmiyorum', score: 2 },
];

export const services: Record<ServiceKey, LeodessaService> = {
  schengen: {
    name: 'Schengen Vizesi',
    icon: '🇪🇺',
    steps: [
      {
        id: 's1', label: 'Adım 1 — Vize Türü', title: 'Seyahat Amacı & Vize Türü',
        hint: "Lead'in seyahat amacını, kişi sayısını ve hedef ülkesini belirleyin",
        questions: [
          {
            id: 'amac', text: 'Seyahat amacınız nedir?',
            script: '"Merhaba, sizi Vizemo\'dan arıyoruz. Vizemo vize danışmanlığı olarak Schengen vize sürecinizde size yardımcı olmak istiyoruz. Öncelikle, Avrupa\'ya seyahat amacınız nedir?"',
            type: 'options', hasNote: true, required: true,
            options: [
              { label: '🏖️ Turistik / Tatil', value: 'turizm', score: 8 },
              { label: '💼 İş / Toplantı', value: 'is', score: 9 },
              { label: '🎪 Fuar / Kongre', value: 'fuar', score: 9 },
              { label: '👨‍👩‍👧 Aile Ziyareti', value: 'aile', score: 7 },
              { label: '🎓 Eğitim / Dil Okulu', value: 'egitim', score: 7 },
              { label: '🏥 Sağlık / Tedavi', value: 'saglik', score: 8 },
              { label: '⚽ Spor / Etkinlik', value: 'spor', score: 8 },
              { label: '🔑 Aile Birleşimi', value: 'birlesim', score: 6 },
              { label: '🏢 İkili Anlaşma / Ticaret', value: 'ticaret', score: 9 },
              { label: '🤷 Henüz Karar Vermedim', value: 'karasiz', score: 3 },
            ],
          },
          {
            id: 'kac_kisi', text: 'Kaç kişi gidecek?',
            script: '"Tek başınıza mı seyahat edeceksiniz, yoksa beraberinizde kimse var mı?"',
            type: 'options', hasNote: true, required: true,
            options: [
              { label: '1 Kişi (Yalnız)', value: '1', score: 5 },
              { label: '2 Kişi (Çift)', value: '2', score: 7 },
              { label: '3-5 Kişi (Aile)', value: '3-5', score: 9 },
              { label: '6+ Kişi (Grup)', value: 'grup', score: 10 },
            ],
          },
          {
            id: 'ulke', text: 'Hangi ülkeye / ülkelere gidecek?',
            script: '"Öncelikli olarak hangi ülkeye gitmek istiyorsunuz?"',
            type: 'options', hasNote: true, required: false,
            options: ULKELER,
            alerts: {
              yunanistan: { type: 'green', text: '✅ Yunanistan: En hızlı randevu seçeneklerinden biri (3-7 gün). Müşteriye bu avantajı vurgulayın.' },
              ispanya_ulke: { type: 'blue', text: 'ℹ️ İspanya: BLS üzerinden işlem. Randevu 2-4 hafta sürebilir. Harç biraz daha yüksek ($126).' },
              ingiltere_ulke: { type: 'yellow', text: '⚠️ İngiltere Schengen dışıdır! Ayrı bir İngiltere vizesi gerekir. Müşteriyi bilgilendirin ve İngiltere servisine yönlendirin.' },
              amerika_ulke: { type: 'yellow', text: '⚠️ Amerika Schengen kapsamında değildir. Ayrı B1/B2 vizesi gerekir. Amerika servisine yönlendirin.' },
              dubai: { type: 'blue', text: 'ℹ️ Dubai için Schengen vizesi gerekmiyor. Müşteri gerçekten Schengen mi istiyor, kontrol edin.' },
            },
          },
        ],
      },
      {
        id: 's2', label: 'Adım 2 — Mesleki Durum', title: 'Mesleki & Mali Profil',
        hint: 'Vize değerlendirmesi için kritik — doğrudan red riskini belirler',
        questions: [
          {
            id: 'meslek', text: 'Mesleki durumunuz nedir?',
            script: '"Vize başvurunuzda en önemli faktörlerden biri iş ve mali durumunuz. Şu an ne yapıyorsunuz?"',
            type: 'options', hasNote: true, required: true,
            options: [
              { label: '👔 Ücretli Çalışan (Özel)', value: 'calisan_ozel', score: 9, cssClass: 'boost' },
              { label: '🏛️ Ücretli Çalışan (Kamu)', value: 'calisan_kamu', score: 10, cssClass: 'boost' },
              { label: '🏢 Kendi İşi Sahibi', value: 'esnaf', score: 8, cssClass: 'boost' },
              { label: '🎓 Öğrenci', value: 'ogrenci', score: 4 },
              { label: '🏠 Ev Hanımı / Emekli', value: 'emekli', score: 5 },
              { label: '💼 Serbest Meslek (Doktor, Avukat)', value: 'serbest', score: 9, cssClass: 'boost' },
              { label: '❌ İşsiz / Çalışmıyor', value: 'issiz', score: 0, cssClass: 'disqualify' },
            ],
            alerts: {
              issiz: { type: 'red', text: '⚠️ DİKKAT: İşsiz adayların vize red riski çok yüksektir. Finanse eden yakını var mı mutlaka sorun.' },
            },
          },
          {
            id: 'ikamet_sch', text: 'İkametgahı neresi? (Hangi şehirde yaşıyor?)',
            script: '"Şu an hangi şehirde ikamet ediyorsunuz?"',
            type: 'options', hasNote: true, required: true,
            options: IKAMET,
          },
        ],
      },
      {
        id: 's3', label: 'Adım 3 — Vize Geçmişi', title: 'Vize Geçmişi & Seyahat Deneyimi',
        hint: 'Önceki vize geçmişi başvuru başarısını doğrudan etkiler',
        questions: [
          {
            id: 'onceki_vize', text: 'Daha önce Schengen vizesi aldı mı?',
            script: '"Daha önce Avrupa\'ya gittiniz mi, Schengen vizesi aldınız mı?"',
            type: 'options', hasNote: true, required: true,
            options: [
              { label: '✅ Evet, son 2 yılda (aktif geçmiş)', value: 'var_yeni', score: 10, cssClass: 'boost' },
              { label: '✅ Evet, 2+ yıl önce', value: 'var_eski', score: 7 },
              { label: '🆕 Hayır, ilk başvuru', value: 'yok', score: 4 },
              { label: '🚫 Red aldı (önceki başvuruda)', value: 'red', score: -5, cssClass: 'disqualify' },
            ],
            alerts: {
              red: { type: 'yellow', text: '⚠️ Önceki vize reddi: Red gerekçesini öğrenin. Garanti Vize paketi sunabilirsiniz ama mutlaka yönlendirin.' },
              var_yeni: { type: 'green', text: '✅ Mükemmel! Aktif geçmişi olan müşteriler en kolay onaylanan profildir. Sıcak lead — hemen fiyat sunun.' },
            },
          },
          {
            id: 'red_gecmisi', text: 'Herhangi bir ülkeden vize reddi var mı?',
            script: '"Geçmişte herhangi bir ülkeden vize reddi aldınız mı?"',
            type: 'options', hasNote: true, required: false,
            options: [
              { label: 'Hayır, hiç red almadım', value: 'yok', score: 5, cssClass: 'boost' },
              { label: 'Evet, Schengen red var', value: 'schengen_red', score: -3, cssClass: 'disqualify' },
              { label: 'Evet, başka ülke red var', value: 'diger_red', score: -1 },
            ],
            alerts: {
              schengen_red: { type: 'yellow', text: '⚠️ Schengen red geçmişi: Red gerekçesini öğrenin. Kaç ay geçtiğini ve hangi ülkeden alındığını not alın.' },
              diger_red: { type: 'yellow', text: '⚠️ Farklı ülke red geçmişi: Hangi ülke ve ne kadar süre geçtiğini belirtin. Gerekçeyi satış ekibine aktarın.' },
            },
            subFields: {
              showOnValues: ['schengen_red', 'diger_red'],
              fields: [
                { id: 'red_kac_ay', label: 'Kaç ay geçmiş?', placeholder: 'Örn: 6 ay önce' },
                { id: 'red_ulke', label: 'Red aldığı ülke neresi?', placeholder: 'Örn: Almanya Konsolosluğu' },
              ],
            },
          },
          {
            id: 'davet_mektubu', text: 'Davet mektubunuz var mı?',
            script: '"Seyahatiniz için bir davet mektubu var mı? (İş toplantısı, aile ziyareti, fuar vb. için düzenlenmiş resmi davet.)"',
            type: 'options', hasNote: true, required: false,
            options: [
              { label: '✅ Evet, resmi kurumsal davet mektubum var', value: 'resmi', score: 8, cssClass: 'boost' },
              { label: '👨‍👩‍👧 Evet, aile / kişisel davet var', value: 'kisisel', score: 5 },
              { label: '❌ Hayır, davet mektubum yok', value: 'yok', score: 0 },
            ],
            alerts: {
              resmi: { type: 'green', text: '✅ Resmi davet mektubu başvuru dosyasını güçlü kılar. Mutlaka dosyaya ekleyin.' },
              kisisel: { type: 'blue', text: 'ℹ️ Kişisel davet: Noterce onaylı veya konsolosluk onaylı davet mektupları için müşteriyi yönlendirin.' },
            },
          },
        ],
      },
      {
        id: 's4', label: 'Adım 4 — Seyahat Planı', title: 'Seyahat Tarihleri & Rezervasyonlar',
        hint: 'Kesin tarih = satın alma niyeti yüksek demektir',
        questions: [
          {
            id: 'tarih', text: 'Seyahat tarihleri belli mi?',
            script: '"Ne zaman gitmeyi planlıyorsunuz? Giriş-çıkış tarihleriniz netleşti mi?"',
            type: 'options', hasNote: true, required: true,
            options: [
              { label: '🔥 Evet, 1 ay içinde kesin tarihim var', value: 'acil', score: 12, cssClass: 'boost' },
              { label: '📅 Evet, 1-3 ay içinde', value: 'kisa', score: 10, cssClass: 'boost' },
              { label: '📅 3-6 ay sonra', value: 'orta', score: 7 },
              { label: '🗓️ 6 ay+ / Henüz belirsiz', value: 'uzun', score: 3 },
            ],
            alerts: {
              acil: { type: 'yellow', text: '⚠️ ACİL BAŞVURU: 1 ay içinde seyahat! Yunanistan / Belçika / Avusturya gibi hızlı randevu veren ülkeler önerilebilir.' },
            },
          },
          {
            id: 'bilet_otel', text: 'Uçak bileti / otel rezervasyonu var mı?',
            script: '"Bilet veya konaklama rezervasyonunuz var mı? Bazı konsolosluklar ön rezervasyon ister."',
            type: 'options', hasNote: true, required: true,
            options: [
              { label: '✅ İkisi de var (bilet + otel)', value: 'hepsi', score: 10, cssClass: 'boost' },
              { label: '🎟️ Sadece bilet var', value: 'bilet', score: 7 },
              { label: '🏨 Sadece otel var', value: 'otel', score: 6 },
              { label: '📋 Henüz yok', value: 'yok', score: 3 },
            ],
            alerts: {
              hepsi: { type: 'green', text: '✅ Rezervasyonlar hazır — hazırlıklı müşteri. Hizmet satışına doğrudan geçebilirsiniz.' },
              yok: { type: 'blue', text: 'ℹ️ Rezervasyon yoksa süreci açıklayın: İade edilebilir / geri ödemeli rezervasyon seçeneği önerilebilir.' },
            },
          },
        ],
      },
      {
        id: 's5', label: 'Adım 5 — Karar & Notlar', title: 'Satın Alma Niyeti & Genel Notlar',
        hint: 'Son değerlendirme ve görüşme notu',
        questions: [
          {
            id: 'ne_zaman_sch', text: 'Ne zaman başlamak ister?',
            script: '"Harika, size yardımcı olmak isteriz! Süreci ne zaman başlatmak düşünüyorsunuz?"',
            type: 'options', hasNote: true, required: true,
            options: [
              { label: '🔥 Hemen / Bu hafta', value: 'hemen', score: 12, cssClass: 'boost' },
              { label: '📅 Bu ay içinde', value: 'ay', score: 9, cssClass: 'boost' },
              { label: '🕐 1-2 ay sonra', value: '2ay', score: 6 },
              { label: '❓ Henüz karar vermedim', value: 'karar_yok', score: 1 },
            ],
          },
          {
            id: 'not_sch', text: 'Genel Görüşme Notu',
            script: '"Görüşme sırasında öne çıkan önemli detayları buraya yazın."',
            type: 'textarea', required: false,
            placeholder: 'Müşterinin özel durumu, talepleri, dikkat edilmesi gerekenler, vs...',
          },
        ],
      },
    ],
  },

  ispanya: {
    name: 'İspanya Oturum Kartı',
    icon: '🏖️',
    steps: [
      {
        id: 'i1', label: 'Adım 1 — Amaç & İlgi', title: 'Oturum Kartı Amacı',
        hint: 'Müşterinin temel motivasyonunu anlayın — yanlış beklenti en büyük red sebebi',
        questions: [
          {
            id: 'oturum_amac', text: 'İspanya oturum kartı ile ne yapmak istiyor?',
            script: '"Merhaba, sizi Vizemo\'dan arıyoruz. İspanya oturum kartına neden ilgi duydunuz? Hedeflerinizi anlamamız, size doğru paketi sunabilmemiz için önemli."',
            type: 'options', hasNote: true, required: true,
            options: [
              { label: '💼 Kendi işini kurmak (Şirket)', value: 'sirket', score: 9, cssClass: 'boost' },
              { label: '🌐 Uzaktan çalışmak (Digital Nomad)', value: 'dijital', score: 9, cssClass: 'boost' },
              { label: '👨‍👩‍👧 Ailecek oturum / yaşamak', value: 'aile', score: 8 },
              { label: '🏘️ Pasif gelir / emekli oturumu (Non-Lucrative)', value: 'pasif', score: 8 },
              { label: '📈 Gayrimenkul yatırımı', value: 'gayrimenkul', score: 7 },
              { label: '❌ Avrupa\'da iş bulmak / işçi olarak çalışmak', value: 'is_aramak', score: -10, cssClass: 'disqualify' },
            ],
            alerts: {
              is_aramak: { type: 'red', text: '🚫 DİSKALİFİYE: İspanya oturum kartı, iş aramak için geçerli değildir. Bu müşteriye yardımcı olamayız — nazikçe bilgilendirin.' },
              dijital: { type: 'green', text: '✅ Digital Nomad vizesi 2023\'ten beri aktif. Vizemo\'nun en güçlü hizmetlerinden biri. Sıcak lead!' },
              sirket: { type: 'green', text: '✅ Şirket kurarak oturum — kapsamlı bir paket gerektirir. Satış ekibine hemen bağlayın.' },
            },
          },
          {
            id: 'kac_kisi_isp', text: 'Kaç kişi başvuracak?',
            script: '"Sadece siz mi başvuracaksınız, yoksa aile bireylerini de dahil etmek ister misiniz?"',
            type: 'options', hasNote: true, required: true,
            options: [
              { label: 'Sadece ben (1 kişi)', value: '1', score: 5 },
              { label: 'Ben + eş (2 kişi)', value: '2', score: 7 },
              { label: 'Aile (3-5 kişi)', value: '3_5', score: 10, cssClass: 'boost' },
              { label: '5+ kişi', value: '5_plus', score: 12, cssClass: 'boost' },
            ],
          },
        ],
      },
      {
        id: 'i2', label: 'Adım 2 — Mevcut Vize', title: 'Mevcut Schengen Durumu',
        hint: 'Aktif vizesi olanlar için ek Schengen alımı gerekmez — maliyet avantajı',
        questions: [
          {
            id: 'mevcut_vize', text: 'Mevcut geçerli Schengen vizesi var mı?',
            script: '"Şu an geçerli Schengen vizeniz var mı? Bu bilgi hizmet paketini doğru oluşturmada yardımcı olacak."',
            type: 'options', hasNote: true, required: true,
            options: [
              { label: '✅ Evet, geçerli vizem var', value: 'var', score: 7, cssClass: 'boost' },
              { label: '⏳ Yakın zamanda sona erdi (1 yıl içinde)', value: 'yakinda_bitti', score: 6 },
              { label: '❌ Hayır / Çok eskide aldım', value: 'yok', score: 3 },
            ],
            alerts: {
              var: { type: 'green', text: '✅ Mevcut vizesi var! Ek Schengen vizesi almak zorunda kalmayacak — önemli maliyet avantajı. Vurgulayın!' },
            },
          },
          {
            id: 'red_isp', text: 'Daha önce İspanya oturum kartı başvurusu yaptı mı?',
            script: '"Daha önce İspanya\'ya oturum başvurusu yaptınız mı?"',
            type: 'options', hasNote: true, required: false,
            options: [
              { label: 'Hayır, ilk başvurum olacak', value: 'ilk', score: 5 },
              { label: 'Evet, onaylandı / kısmen ilerledim', value: 'onay', score: 8 },
              { label: 'Evet, red aldım', value: 'red', score: -2, cssClass: 'disqualify' },
            ],
            alerts: {
              red: { type: 'yellow', text: '⚠️ Önceki red: Red gerekçesini mutlaka öğrenin. Evrak eksikliği mi, yeterli gelir yokluğu mu?' },
            },
          },
        ],
      },
      {
        id: 'i3', label: 'Adım 3 — Mesleki & Mali', title: 'İş & Finansal Profil',
        hint: 'İspanya oturum kartı için aylık asgari gelir şartı karşılanmalıdır (~2.400€/ay)',
        questions: [
          {
            id: 'meslek_isp', text: 'Mesleki durumu nedir?',
            script: '"İspanya oturum kartı için belirli gelir şartları var. Şu an ne iş yapıyorsunuz?"',
            type: 'options', hasNote: true, required: true,
            options: [
              { label: '💼 Şirket sahibi (Türkiye\'de)', value: 'sirket_sahibi', score: 10, cssClass: 'boost' },
              { label: '🌐 Uzaktan çalışan / Freelancer', value: 'freelancer', score: 10, cssClass: 'boost' },
              { label: '👔 Ücretli çalışan (uzaktan çalışabilir)', value: 'calisan_uzak', score: 8 },
              { label: '🏘️ Pasif geliri var (kira, temettü)', value: 'pasif_gelir', score: 9 },
              { label: '🎓 Öğrenci', value: 'ogrenci', score: 1, cssClass: 'disqualify' },
              { label: '❌ Geliri yok / İşsiz', value: 'issiz', score: -10, cssClass: 'disqualify' },
            ],
            alerts: {
              issiz: { type: 'red', text: '🚫 DİSKALİFİYE: Belgelenmiş düzenli gelir zorunludur. Geliri olmayan adaylar başvuru yapamaz.' },
              ogrenci: { type: 'red', text: '⚠️ Öğrenci olarak oturum kartı almak son derece güçtür.' },
              freelancer: { type: 'green', text: '✅ Freelancer / uzaktan çalışan profili Digital Nomad vizesi için idealdir! Güçlü lead.' },
            },
          },
          {
            id: 'gelir_isp', text: 'Aylık geliri ne kadar civarında?',
            script: '"İspanya\'nın oturum kartı için asgari gelir şartı yaklaşık 2.400€/ay\'dır. Aylık geliriniz bu rakama yakın mı?"',
            type: 'options', hasNote: true, required: true,
            options: [
              { label: '✅ 2.400€+ / ay', value: 'yeterli', score: 12, cssClass: 'boost' },
              { label: '⚠️ 1.500-2.400€ / ay', value: 'sinir', score: 4 },
              { label: '❌ 1.500€ altı', value: 'dusuk', score: -5, cssClass: 'disqualify' },
              { label: '💰 5.000€+ / ay', value: 'yuksek', score: 15, cssClass: 'boost' },
              { label: '❓ Bilmiyorum / Hesaplamadım', value: 'bilmiyorum', score: 2 },
            ],
            alerts: {
              dusuk: { type: 'red', text: '🚫 Gelir şartını karşılamıyor. Non-Lucrative için en az ~2.400€/ay gelir belgesi gerekir.' },
              sinir: { type: 'yellow', text: '⚠️ Sınırda profil. Destekleyici belgeler (birikim, gayrimenkul) varsa değerlendirilebilir.' },
            },
          },
        ],
      },
      {
        id: 'i4', label: 'Adım 4 — Hukuki Durum', title: 'Adli Sicil & İkametgah',
        hint: 'Sabıka kaydı olanlar kesinlikle başvuru yapamaz — bu soruyu atlamamayın',
        questions: [
          {
            id: 'sabika', text: 'Adli sicil kaydı (sabıkası) var mı?',
            script: '"Bu soruyu sormak zorundayız: İspanya oturum kartı için temiz bir adli sicil kaydı zorunludur. Herhangi bir sabıka kaydınız var mı?"',
            type: 'options', hasNote: true, required: true,
            options: [
              { label: '✅ Hayır, temiz sabıka', value: 'temiz', score: 10, cssClass: 'boost' },
              { label: '❌ Evet, sabıka kaydım var', value: 'sabika_var', score: -100, cssClass: 'disqualify' },
              { label: '❓ Emin değilim / Kontrol etmedim', value: 'emin_degil', score: 2 },
            ],
            alerts: {
              sabika_var: { type: 'red', text: '🚫 KESİN DİSKALİFİYE: Sabıka kaydı olan adaylara İspanya oturum kartında yardımcı olamayız. Nazikçe bilgilendirin ve kaydı kapatın.' },
              emin_degil: { type: 'yellow', text: '⚠️ e-devlet üzerinden adli sicil kaydını kontrol etmelerini önerin. Temiz çıkarsa devam edilebilir.' },
            },
          },
          {
            id: 'ikamet_isp', text: 'İkametgahı neresi? (Hangi şehirde yaşıyor?)',
            script: '"Şu an hangi şehirde ikamet ediyorsunuz?"',
            type: 'options', hasNote: true, required: true,
            options: IKAMET,
          },
        ],
      },
      {
        id: 'i5', label: 'Adım 5 — Zaman & Notlar', title: 'Karar Süreci & Genel Notlar',
        hint: 'Satın alma niyeti ve zamanlaması',
        questions: [
          {
            id: 'ne_zaman_isp', text: "Ne zaman İspanya'ya taşınmayı / gitmeyi planlıyor?",
            script: '"Planlarınızda bir zaman dilimi var mı? Ne zaman İspanya\'ya geçmek istiyorsunuz?"',
            type: 'options', hasNote: true, required: true,
            options: [
              { label: '🔥 3 ay içinde', value: '3ay', score: 12, cssClass: 'boost' },
              { label: '📅 3-6 ay', value: '6ay', score: 9 },
              { label: '🗓️ 6-12 ay', value: '12ay', score: 7 },
              { label: '❓ 1 yıl+ / Henüz belirsiz', value: 'belirsiz', score: 3 },
            ],
          },
          {
            id: 'not_isp', text: 'Genel Görüşme Notu',
            script: '"Görüşme sırasında öne çıkan önemli detayları buraya yazın."',
            type: 'textarea', required: false,
            placeholder: 'Müşterinin özel durumu, talepleri, dikkat edilmesi gerekenler, vs...',
          },
        ],
      },
    ],
  },

  ingiltere: {
    name: 'İngiltere Vizesi',
    icon: '🇬🇧',
    steps: [
      {
        id: 'ing1', label: 'Adım 1 — Temel Bilgi', title: 'Seyahat Amacı & Tür',
        hint: 'İngiltere Schengen dışındadır — ayrı vize ve ayrı süreç',
        questions: [
          {
            id: 'ing_amac', text: 'İngiltere seyahat amacı nedir?',
            script: '"Merhaba, sizi Vizemo\'dan arıyoruz. İngiltere vizesi konusunda size yardımcı olmak istiyoruz. Seyahat amacınız nedir?"',
            type: 'options', hasNote: true, required: true,
            options: [
              { label: '🏖️ Turizm / Tatil', value: 'turizm', score: 8 },
              { label: '💼 İş / Konferans', value: 'is', score: 9, cssClass: 'boost' },
              { label: '🎓 Öğrenci Vizesi', value: 'ogrenci', score: 8 },
              { label: '👨‍👩‍👧 Aile Ziyareti', value: 'aile', score: 7 },
              { label: '🏥 Tedavi / Sağlık', value: 'saglik', score: 8 },
            ],
          },
          {
            id: 'kac_kisi_ing', text: 'Kaç kişi gidecek?',
            script: '"Tek başınıza mı, yoksa beraberinizde kimse var mı?"',
            type: 'options', hasNote: true, required: true,
            options: [
              { label: '1 Kişi (Yalnız)', value: '1', score: 5 },
              { label: '2 Kişi (Çift)', value: '2', score: 7 },
              { label: '3-5 Kişi (Aile)', value: '3-5', score: 9 },
              { label: '6+ Kişi (Grup)', value: 'grup', score: 10 },
            ],
          },
        ],
      },
      {
        id: 'ing2', label: 'Adım 2 — Vize Geçmişi', title: 'Vize Geçmişi',
        hint: 'Önceki İngiltere / Schengen geçmişi başarı olasılığını etkiler',
        questions: [
          {
            id: 'ing_vize', text: 'Daha önce İngiltere vizesi aldı mı?',
            script: '"Daha önce İngiltere\'ye gittiniz mi?"',
            type: 'options', hasNote: true, required: true,
            options: [
              { label: '✅ Evet, son 3 yılda', value: 'var_yeni', score: 10, cssClass: 'boost' },
              { label: '✅ Evet, eski tarihli', value: 'var_eski', score: 7 },
              { label: '🆕 Hayır, ilk başvuru', value: 'ilk', score: 5 },
              { label: '🚫 Red aldım', value: 'red', score: -5, cssClass: 'disqualify' },
            ],
            alerts: {
              red: { type: 'yellow', text: '⚠️ İngiltere vizesi red geçmişi. Gerekçeyi öğrenin, satış ekibine detaylı not bırakın.' },
            },
          },
          {
            id: 'sch_ing', text: 'Aktif Schengen vizesi var mı?',
            script: '"Şu an geçerli Schengen vizeniz var mı?"',
            type: 'options', hasNote: true, required: false,
            options: [
              { label: '✅ Evet, aktif Schengen var', value: 'var', score: 8, cssClass: 'boost' },
              { label: '⏳ Yakın dönemde kullandım', value: 'gecmis', score: 5 },
              { label: '❌ Hayır', value: 'yok', score: 2 },
            ],
            alerts: {
              var: { type: 'green', text: '✅ Aktif Schengen vizesi İngiltere konsolosluğu için olumlu bir referanstır.' },
            },
          },
        ],
      },
      {
        id: 'ing3', label: 'Adım 3 — Mesleki & Mali', title: 'Mali Durum & Meslek',
        hint: 'İngiltere konsoloslukları mali güvenceye çok dikkat eder',
        questions: [
          {
            id: 'meslek_ing', text: 'Mesleği nedir?',
            script: '"Çalışma durumunuzu öğrenebilir miyim?"',
            type: 'options', hasNote: true, required: true,
            options: [
              { label: '👔 Ücretli Çalışan (Özel)', value: 'ozel', score: 8, cssClass: 'boost' },
              { label: '🏛️ Devlet Memuru / Kamu', value: 'kamu', score: 10, cssClass: 'boost' },
              { label: '🏢 Kendi İşi / Esnaf', value: 'esnaf', score: 8 },
              { label: '💼 Serbest Meslek', value: 'serbest', score: 9, cssClass: 'boost' },
              { label: '🎓 Öğrenci', value: 'ogrenci', score: 4 },
              { label: '🏠 Emekli', value: 'emekli', score: 5 },
              { label: '❌ İşsiz', value: 'issiz', score: -3, cssClass: 'disqualify' },
            ],
            alerts: {
              issiz: { type: 'red', text: '⚠️ İşsiz profil yüksek red riski taşır. Finanse eden kişi var mı sorun.' },
            },
          },
          {
            id: 'ikamet_ing', text: 'İkametgahı neresi?',
            script: '"Şu an hangi şehirde ikamet ediyorsunuz?"',
            type: 'options', hasNote: true, required: true,
            options: IKAMET,
          },
        ],
      },
      {
        id: 'ing4', label: 'Adım 4 — Seyahat Planı', title: 'Seyahat Tarihleri & Rezervasyonlar',
        hint: 'Kesin tarih ve hazırlık durumu lead sıcaklığını belirler',
        questions: [
          {
            id: 'tarih_ing', text: 'Seyahat tarihleri?',
            script: '"Ne zaman gitmeyi planlıyorsunuz?"',
            type: 'options', hasNote: true, required: true,
            options: [
              { label: '🔥 1 ay içinde', value: 'acil', score: 12, cssClass: 'boost' },
              { label: '📅 1-3 ay', value: 'kisa', score: 9 },
              { label: '🗓️ 3-6 ay', value: 'orta', score: 7 },
              { label: '❓ Belirsiz', value: 'belirsiz', score: 3 },
            ],
            alerts: {
              acil: { type: 'yellow', text: '⚠️ ACİL: İngiltere başvurusu ortalama 3-4 hafta sürüyor. Hemen başlatılmalı!' },
            },
          },
          {
            id: 'bilet_ing', text: 'Uçak bileti / otel rezervasyonu var mı?',
            script: '"Bilet veya konaklama rezervasyonunuz var mı?"',
            type: 'options', hasNote: true, required: false,
            options: [
              { label: '✅ İkisi de var', value: 'hepsi', score: 8, cssClass: 'boost' },
              { label: '🎟️ Sadece bilet var', value: 'bilet', score: 6 },
              { label: '🏨 Sadece otel var', value: 'otel', score: 5 },
              { label: '📋 Henüz yok', value: 'yok', score: 2 },
            ],
          },
        ],
      },
      {
        id: 'ing5', label: 'Adım 5 — Karar & Notlar', title: 'Satın Alma Niyeti & Genel Notlar',
        hint: 'Son değerlendirme',
        questions: [
          {
            id: 'ne_zaman_ing', text: 'Süreci ne zaman başlatmak ister?',
            script: '"Süreci ne zaman başlatmak düşünüyorsunuz?"',
            type: 'options', hasNote: true, required: true,
            options: [
              { label: '🔥 Hemen / Bu hafta', value: 'hemen', score: 12, cssClass: 'boost' },
              { label: '📅 Bu ay içinde', value: 'ay', score: 9, cssClass: 'boost' },
              { label: '🕐 1-2 ay sonra', value: '2ay', score: 6 },
              { label: '❓ Henüz karar vermedim', value: 'karar_yok', score: 1 },
            ],
          },
          {
            id: 'not_ing', text: 'Genel Görüşme Notu',
            script: '"Görüşme sırasında öne çıkan önemli detayları buraya yazın."',
            type: 'textarea', required: false,
            placeholder: 'Müşterinin özel durumu, talepleri, dikkat edilmesi gerekenler, vs...',
          },
        ],
      },
    ],
  },

  amerika: {
    name: 'Amerika Vizesi',
    icon: '🇺🇸',
    steps: [
      {
        id: 'abd1', label: 'Adım 1 — Temel Bilgi', title: 'Seyahat Amacı & Tür',
        hint: 'ABD vizesi uzun ve detaylı bir süreçtir — müşteri beklentisini ilk başta yönetin',
        questions: [
          {
            id: 'abd_amac', text: 'Amerika seyahat amacı nedir?',
            script: '"Merhaba, sizi Vizemo\'dan arıyoruz. Amerika vize sürecinizde size yardımcı olmak istiyoruz. Seyahat amacınız nedir?"',
            type: 'options', hasNote: true, required: true,
            options: [
              { label: '🏖️ Turizm / Tatil (B2)', value: 'turizm', score: 8 },
              { label: '💼 İş / Toplantı (B1)', value: 'is', score: 9, cssClass: 'boost' },
              { label: '🎓 Öğrenci (F1)', value: 'ogrenci', score: 8 },
              { label: '👨‍👩‍👧 Aile Ziyareti', value: 'aile', score: 7 },
              { label: '🏥 Sağlık / Tedavi', value: 'saglik', score: 8 },
              { label: '🎪 Fuar / Kongre', value: 'fuar', score: 9, cssClass: 'boost' },
            ],
          },
          {
            id: 'kac_kisi_abd', text: 'Kaç kişi gidecek?',
            script: '"Tek başınıza mı, yoksa beraberinizde kimse var mı?"',
            type: 'options', hasNote: true, required: true,
            options: [
              { label: '1 Kişi (Yalnız)', value: '1', score: 5 },
              { label: '2 Kişi (Çift)', value: '2', score: 7 },
              { label: '3-5 Kişi (Aile)', value: '3-5', score: 9 },
              { label: '6+ Kişi (Grup)', value: 'grup', score: 10 },
            ],
          },
        ],
      },
      {
        id: 'abd2', label: 'Adım 2 — Vize Geçmişi', title: 'Vize Geçmişi & ABD Bağlantısı',
        hint: 'ABD vizeleri için geçmiş seyahat ve çıkar bağı çok kritiktir',
        questions: [
          {
            id: 'abd_vize', text: 'Daha önce Amerika vizesi aldı mı?',
            script: '"Daha önce Amerika\'ya gittiniz mi veya vize aldınız mı?"',
            type: 'options', hasNote: true, required: true,
            options: [
              { label: '✅ Evet, son 5 yılda geçerli', value: 'var_yeni', score: 12, cssClass: 'boost' },
              { label: '✅ Evet, süresi doldu / eski', value: 'var_eski', score: 8 },
              { label: '🆕 Hayır, ilk başvuru', value: 'ilk', score: 4 },
              { label: '🚫 Red aldım', value: 'red', score: -5, cssClass: 'disqualify' },
            ],
            alerts: {
              red: { type: 'yellow', text: '⚠️ ABD vize reddi çok ciddidir. Red gerekçesi 214(b) mi (bağ yokluğu) yoksa başka sebep mi? Mutlaka not bırakın.' },
              var_yeni: { type: 'green', text: '✅ Aktif ABD vize geçmişi — yenileme başvurusu çok daha kolaydır. Sıcak lead!' },
            },
          },
          {
            id: 'sch_abd', text: 'Aktif Schengen veya başka gelişmiş ülke vizesi var mı?',
            script: '"Şu an geçerli Schengen, İngiltere veya Kanada gibi bir vizeniz var mı?"',
            type: 'options', hasNote: true, required: false,
            options: [
              { label: '✅ Evet (Schengen / İngiltere / Kanada)', value: 'var', score: 7, cssClass: 'boost' },
              { label: '⏳ Yakın dönemde kullandım', value: 'gecmis', score: 4 },
              { label: '❌ Hayır', value: 'yok', score: 1 },
            ],
            alerts: {
              var: { type: 'green', text: '✅ Güçlü vize geçmişi ABD başvurusu için olumlu göstergedir.' },
            },
          },
        ],
      },
      {
        id: 'abd3', label: 'Adım 3 — Mesleki & Mali', title: 'İş & Finansal Profil',
        hint: "ABD konsolosluğu 'ülkeye dönüş bağı' arar — güçlü iş bağı kritik",
        questions: [
          {
            id: 'meslek_abd', text: 'Mesleği nedir?',
            script: '"Çalışma durumunuzu öğrenebilir miyim? ABD başvurularında iş durumu ve ülkeye bağlılık çok önemli."',
            type: 'options', hasNote: true, required: true,
            options: [
              { label: '👔 Ücretli Çalışan (Özel)', value: 'ozel', score: 8, cssClass: 'boost' },
              { label: '🏛️ Devlet Memuru / Kamu', value: 'kamu', score: 10, cssClass: 'boost' },
              { label: '🏢 Kendi İşi / Şirket Sahibi', value: 'esnaf', score: 9, cssClass: 'boost' },
              { label: '💼 Serbest Meslek (Doktor, Avukat)', value: 'serbest', score: 9, cssClass: 'boost' },
              { label: '🎓 Öğrenci', value: 'ogrenci', score: 5 },
              { label: '🏠 Emekli', value: 'emekli', score: 5 },
              { label: '❌ İşsiz / Geliri Yok', value: 'issiz', score: -3, cssClass: 'disqualify' },
            ],
            alerts: {
              issiz: { type: 'red', text: "⚠️ İşsiz profil ABD vizesinde red riski çok yüksek. 'Ülkeye dönüş bağı' kanıtlanamaz." },
              kamu: { type: 'green', text: '✅ Kamu çalışanı profili ABD konsolosluğu için çok güçlü bir bağdır!' },
            },
          },
          {
            id: 'ikamet_abd', text: 'İkametgahı neresi?',
            script: '"Şu an hangi şehirde ikamet ediyorsunuz?"',
            type: 'options', hasNote: true, required: true,
            options: IKAMET,
          },
        ],
      },
      {
        id: 'abd4', label: 'Adım 4 — Seyahat Planı', title: 'Seyahat Tarihleri & Bağlantılar',
        hint: 'ABD mülakat randevusu uzun bekleme gerektirebilir — erken başlanmalı',
        questions: [
          {
            id: 'tarih_abd', text: 'Seyahat tarihleri?',
            script: '"Ne zaman gitmeyi planlıyorsunuz?"',
            type: 'options', hasNote: true, required: true,
            options: [
              { label: '🔥 1 ay içinde', value: 'acil', score: 8, cssClass: 'boost' },
              { label: '📅 1-3 ay', value: 'kisa', score: 10, cssClass: 'boost' },
              { label: '🗓️ 3-6 ay', value: 'orta', score: 8 },
              { label: '❓ Belirsiz / Uzun vadeli', value: 'belirsiz', score: 4 },
            ],
            alerts: {
              acil: { type: 'red', text: '🚫 ACİL UYARI: ABD mülakat randevuları 1-3 ay bekleme gerektirebilir. Süreç bu kadar kısa sürede tamamlanamayabilir. Müşteriyi bilgilendirin!' },
              kisa: { type: 'yellow', text: '⚠️ 1-3 ay içinde seyahat — randevu beklemesi hesaplanmalı. Hemen başvuru yapılmalı.' },
            },
          },
          {
            id: 'abd_bag', text: "ABD'de akrabası / iş bağlantısı var mı?",
            script: '"Amerika\'da tanıdığınız biri var mı — akraba, iş ortağı veya sponsor olabilecek biri?"',
            type: 'options', hasNote: true, required: false,
            options: [
              { label: '✅ Evet, iş bağlantısı / sponsor', value: 'is_bag', score: 5, cssClass: 'boost' },
              { label: '👨‍👩‍👧 Evet, akraba / tanıdık var', value: 'akraba', score: 2 },
              { label: '❌ Hayır, bağlantım yok', value: 'yok', score: 1 },
            ],
            alerts: {
              akraba: { type: 'yellow', text: '⚠️ ABD vatandaşı yakın akraba bazen yerleşme riski olarak değerlendirilebilir. Başvuru profilini iyi yönetin.' },
            },
          },
        ],
      },
      {
        id: 'abd5', label: 'Adım 5 — Karar & Notlar', title: 'Satın Alma Niyeti & Genel Notlar',
        hint: 'Son değerlendirme',
        questions: [
          {
            id: 'ne_zaman_abd', text: 'Süreci ne zaman başlatmak ister?',
            script: '"Süreci ne zaman başlatmak düşünüyorsunuz?"',
            type: 'options', hasNote: true, required: true,
            options: [
              { label: '🔥 Hemen / Bu hafta', value: 'hemen', score: 12, cssClass: 'boost' },
              { label: '📅 Bu ay içinde', value: 'ay', score: 9, cssClass: 'boost' },
              { label: '🕐 1-2 ay sonra', value: '2ay', score: 6 },
              { label: '❓ Henüz karar vermedim', value: 'karar_yok', score: 1 },
            ],
          },
          {
            id: 'not_abd', text: 'Genel Görüşme Notu',
            script: '"Görüşme sırasında öne çıkan önemli detayları buraya yazın."',
            type: 'textarea', required: false,
            placeholder: "Müşterinin özel durumu, ABD bağlantısı, mülakat hazırlığı notları, dikkat edilmesi gerekenler, vs...",
          },
        ],
      },
    ],
  },
};
