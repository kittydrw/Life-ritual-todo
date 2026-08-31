// pages/review/review.js
const app = getApp();
const storage = require('../../utils/storage');
const colors = require('../../utils/colors');

const WEEKDAYS_CN = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

function pad(n) {
  return n < 10 ? '0' + n : '' + n;
}

function fmtDate(d) {
  return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
}

function parseDate(s) {
  return new Date(s + 'T00:00:00');
}

// ISO 周数（周一为一周开始）
function isoWeekNumber(d) {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  return Math.ceil(((date - yearStart) / 86400000 + 1) / 7);
}

Page({
  data: {
    theme: 'light',
    themeStyle: '',
    statusBarHeight: 20,

    weekStart: '',
    weekEnd: '',
    weekLabel: '',
    isCurrentWeek: true,
    today: '',

    mode: 'completed', // 'completed' | 'all'
    stats: { total: 0, done: 0, rate: 0, streak: 0 },
    days: [],
    hasAny: false,
    saving: false
  },

  onLoad() {
    const theme = app.globalData.theme || 'light';
    this.setData({
      theme,
      themeStyle: colors.getThemeStyle(theme),
      statusBarHeight: app.globalData.statusBarHeight || 20,
      today: fmtDate(new Date()),
      weekStart: this.getMonday(new Date())
    });
    this.reload();
  },

  getMonday(d) {
    const day = (d.getDay() + 6) % 7;
    const m = new Date(d);
    m.setDate(m.getDate() - day);
    return fmtDate(m);
  },

  goBack() {
    wx.navigateBack();
  },

  shiftWeek(e) {
    const dir = Number(e.currentTarget.dataset.dir);
    const s = parseDate(this.data.weekStart);
    s.setDate(s.getDate() + dir * 7);
    this.setData({ weekStart: fmtDate(s) });
    this.reload();
  },

  backToThisWeek() {
    this.setData({ weekStart: this.getMonday(new Date()) });
    this.reload();
  },

  onModeChange(e) {
    this.setData({ mode: e.currentTarget.dataset.mode });
    this.reload();
  },

  reload() {
    const weekStart = this.data.weekStart;
    const s = parseDate(weekStart);
    const e = new Date(s);
    e.setDate(e.getDate() + 6);
    const weekEnd = fmtDate(e);
    const weekNo = isoWeekNumber(s);
    const year = s.getFullYear();
    const today = this.data.today;
    const isCurrentWeek = weekStart <= today && today <= weekEnd;

    const all = storage.getTasks();
    const inWeek = all.filter((t) => t.targetDate >= weekStart && t.targetDate <= weekEnd);
    const mode = this.data.mode;
    const shown = inWeek.filter((t) => (mode === 'completed' ? t.isCompleted : true));

    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(s);
      d.setDate(d.getDate() + i);
      const ds = fmtDate(d);
      let tasks = shown.filter((t) => t.targetDate === ds);
      tasks = tasks.sort((a, b) => {
        const key = mode === 'completed' ? 'completedAt' : 'createdAt';
        return ((b[key] || '') + '').localeCompare((a[key] || '') + '');
      });
      days.push({
        date: ds,
        label: WEEKDAYS_CN[d.getDay()],
        dayNum: (d.getMonth() + 1) + '/' + d.getDate(),
        tasks
      });
    }

    const done = inWeek.filter((t) => t.isCompleted).length;
    const total = inWeek.length;
    const rate = total ? Math.round((done / total) * 100) : 0;
    const streak = this.calcStreak(all, today);

    this.setData({
      weekEnd,
      weekLabel: year + '年第' + weekNo + '周',
      isCurrentWeek,
      days,
      stats: { total, done, rate, streak },
      hasAny: shown.length > 0
    });
  },

  // 连续打卡天数：从今天（或昨天）向前数连续有完成任务的天数
  calcStreak(tasks, todayStr) {
    const hasDone = (ds) => tasks.some((t) => t.targetDate === ds && t.isCompleted);
    let cursor = parseDate(todayStr);
    if (!hasDone(todayStr)) cursor.setDate(cursor.getDate() - 1);
    let streak = 0;
    while (streak < 365 && hasDone(fmtDate(cursor))) {
      streak++;
      cursor.setDate(cursor.getDate() - 1);
    }
    return streak;
  },

  // ---- 分享卡片 ----
  onShare() {
    if (this.data.saving) return;
    this.setData({ saving: true });
    wx.showLoading({ title: '生成卡片中…', mask: true });
    const query = wx.createSelectorQuery();
    query.select('#shareCanvas').fields({ node: true, size: true }).exec((res) => {
      if (!res || !res[0] || !res[0].node) {
        wx.hideLoading();
        this.setData({ saving: false });
        wx.showToast({ title: '生成失败，请重试', icon: 'none' });
        return;
      }
      try {
        this.drawCard(res[0].node);
      } catch (err) {
        wx.hideLoading();
        this.setData({ saving: false });
        wx.showToast({ title: '生成失败，请重试', icon: 'none' });
      }
    });
  },

  collectRows() {
    const rows = [];
    for (let i = 0; i < this.data.days.length; i++) {
      const d = this.data.days[i];
      for (let j = 0; j < d.tasks.length; j++) {
        const t = d.tasks[j];
        rows.push({
          emoji: t.emoji,
          title: t.title,
          date: d.dayNum,
          done: t.isCompleted
        });
      }
    }
    return rows;
  },

  roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  },

  drawCard(canvas) {
    const ctx = canvas.getContext('2d');
    // 分享卡片使用全局固定字体（圆润柔和）
    const cardFont = '"PingFang SC", "Microsoft YaHei", "Noto Sans SC", sans-serif';
    const info = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync();
    const dpr = info.pixelRatio || 2;
    const W = 600;
    const H = 960;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.scale(dpr, dpr);

    // 背景
    this.roundRect(ctx, 0, 0, W, H, 0);
    ctx.fillStyle = '#F7F9F2';
    ctx.fill();

    // 装饰圆点
    ctx.globalAlpha = 0.14;
    ctx.fillStyle = '#6BCB77';
    ctx.beginPath();
    ctx.arc(540, 90, 46, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(66, 108, 26, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;

    // 标题
    ctx.fillStyle = '#2D3436';
    ctx.font = '46px ' + cardFont;
    ctx.textAlign = 'center';
    ctx.fillText(this.data.weekLabel + '回顾', W / 2, 112);

    // 日期范围
    ctx.font = '24px sans-serif';
    ctx.fillStyle = '#636E72';
    ctx.fillText(this.data.weekStart + ' ~ ' + this.data.weekEnd, W / 2, 158);

    // 统计
    const stats = this.data.stats;
    ctx.font = '26px sans-serif';
    ctx.fillStyle = '#2D3436';
    ctx.fillText('完成 ' + stats.done + ' 项 · 完成率 ' + stats.rate + '% · 连续 ' + stats.streak + ' 天', W / 2, 208);

    // 任务列表
    const rows = this.collectRows();
    let y = 254;
    ctx.textAlign = 'left';   
    if (!rows.length) {
      ctx.fillStyle = '#A8B0AE';
      ctx.font = '28px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('这一周还没有任务记录 🌿', W / 2, y + 40);
      ctx.textAlign = 'left';
    } else {
      const maxRows = 13;
      const list = rows.slice(0, maxRows);
      for (let i = 0; i < list.length; i++) {
        const row = list[i];
        if (y > H - 120) break;

        // 复选框
        ctx.beginPath();
        ctx.arc(48, y + 15, 14, 0, Math.PI * 2);
        if (row.done) {
          ctx.fillStyle = '#6BCB77';
          ctx.fill();
        }
        ctx.strokeStyle = row.done ? '#6BCB77' : '#A8B0AE';
        ctx.stroke();
        if (row.done) {
          ctx.fillStyle = '#FFFFFF';
          ctx.font = '18px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('✓', 48, y + 20);
          ctx.textAlign = 'left';
        }

        // 标题（截断）
        ctx.font = '26px sans-serif';
        ctx.fillStyle = row.done ? '#A8B0AE' : '#2D3436';
        let t = row.emoji + ' ' + row.title;
        if (ctx.measureText(t).width > 380) {
          while (t.length > 2 && ctx.measureText(t + '…').width > 380) t = t.slice(0, -1);
          t += '…';
        }
        ctx.fillText(t, 76, y + 20);

        // 完成划线
        if (row.done) {
          const tw = ctx.measureText(t).width;
          ctx.strokeStyle = '#A8B0AE';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(76, y + 12);
          ctx.lineTo(76 + tw, y + 12);
          ctx.stroke();
        }

        // 日期
        ctx.font = '22px sans-serif';
        ctx.fillStyle = '#A8B0AE';
        ctx.textAlign = 'right';
        ctx.fillText(row.date, W - 40, y + 20);
        ctx.textAlign = 'left';

        y += 52;
      }

      if (rows.length > maxRows) {
        ctx.fillStyle = '#A8B0AE';
        ctx.font = '24px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('…… 还有 ' + (rows.length - maxRows) + ' 项', W / 2, y + 8);
      }
    }

    // 底部落款
    ctx.fillStyle = '#B8C4BC';
    ctx.font = '22px ' + cardFont;
    ctx.textAlign = 'center';
    ctx.fillText('— 生活仪式感 · 记录认真生活的每一天 —', W / 2, H - 36);

    // 导出图片
    wx.canvasToTempFilePath({
      canvas,
      success: (res) => {
        wx.hideLoading();
        this.setData({ saving: false });
        this.saveToAlbum(res.tempFilePath);
      },
      fail: () => {
        wx.hideLoading();
        this.setData({ saving: false });
        wx.showToast({ title: '生成失败，请重试', icon: 'none' });
      }
    });
  },

  saveToAlbum(filePath) {
    wx.saveImageToPhotosAlbum({
      filePath,
      success: () => {
        wx.showToast({ title: '已保存到相册 📷', icon: 'none' });
      },
      fail: (err) => {
        if (err.errMsg && err.errMsg.indexOf('auth') > -1) {
          wx.showModal({
            title: '需要相册权限',
            content: '请在设置中开启「保存到相册」权限',
            confirmText: '去设置',
            success: (res) => {
              if (res.confirm) wx.openSetting();
            }
          });
        } else {
          wx.showToast({ title: '保存失败', icon: 'none' });
        }
      }
    });
  }
});
