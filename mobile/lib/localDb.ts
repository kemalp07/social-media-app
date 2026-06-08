import * as SQLite from 'expo-sqlite';

// ─── İSİM HAVUZLARI ───────────────────────────────────────────────────────────

const ERKEK = [
  'Ahmet', 'Mehmet', 'Ali', 'Mustafa', 'Emre', 'Burak', 'Can', 'Murat', 'Oğuz', 'Kemal',
  'Hasan', 'Hüseyin', 'İbrahim', 'Yusuf', 'Ömer', 'Fatih', 'Serkan', 'Tarık', 'Onur', 'Cem',
  'Berk', 'Kaan', 'Ege', 'Alp', 'Deniz', 'Barış', 'Gökhan', 'Tolga', 'Volkan', 'Selçuk',
  'Kadir', 'Erdal', 'Orhan', 'Ferhat', 'Sinan', 'Uğur', 'Taner', 'Necati', 'Haydar', 'Rıza',
  'Enver', 'Cengiz', 'Turgut', 'Yaşar', 'Ramazan', 'Bayram', 'Ekrem', 'Şükrü', 'Nevzat', 'Zeki',
  'Hamit', 'Salih', 'Recep', 'Celal', 'Nuri', 'Metin', 'Adem', 'Erkan', 'Suat', 'Turan',
  'Coşkun', 'Güven', 'Ertuğrul', 'Serhat', 'Mert', 'Okan', 'Berkay', 'Çağrı', 'Furkan', 'Umut',
  'Arda', 'Doruk', 'Emir', 'Kerem', 'Sergen', 'Yiğit', 'Özgür', 'Alper', 'Caner', 'Duman',
  'Göktürk', 'Harun', 'İlker', 'Kağan', 'Levent', 'Nadir', 'Polat', 'Rauf', 'Sezer', 'Tayfun',
  'Ufuk', 'Vedat', 'Yalçın', 'Zafer', 'Atilla', 'Bedri', 'Cemal', 'Ersin', 'Fikret', 'Galip',
];

const KADIN = [
  'Ayşe', 'Fatma', 'Zeynep', 'Elif', 'Merve', 'Selin', 'Büşra', 'Esra', 'Gamze', 'Hande',
  'Hatice', 'Emine', 'Hacer', 'Zeliha', 'Nurcan', 'Özlem', 'Pınar', 'Sibel', 'Tuğba', 'Ülkü',
  'Yasemin', 'Zuhal', 'Aslı', 'Berna', 'Ceren', 'Dilek', 'Filiz', 'Gülşen', 'İlknur', 'Kübra',
  'Leyla', 'Nazan', 'Perihan', 'Reyhan', 'Sevinç', 'Tülay', 'Vildan', 'Asuman', 'Bahar', 'Çiğdem',
  'Damla', 'Ebru', 'Figen', 'Gülay', 'Hülya', 'İpek', 'Jale', 'Kadriye', 'Lale', 'Müge',
  'Nalan', 'Oya', 'Pelin', 'Rukiye', 'Sevgi', 'Tuba', 'Ümit', 'Vahide', 'Yıldız', 'Zümrüt',
  'Arzu', 'Belgin', 'Cansu', 'Duygu', 'Ela', 'Feride', 'Gözde', 'Hilal', 'İrem', 'Kader',
  'Lara', 'Melek', 'Nilay', 'Özge', 'Pınar', 'Rana', 'Seda', 'Tülin', 'Ünzile', 'Vesile',
  'Yeliz', 'Zehra', 'Azra', 'Beyza', 'Cemre', 'Dilan', 'Ecrin', 'Feyza', 'Gülnur', 'Havva',
  'İlayda', 'Kıymet', 'Lamia', 'Miray', 'Nesrin', 'Oya', 'Pembe', 'Raziye', 'Serpil', 'Türkan',
];

