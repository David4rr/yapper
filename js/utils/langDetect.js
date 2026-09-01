/**
 * Language Detector Utility
 * Fast, lightweight client-side heuristic for detecting Indonesian vs English text.
 */

const ID_WORDS = new Set([
  'yang', 'di', 'dan', 'ini', 'itu', 'dengan', 'untuk', 'tidak', 'ada', 'dari',
  'aku', 'kamu', 'dia', 'mereka', 'kita', 'kami', 'lu', 'gue', 'gw', 'lo',
  'loe', 'elu', 'ane', 'ente', 'baper', 'gabut', 'mager', 'kepo', 'gokil',
  'mantul', 'ribet', 'ngab', 'cuy', 'wkwk', 'kudu', 'santai', 'gimana', 'kenapa',
  'napa', 'knp', 'bgt', 'banget', 'udah', 'udh', 'dah', 'belum', 'blm', 'blom',
  'pengen', 'mau', 'mo', 'bisa', 'gabisa', 'gamau', 'gausah', 'gaada', 'gak',
  'tdk', 'tak', 'iya', 'ya', 'emang', 'emg', 'tapi', 'tp', 'terus', 'trus',
  'abis', 'habis', 'kalo', 'klo', 'kl', 'kalau', 'jika', 'supaya', 'biar',
  'agar', 'buat', 'bagi', 'sama', 'sm', 'ama', 'dgn', 'pake', 'pke', 'pakai',
  'pakek', 'bikin', 'jadi', 'jd', 'adalah', 'yaitu', 'yakni', 'dmn', 'dimana',
  'kesini', 'kesana', 'disini', 'disana', 'ke', 'dlm', 'dalam', 'luar', 'atas',
  'bawah', 'depan', 'belakang', 'pas', 'waktu', 'saat', 'lagi', 'lg', 'sedang',
  'masih', 'msh', 'baru', 'bbrp', 'beberapa', 'semua', 'smua', 'banyak', 'bnyk',
  'dikit', 'sedikit', 'kurang', 'krg', 'lebih', 'lbh', 'paling', 'plg', 'selalu',
  'sering', 'jarang', 'pernah', 'prnh', 'bakal', 'bkl', 'akan', 'boleh', 'harus',
  'hrs', 'musti', 'wajib', 'tolong', 'tlg', 'bantu', 'bantuin', 'minta', 'coba',
  'dong', 'sih', 'kok', 'deh', 'lah', 'nih', 'tuh', 'kan', 'yuk', 'gan', 'bro',
  'sis', 'kak', 'bang'
]);

const EN_WORDS = new Set([
  'the', 'and', 'that', 'have', 'for', 'not', 'with', 'you', 'this', 'but',
  'his', 'from', 'they', 'say', 'her', 'she', 'will', 'one', 'all', 'would',
  'there', 'their', 'what', 'out', 'about', 'who', 'get', 'which', 'go', 'me',
  'when', 'make', 'can', 'like', 'time', 'no', 'just', 'him', 'know', 'take',
  'person', 'into', 'year', 'your', 'good', 'some', 'could', 'them', 'see',
  'other', 'than', 'then', 'now', 'look', 'only', 'come', 'its', 'over',
  'think', 'also', 'back', 'after', 'use', 'two', 'how', 'our', 'work',
  'first', 'well', 'way', 'even', 'new', 'want', 'because', 'any', 'these',
  'give', 'day', 'most', 'us', 'is', 'are', 'was', 'were', 'been', 'being',
  'should', 'must', 'might', 'shall', 'please', 'create', 'build', 'add',
  'remove', 'update', 'fix', 'refactor', 'test'
]);

const ID_AFFIX_REGEX = /^(me|di|ke|se|pe|ber|ter|men|mem|meng|meny)[a-z]{3,}|[a-z]{3,}(kan|an|i|nya|lah|kah|pun)$/i;

/**
 * Detect language of input string.
 * @param {string} text
 * @returns {{ code: 'ID' | 'EN' | 'AUTO', label: string, name: string, isIndonesian: boolean }}
 */
export function detectLanguage(text) {
  if (!text || typeof text !== 'string') {
    return { code: 'AUTO', label: 'AUTO', name: 'Auto Detect', isIndonesian: true };
  }

  const cleaned = text.trim();
  if (cleaned.length < 3) {
    return { code: 'AUTO', label: 'AUTO', name: 'Auto Detect', isIndonesian: true };
  }

  // Tokenize into lowercase alphabetical words
  const words = cleaned.toLowerCase().match(/[a-z]{2,}/g) || [];
  if (words.length === 0) {
    return { code: 'AUTO', label: 'AUTO', name: 'Auto Detect', isIndonesian: true };
  }

  let idScore = 0;
  let enScore = 0;

  for (const word of words) {
    if (ID_WORDS.has(word)) {
      idScore += 2;
    } else if (ID_AFFIX_REGEX.test(word)) {
      idScore += 1;
    }

    if (EN_WORDS.has(word)) {
      enScore += 2;
    }
  }

  if (idScore === 0 && enScore === 0) {
    return { code: 'AUTO', label: 'AUTO', name: 'Auto Detect', isIndonesian: true };
  }

  if (idScore >= enScore) {
    return { code: 'ID', label: 'ID', name: 'Indonesian', isIndonesian: true };
  } else {
    return { code: 'EN', label: 'EN', name: 'English', isIndonesian: false };
  }
}
