// pages/add/add.js
const app = getApp();
const storage = require('../../utils/storage');
const colors = require('../../utils/colors');

function pad(n) {
  return n < 10 ? '0' + n : '' + n;
}

function todayStr() {
  const d = new Date();
  return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
}

Page({
  data: {
    theme: 'light',
    themeStyle: '',
    statusBarHeight: 20,

    mode: 'add',
    taskId: '',

    emoji: '📝',
    customEmoji: '',
    title: '',
    dateType: 'none',
    targetDate: '',
    startTime: '09:00',
    endTime: '10:00',
    deadline: '12:00',

    categories: [],
    category: '',
    categoryColor: '',

    note: ''
  },

  onLoad(options = {}) {
    const theme = app.globalData.theme || 'light';
    this.setData({
      theme,
      themeStyle: colors.getThemeStyle(theme),
      statusBarHeight: app.globalData.statusBarHeight || 20,
      targetDate: todayStr(),
      categories: storage.getCategories()
    });

    if (options.task) {
      try {
        const task = JSON.parse(decodeURIComponent(options.task));
        this.setData({
          mode: 'edit',
          taskId: task.id,
          emoji: task.emoji || '📝',
          customEmoji: task.emoji || '',
          title: task.title || '',
          dateType: task.dateType || 'none',
          targetDate: task.targetDate || this.data.targetDate,
          startTime: task.startTime || '09:00',
          endTime: task.endTime || '10:00',
          deadline: task.deadline || '12:00',
          category: task.category || '',
          categoryColor: task.categoryColor || '',
          note: task.note || ''
        });
      } catch (e) {
        /* 参数解析失败则按添加模式 */
      }
    }
  },

  onEmojiChange(e) {
    // 点击预设图标时，同步填入输入框
    this.setData({ emoji: e.detail.emoji, customEmoji: e.detail.emoji });
  },

  onCustomEmojiInput(e) {
    // 手动输入时优先采用输入框内容（取首个字符），预设图标取消高亮
    const chars = Array.from((e.detail.value || '').trim());
    this.setData({ customEmoji: e.detail.value, emoji: chars.length ? chars[0] : '' });
  },

  onTitleInput(e) {
    this.setData({ title: e.detail.value });
  },

  onDateTypeChange(e) {
    this.setData({ dateType: e.currentTarget.dataset.type });
  },

  onDateChange(e) {
    this.setData({ targetDate: e.detail.value });
  },

  onStartTimeChange(e) {
    this.setData({ startTime: e.detail.value });
  },

  onEndTimeChange(e) {
    this.setData({ endTime: e.detail.value });
  },

  onDeadlineChange(e) {
    this.setData({ deadline: e.detail.value });
  },

  onCategoryPick(e) {
    const c = this.data.categories[e.currentTarget.dataset.index];
    if (!c) return;
    this.setData({ category: c.name, categoryColor: c.color });
  },

  onAddCategory() {
    wx.showModal({
      title: '添加新分区',
      editable: true,
      placeholderText: '输入分区名称，如：阅读',
      success: (res) => {
        if (res.confirm && res.content && res.content.trim()) {
          const name = res.content.trim();
          const cats = this.data.categories;
          if (cats.some((c) => c.name === name)) {
            wx.showToast({ title: '该分区已存在', icon: 'none' });
            return;
          }
          const color = colors.nextCategoryColor(cats.map((c) => c.color));
          this.setData({ categories: storage.addCategory(name, color), category: name, categoryColor: color });
          wx.vibrateShort({ type: 'light' });
        }
      }
    });
  },

  onNoteInput(e) {
    this.setData({ note: e.detail.value });
  },

  goBack() {
    wx.navigateBack();
  },

  onCancel() {
    wx.navigateBack();
  },

  onSave() {
    if (!this.data.title.trim()) {
      wx.showToast({ title: '给任务起个名字吧 📝', icon: 'none' });
      return;
    }
    const d = this.data;
    const now = new Date().toISOString();
    const base = {
      emoji: (d.customEmoji.trim() ? Array.from(d.customEmoji.trim())[0] : d.emoji) || '📝',
      title: d.title.trim(),
      dateType: d.dateType,
      targetDate: d.targetDate || todayStr(),
      startTime: d.dateType === 'range' ? d.startTime : null,
      endTime: d.dateType === 'range' ? d.endTime : null,
      deadline: d.dateType === 'deadline' ? d.deadline : null,
      category: d.category,
      categoryColor: d.categoryColor,
      note: d.note.trim()
    };

    if (d.mode === 'edit') {
      const task = storage.getTaskById(d.taskId);
      if (task) {
        storage.updateTask(Object.assign({}, task, base, { updatedAt: now }));
      }
    } else {
      storage.addTask(
        Object.assign(
          {
            id: storage.genId(),
            isCompleted: false,
            completedAt: null,
            mood: null,
            rating: null,
            reviewNote: '',
            createdAt: now,
            updatedAt: now
          },
          base
        )
      );
    }

    wx.vibrateShort({ type: 'light' });
    wx.showToast({ title: d.mode === 'edit' ? '已保存 ✨' : '已创建 ✨', icon: 'none' });
    setTimeout(() => wx.navigateBack(), 320);
  },

  onDelete() {
    wx.showModal({
      title: '删除任务',
      content: '确定要删除这个任务吗？',
      confirmColor: '#FF4757',
      success: (res) => {
        if (res.confirm) {
          storage.deleteTask(this.data.taskId);
          wx.navigateBack();
        }
      }
    });
  }
});