const SOYAD = [
  'Yılmaz', 'Kaya', 'Demir', 'Çelik', 'Şahin', 'Yıldız', 'Arslan', 'Doğan', 'Aydın', 'Öztürk',
  'Yıldırım', 'Erdoğan', 'Kılıç', 'Aslan', 'Çetin', 'Koç', 'Kurt', 'Özdemir', 'Şimşek', 'Güneş',
  'Aktaş', 'Bulut', 'Çakır', 'Duman', 'Erdem', 'Güler', 'Işık', 'Karahan', 'Keskin', 'Korkmaz',
  'Küçük', 'Özer', 'Polat', 'Sağlam', 'Taş', 'Uçar', 'Uysal', 'Ünal', 'Yavuz', 'Zengin',
  'Acar', 'Bal', 'Balcı', 'Bayram', 'Boz', 'Büyük', 'Ceylan', 'Coşkun', 'Çakar', 'Dağ',
  'Demirci', 'Deniz', 'Dikmen', 'Duman', 'Ekinci', 'Elmas', 'Ercan', 'Ergin', 'Ertan', 'Esen',
  'Gezgin', 'Gökçe', 'Güçlü', 'Gündoğdu', 'Güngör', 'Han', 'Işıl', 'İnan', 'Kaplan', 'Karacan',
  'Karataş', 'Kaynak', 'Kılınç', 'Koca', 'Kocaman', 'Köse', 'Kuş', 'Önal', 'Önen', 'Özcan',
  'Özkan', 'Özkaya', 'Öztaş', 'Saraç', 'Sarı', 'Sezer', 'Solak', 'Sümer', 'Tan', 'Taner',
  'Tekin', 'Timur', 'Topal', 'Toprak', 'Tunç', 'Türk', 'Türker', 'Uluç', 'Uzun', 'Vardar',
  'Vural', 'Yalçın', 'Yeşil', 'Yiğit', 'Yorulmaz', 'Yüksel', 'Zeyrek', 'Akay', 'Akbaş', 'Akbulut',
  'Akgül', 'Akman', 'Aksoy', 'Aktürk', 'Alkan', 'Alp', 'Altay', 'Altın', 'Altıntaş', 'Altun',
  'Arı', 'Arıkan', 'Arık', 'Atalay', 'Ataman', 'Ateş', 'Avcı', 'Aydoğan', 'Aydoğdu', 'Aygün',
  'Babaoğlu', 'Bahadır', 'Bakır', 'Bakırcı', 'Balaban', 'Başaran', 'Başer', 'Başoğlu', 'Baş', 'Batmaz',
  'Bayar', 'Bayat', 'Bayındır', 'Baykal', 'Bayraktar', 'Baytaş', 'Berber', 'Beşer', 'Bilge', 'Bilgin',
  'Bilik', 'Binici', 'Bircan', 'Boran', 'Bostan', 'Bozkurt', 'Bölük', 'Budak', 'Burak', 'Büker',
  'Candan', 'Candemir', 'Caner', 'Canpolat', 'Cantürk', 'Cin', 'Cingöz', 'Civelek', 'Cömert', 'Cumhur',
  'Çakmak', 'Çalışkan', 'Çam', 'Çamlı', 'Çavuş', 'Çavdar', 'Çınar', 'Çiftçi', 'Çoban', 'Çolak',
  'Dadaş', 'Dalkıran', 'Dalyan', 'Dede', 'Demir', 'Demirbaş', 'Demirkol', 'Demirtaş', 'Dinç', 'Doğru',
];

// ─── NİCK FORMAT ŞABLONLARI ───────────────────────────────────────────────────

const NICK_KEYWORDS = [
  'official', 'real', 'tr', 'pro', 'life', 'gram', 'photo', 'live',
  'world', 'daily', 'blog', 'tv', 'media', 'studio', 'art', 'style',
  'fit', 'food', 'travel', 'music', 'sport', 'love', 'mode', 'shop',
];

const NICK_PREFIXES = [
  'the_real_', 'mr_', 'ms_', 'im_', 'its_', 'just_', 'only_', 'hey_',
  'iam_', 'x_', 'xx_', 'official_',
];

function toLatinLower(str: string): string {
  return str
    .toLowerCase()
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ı/g, 'i')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .replace(/İ/g, 'i')
    .replace(/Ğ/g, 'g')
    .replace(/Ü/g, 'u')
    .replace(/Ş/g, 's')
    .replace(/Ö/g, 'o')
    .replace(/Ç/g, 'c');
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

