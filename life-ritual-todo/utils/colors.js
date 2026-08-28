// 颜色配置：主题色板 + 分区色板

const THEMES = {
  light: {
    'primary': '#6BCB77',
    'primary-deep': '#4CAF62',
    'primary-soft': 'rgba(107, 203, 119, 0.12)',
    'bg': '#F7F9F2',
    'card': '#FFFFFF',
    'card-2': '#FBFDF8',
    'text': '#2D3436',
    'text-2': '#636E72',
    'text-3': '#A8B0AE',
    'border': '#F0F0F0',
    'overdue': '#FF4757',
    'shadow': 'rgba(43, 91, 56, 0.06)',
    'fab-text': '#FFFFFF'
  },
  dark: {
    'primary': '#5DBE6A',
    'primary-deep': '#4CAF62',
    'primary-soft': 'rgba(93, 190, 106, 0.16)',
    'bg': '#1A1A1A',
    'card': '#2D2D2D',
    'card-2': '#262626',
    'text': '#F0F0F0',
    'text-2': '#B0B0B0',
    'text-3': '#707070',
    'border': '#3D3D3D',
    'overdue': '#FF6B81',
    'shadow': 'rgba(0, 0, 0, 0.35)',
    'fab-text': '#FFFFFF'
  }
};

// 预设分区（独立存储的默认值）
const DEFAULT_CATEGORIES = [
  { name: '重要', color: '#FF4757' },
  { name: '紧急', color: '#FF6348' },
  { name: '生活', color: '#2ED573' },
  { name: '学习', color: '#1E90FF' },
  { name: '工作', color: '#FFA502' },
  { name: '健康', color: '#A29BFE' },
  { name: '其他', color: '#DFE6E9' }
];

// 自定义分区新颜色池（柔和色板，未使用时依次分配）
const CUSTOM_PALETTE = [
  '#74B9FF', '#FDCB6E', '#E17055', '#00CEC9', '#FDA7DF', '#55E6C1',
  '#FFC048', '#B8E994', '#F8A5C2', '#778BEB', '#FAD390', '#20B2AA'
];

function getThemeStyle(theme) {
  const t = THEMES[theme] || THEMES.light;
  return Object.keys(t).map((k) => `--${k}: ${t[k]}`).join(';');
}

function getThemeValue(theme, key) {
  return (THEMES[theme] || THEMES.light)[key];
}

function loadTheme() {
  return wx.getStorageSync('theme') || 'light';
}

function saveTheme(theme) {
  wx.setStorageSync('theme', theme);
}

// 为新增分区挑选一个未使用的颜色
function nextCategoryColor(existingColors) {
  const used = new Set(existingColors || []);
  const available = CUSTOM_PALETTE.concat(DEFAULT_CATEGORIES.map((c) => c.color));
  for (let i = 0; i < available.length; i++) {
    if (!used.has(available[i])) return available[i];
  }
  return '#95A5A6';
}

module.exports = {
  THEMES,
  DEFAULT_CATEGORIES,
  CUSTOM_PALETTE,
  getThemeStyle,
  getThemeValue,
  loadTheme,
  saveTheme,
  nextCategoryColor
};
