// app.js
const { getThemeStyle, getThemeValue } = require('./utils/colors');

App({
  globalData: {
    theme: 'light',
    themeStyle: '',
    statusBarHeight: 20
  },

  onLaunch() {
    const theme = wx.getStorageSync('theme') || 'light';
    this.globalData.theme = theme;
    this.globalData.themeStyle = getThemeStyle(theme);

    try {
      const info = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync();
      this.globalData.statusBarHeight = info.statusBarHeight || 20;
    } catch (e) { /* 忽略 */ }

    try {
      wx.setBackgroundColor({ backgroundColor: getThemeValue(theme, 'bg') });
    } catch (e) { /* 忽略 */ }
  },

  // 设置主题并同步全局状态
  setTheme(theme) {
    this.globalData.theme = theme;
    this.globalData.themeStyle = getThemeStyle(theme);
    try {
      wx.setBackgroundColor({ backgroundColor: getThemeValue(theme, 'bg') });
    } catch (e) { /* 忽略 */ }
  }
});