const NICK_SUFFIXES = ['x', 'hq', 'tr', '01', '07', '34', '06', '35', 'ist', 'bjk', 'gs'];

function optionalNumber(): string {
  const roll = Math.random();
  if (roll < 0.45) return '';
  if (roll < 0.65) return String(randomInt(1, 99));
  if (roll < 0.82) return String(randomInt(1994, 2007));
  if (roll < 0.93) return String(randomInt(100, 999));
  return String(randomInt(1000, 99999));
}

function pickSeparator(): string {
  return randomChoice(['.', '_', '']);
}

function trimNick(raw: string): string {
  return raw
    .replace(/[._-]{2,}/g, '_')
    .replace(/^[._-]+|[._-]+$/g, '')
    .slice(0, 29);
}

function fullNameNick(f: string, l: string): string {
  const sep = pickSeparator();
  const num = optionalNumber();
  const formats = [
    () => `${f}${sep}${l}${num}`,
    () => `${l}${sep}${f}${num}`,
    () => `${f}${l}${num}`,
    () => `${f}.${l}`,
    () => `${f}_${l}`,
    () => `${l.toLowerCase()}.${f}${num}`,
  ];
  return trimNick(randomChoice(formats)());
}

function firstNameNick(f: string, l: string): string {
  const num = optionalNumber();
  const li = l[0] ?? '';
  const formats = [
    () => `${f}${num}`,
    () => f,
    () => `${f}${li}${num}`,
    () => `${f}.${li}`,
    () => `${f}_${li}${num}`,
    () => `${f}${randomChoice(NICK_SUFFIXES)}${num}`,
  ];
  return trimNick(randomChoice(formats)());
}

function keywordNick(f: string, l: string): string {
  const keyword = randomChoice(NICK_KEYWORDS);
  const num = optionalNumber();
  const formats = [
    () => `${f}_${keyword}${num}`,
    () => `${f}.${keyword}`,
    () => `${keyword}${f}${num}`,
    () => `${f}${keyword}${num}`,
    () => `${f}_${l[0] ?? ''}${keyword}${num}`,
    () => `${f}_${keyword}`,
  ];
  return trimNick(randomChoice(formats)());
}

function prefixNick(f: string): string {
  const num = optionalNumber();
  const prefix = randomChoice(NICK_PREFIXES);
  const formats = [
    () => `${prefix}${f}${num}`,
    () => `${f}${num}${randomChoice(NICK_SUFFIXES)}`,
    () => `real${f}${num}`,
    () => `its${f}${num}`,
  ];
  return trimNick(randomChoice(formats)());
}

function initialNick(f: string, l: string): string {
  const num = optionalNumber();
  const formats = [
    () => `${f[0] ?? ''}${l}${num}`,
    () => `${f[0] ?? ''}.${l}${num}`,
    () => `${f}${l[0] ?? ''}${l[1] ?? ''}${num}`,
    () => `${f[0] ?? ''}${l[0] ?? ''}${num}`,
    () => `${f}_${l[0] ?? ''}_${l[1] ?? ''}${num}`,
  ];
  return trimNick(randomChoice(formats)());
}

function quirkyNick(f: string, l: string): string {
  const num = optionalNumber();
  const formats = [
    () => `_${f}_`,
    () => `${f}x${l[0] ?? ''}${num}`,
    () => `${l}${f[0] ?? ''}${num}`,
    () => `${f}.${num}`,
    () => `${f}${randomInt(10, 99)}${l[0] ?? ''}`,
    () => `${f}${l}${randomChoice(NICK_SUFFIXES)}`,
    () => `x${f}x${num}`,
  ];
  return trimNick(randomChoice(formats)());
}

function generateNick(first: string, last: string): string {
  const f = toLatinLower(first);
  const l = toLatinLower(last);
  const roll = Math.random();

  let nick: string;
  if (roll < 0.3) nick = fullNameNick(f, l);
  else if (roll < 0.52) nick = firstNameNick(f, l);
  else if (roll < 0.68) nick = keywordNick(f, l);
  else if (roll < 0.8) nick = initialNick(f, l);
  else if (roll < 0.9) nick = prefixNick(f);
  else nick = quirkyNick(f, l);

  if (!nick || nick.length < 2) {
    nick = trimNick(`${f}${l}${optionalNumber()}`);
  }
  return nick;
}

