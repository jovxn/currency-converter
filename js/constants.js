// ── Currency Data & Constants ────────────────────────────────────

var CurrencyExt = {};

CurrencyExt.SYMBOL_MAP = {
  'S$': 'SGD', 'US$': 'USD', 'A$': 'AUD', 'HK$': 'HKD',
  'RM': 'MYR', '€': 'EUR', '£': 'GBP', '¥': 'JPY',
  '₩': 'KRW', '฿': 'THB', '₹': 'INR', '$': 'USD'
};

CurrencyExt.WORD_MAP = {
  'dollar': 'USD', 'dollars': 'USD',
  'euro': 'EUR', 'euros': 'EUR',
  'pound': 'GBP', 'pounds': 'GBP',
  'yen': 'JPY',
  'ringgit': 'MYR',
  'yuan': 'CNY', 'rmb': 'CNY',
  'won': 'KRW',
  'baht': 'THB',
  'rupee': 'INR', 'rupees': 'INR'
};

CurrencyExt.CODES = [
  'USD','EUR','GBP','JPY','MYR','CNY','AUD','KRW',
  'SGD','THB','INR','CAD','HKD','NZD','CHF','SEK',
  'NOK','DKK','PHP','IDR','TWD','VND','BRL','ZAR'
];

CurrencyExt.CURRENCY_NAMES = {
  USD: 'US Dollar', EUR: 'Euro', GBP: 'British Pound',
  JPY: 'Japanese Yen', MYR: 'Malaysian Ringgit', CNY: 'Chinese Yuan',
  AUD: 'Australian Dollar', KRW: 'Korean Won', SGD: 'Singapore Dollar',
  THB: 'Thai Baht', INR: 'Indian Rupee', CAD: 'Canadian Dollar',
  HKD: 'Hong Kong Dollar', NZD: 'New Zealand Dollar', CHF: 'Swiss Franc',
  SEK: 'Swedish Krona', NOK: 'Norwegian Krone', DKK: 'Danish Krone',
  PHP: 'Philippine Peso', IDR: 'Indonesian Rupiah', TWD: 'Taiwan Dollar',
  VND: 'Vietnamese Dong', BRL: 'Brazilian Real', ZAR: 'South African Rand'
};

// Reverse lookup: code → symbol (for display)
CurrencyExt.CODE_TO_SYMBOL = {};
for (var sym in CurrencyExt.SYMBOL_MAP) {
  var code = CurrencyExt.SYMBOL_MAP[sym];
  if (!CurrencyExt.CODE_TO_SYMBOL[code]) {
    CurrencyExt.CODE_TO_SYMBOL[code] = sym;
  }
}

CurrencyExt.API_BASE = 'https://v6.exchangerate-api.com/v6';

// Mutable settings (updated by panel.js on load/save)
CurrencyExt.cacheTTL = 3600000;
CurrencyExt.defaultCurrency = 'SGD';
CurrencyExt.currentTheme = 'dark';
