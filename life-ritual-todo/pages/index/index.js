// pages/index/index.js
const app = getApp();
const storage = require('../../utils/storage');
const colors = require('../../utils/colors');
const quotes = require('../../utils/quotes');
const { pickAnimation, buildAnimation } = require('../../utils/animation');

const WEEKDAYS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

function pad(n) {
  return n < 10 ? '0' + n : '' + n;
}

function fmtDate(d) {
  return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
}
// 取出任务的"排序时间点"，用于待办列表按截止/结束时间从早到晚排
function sortTimeOf(task) {
  // 截止任务：日期 + 当天截止时间，拼成 'YYYY-MM-DD HH:MM'
  if (task.dateType === 'deadline' && task.targetDate && task.deadline) {
    return task.targetDate + ' ' + task.deadline;
  }
  // 区间任务：用"结束时间"（startTime 不管，只看结束）
  if (task.dateType === 'range' && task.targetDate && task.endTime) {
    return task.targetDate + ' ' + task.endTime;
  }
  // 无时间（none 类型）：返回一个超大值，永远排到最后
  return '9999-12-31 23:59';
}

Page({
  data: {
    theme: 'light',
    themeStyle: '',
    statusBarHeight: 20,

    dateText: '',
    greeting: '',
    today: '',

    selectedDate: '',
    selectedDateText: '',
    isToday: true,
    progressTitle: '今日进度',
    calendarVisible: false,

    doneToday: 0,
    totalToday: 0,
    percent: 0,

    groups: [],
    hasAny: false,
    collapsed: { active: false, completed: false },

    quoteVisible: false,
    quote: '',

    reviewVisible: false,
    reviewTask: null,

    showAnimation: false,
    animation: null
  },

  onLoad() {
    const theme = app.globalData.theme || 'light';
    this.setData({
      theme,
      themeStyle: colors.getThemeStyle(theme),
      statusBarHeight: app.globalData.statusBarHeight || 20
    });
    this.initDate();
  },

  onShow() {
    this.reload();
    this.checkDailyQuote();
  },

  initDate() {
    const now = new Date();
    const today = fmtDate(now);

    const hour = now.getHours();
    let greeting = '早上好 ☀️';
    if (hour >= 12 && hour < 18) greeting = '下午好 🌤️';
    else if (hour >= 18) greeting = '晚上好 🌙';

    this.setData({
      today,
      selectedDate: today,
      selectedDateText: this.formatDateText(today),
      isToday: true,
      dateText: (now.getMonth() + 1) + '月' + now.getDate() + '日 · ' + WEEKDAYS[now.getDay()],
      greeting
    });
  },

  formatDateText(dateStr) {
    const d = new Date(dateStr + 'T00:00:00');
    return d.getFullYear() + '年' + (d.getMonth() + 1) + '月' + d.getDate() + '日 ' + WEEKDAYS[d.getDay()];
  },

  setSelectedDate(dateStr) {
    this.setData({
      selectedDate: dateStr,
      selectedDateText: this.formatDateText(dateStr)
    });
    this.reload();
  },

  onPrevDay() {
    const d = new Date(this.data.selectedDate + 'T00:00:00');
    d.setDate(d.getDate() - 1);
    this.setSelectedDate(fmtDate(d));
  },

  onNextDay() {
    const d = new Date(this.data.selectedDate + 'T00:00:00');
    d.setDate(d.getDate() + 1);
    this.setSelectedDate(fmtDate(d));
  },

  onBackToday() {
    this.setSelectedDate(this.data.today);
  },

  // ---- 日历选择（点击顶部日期触发） ----
  showCalendar() {
    this.setData({ calendarVisible: true });
  },

  onDateSelected(e) {
    const date = e.detail.date;
    if (date) {
      this.setSelectedDate(date);
    }
  },

  onCalendarClose() {
    this.setData({ calendarVisible: false });
  },

  // 每日首次打开弹语录
  checkDailyQuote() {
    const last = storage.getLastOpenDate();
    if (last !== this.data.today) {
      storage.setLastOpenDate(this.data.today);
      this.setData({
        quoteVisible: true,
        quote: quotes[Math.floor(Math.random() * quotes.length)]
      });
    }
  },

  reload() {
    const tasks = storage.getTasks();
    const sel = this.data.selectedDate || this.data.today;
    const today = this.data.today;
    const isToday = sel === today;
    const selText = this.formatDateText(sel);

    // 仅筛选所选日期当天的任务（已完成 + 未完成）
    const dayTasks = tasks.filter((t) => t.targetDate === sel);

    // 未完成：逾期优先，其余按创建时间倒序
    const activeTasks = dayTasks
      .filter((t) => !t.isCompleted)
      .sort((a, b) => {
        const ta = sortTimeOf(a);
        const tb = sortTimeOf(b);
        // 'YYYY-MM-DD HH:MM' 格式一致时，字符串字典序 = 时间先后序，早的在前
        if (ta !== tb) return ta < tb ? -1 : 1;
        // 时间完全相同，则新创建的任务排前（沿用原行为，最小化变化）
        return (b.createdAt || '').localeCompare(a.createdAt || '');
      });
      
    const completedTasks = dayTasks
      .filter((t) => t.isCompleted)
      .sort((a, b) => ((b.completedAt || '') + '').localeCompare((a.completedAt || '') + ''));

    const groups = [
      { key: 'active', label: isToday ? '今天' : selText, tasks: activeTasks },
      { key: 'completed', label: '已完成', tasks: completedTasks }
    ].map((g) => Object.assign({ count: g.tasks.length }, g));

    const totalToday = dayTasks.length;
    const doneToday = completedTasks.length;
    const percent = totalToday ? Math.round((doneToday / totalToday) * 100) : 0;

    this.setData({
      groups,
      hasAny: dayTasks.length > 0,
      totalToday,
      doneToday,
      percent,
      isToday,
      progressTitle: isToday ? '今日进度' : '当日进度'
    });
  },

  toggleGroup(e) {
    const key = e.currentTarget.dataset.key;
    const collapsed = Object.assign({}, this.data.collapsed);
    collapsed[key] = !collapsed[key];
    this.setData({ collapsed });
  },

  // ---- 任务交互 ----
  onToggleTask(e) {
    const { id } = e.detail;
    const task = storage.getTaskById(id);
    if (!task) return;

    wx.vibrateShort({ type: 'light' });

    if (!task.isCompleted) {
      // 完成
      task.isCompleted = true;
      task.completedAt = new Date().toISOString();
      storage.updateTask(task);
      this.playCompletionAnimation();
      wx.showToast({ title: '完成仪式 ✨ 今天的你也很棒！', icon: 'none', duration: 1800 });
      this.reload();
      // 弹出复盘
      setTimeout(() => {
        this.setData({ reviewVisible: true, reviewTask: task });
      }, 420);
    } else {
      // 取消完成
      task.isCompleted = false;
      task.completedAt = null;
      storage.updateTask(task);
      this.reload();
    }
  },

  onEditTask(e) {
    const { id } = e.detail;
    const task = storage.getTaskById(id);
    if (!task) return;
    const url = '/pages/add/add?task=' + encodeURIComponent(JSON.stringify(task));
    wx.navigateTo({ url });
  },

  onDeleteTask(e) {
    const { id } = e.detail;
    storage.deleteTask(id);
    wx.vibrateShort({ type: 'light' });
    wx.showToast({ title: '已删除 🗑️', icon: 'none' });
    this.reload();
  },

  // ---- 复盘 ----
  onReviewSubmit(e) {
    const { mood, rating, note } = e.detail;
    const task = storage.getTaskById(this.data.reviewTask.id);
    if (task) {
      task.mood = mood;
      task.rating = rating;
      task.reviewNote = note;
      task.updatedAt = new Date().toISOString();
      storage.updateTask(task);
      this.reload();
    }
    this.setData({ reviewVisible: false, reviewTask: null });
    if (rating > 0) wx.showToast({ title: '复盘完成 🌿', icon: 'none' });
  },

  onReviewSkip() {
    this.setData({ reviewVisible: false, reviewTask: null });
  },

  // ---- 完成仪式动画 ----
  playCompletionAnimation() {
    const anim = buildAnimation(pickAnimation());
    this.setData({ showAnimation: true, animation: anim });
    setTimeout(() => {
      this.setData({ showAnimation: false, animation: null });
    }, 1500);
  },

  // ---- 语录 ----
  onQuoteClose() {
    this.setData({ quoteVisible: false });
  },

  onQuoteStart() {
    this.setData({ quoteVisible: false });
  },

  // ---- 导航 ----
  goAdd() {
    // 把当前所在日期页面的 selectedDate 作为新任务默认日期传过去
    // selectedDate 在 8/31 页面就是 '2026-08-31'，在"今天"页面就是今天
    wx.navigateTo({ url: '/pages/add/add?date=' + this.data.selectedDate });
  },

  goReview() {
    wx.navigateTo({ url: '/pages/review/review' });
  },

  onToggleTheme() {
    const theme = this.data.theme === 'light' ? 'dark' : 'light';
    storage.saveTheme(theme);
    app.setTheme(theme);
    wx.vibrateShort({ type: 'light' });
    this.setData({ theme, themeStyle: colors.getThemeStyle(theme) });
  }
});