// ─── SQLite ───────────────────────────────────────────────────────────────────

const LOCAL_DB_USERNAME_VERSION = 2;

let _db: SQLite.SQLiteDatabase | null = null;

function getDb(): SQLite.SQLiteDatabase {
  if (!_db) {
    _db = SQLite.openDatabaseSync('vibe_local.db');
  }
  return _db;
}

export interface LocalUser {
  id: number;
  username: string;
  display_name: string;
  avatar_seed: string;
}

export function initLocalDb(): void {
  const db = getDb();
  db.execSync(`
    CREATE TABLE IF NOT EXISTS local_users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      display_name TEXT NOT NULL,
      avatar_seed TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_local_users_id ON local_users(id);
    CREATE TABLE IF NOT EXISTS local_meta (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);

  const row = db.getFirstSync<{ value: string }>(
    "SELECT value FROM local_meta WHERE key = 'username_version'"
  );
  const version = row ? Number.parseInt(row.value, 10) : 0;
  if (version < LOCAL_DB_USERNAME_VERSION) {
    db.execSync('DELETE FROM local_users');
    db.runSync(
      "INSERT OR REPLACE INTO local_meta (key, value) VALUES ('username_version', ?)",
      [String(LOCAL_DB_USERNAME_VERSION)]
    );
  }
}

export function getLocalUserCount(): number {
  const db = getDb();
  const row = db.getFirstSync<{ count: number }>('SELECT COUNT(*) as count FROM local_users');
  return row?.count ?? 0;
}

export async function generateLocalUsers(
  count: number = 100000,
  onProgress?: (done: number, total: number) => void
): Promise<void> {
  const existing = getLocalUserCount();
  if (existing >= count) return;

  const db = getDb();
  const toGenerate = count - existing;
  const batchSize = 500;
  let generated = 0;
  const usedNicks = new Set<string>();

  while (generated < toGenerate) {
    const batch = Math.min(batchSize, toGenerate - generated);

    db.withTransactionSync(() => {
      for (let i = 0; i < batch; i++) {
        const isMale = Math.random() > 0.5;
        const first = randomChoice(isMale ? ERKEK : KADIN);
        const last = randomChoice(SOYAD);

        let nick = generateNick(first, last);
        let attempts = 0;
        while (usedNicks.has(nick) && attempts < 10) {
          nick = generateNick(first, last);
          attempts++;
        }
        if (usedNicks.has(nick)) {
          nick = `${toLatinLower(first)}_${randomInt(10000, 99999)}`;
        }
        usedNicks.add(nick);

        db.runSync(
          'INSERT OR IGNORE INTO local_users (username, display_name, avatar_seed) VALUES (?, ?, ?)',
          [nick, `${first} ${last}`, nick]
        );
      }
    });

    generated += batch;
    onProgress?.(Math.min(existing + generated, count), count);

    await new Promise((r) => setTimeout(r, 0));
  }
}

export function getRandomLocalUsers(count: number): LocalUser[] {
  const db = getDb();
  return db.getAllSync<LocalUser>(
    'SELECT * FROM local_users ORDER BY RANDOM() LIMIT ?',
    [count]
  );
}

export function buildFollowerNotification(
  tier1Names: string[],
  tier2Names: string[],
  tier3Count: number
): string {
  const allNames = [...tier1Names, ...tier2Names];
  const total = allNames.length + tier3Count;

  if (allNames.length === 0) {
    if (total === 1) {
      const [u] = getRandomLocalUsers(1);
      return `@${u.username} seni takip etti`;
    }
    if (total === 2) {
      const locals = getRandomLocalUsers(2);
      return `@${locals[0].username}, @${locals[1].username} seni takip etti`;
    }
    const locals = getRandomLocalUsers(2);
    const names = locals.map((u) => `@${u.username}`);
    return `${names.join(', ')} ve ${total - 2} kişi daha seni takip etti`;
  }

  const shown = allNames.slice(0, 2).map((n) => `@${n}`).join(', ');
  const rest = total - 2;
  return rest > 0
    ? `${shown} ve ${rest} kişi daha seni takip etti`
    : `${shown} seni takip etti`;
}
