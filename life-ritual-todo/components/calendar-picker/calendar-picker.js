// components/calendar-picker/calendar-picker.js
const storage = require('../../utils/storage');

function pad(n) {
  return n < 10 ? '0' + n : '' + n;
}

function fmtDate(d) {
  return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
}

Component({
  properties: {
    visible: {
      type: Boolean,
      value: false
    },
    selectedDate: {
      type: String,
      value: ''
    }
  },

  data: {
    year: 0,
    month: 0,
    weekDays: ['日', '一', '二', '三', '四', '五', '六'],
    dates: [],
    tempSelected: '',
    closing: false,
    lastVisible: false
  },

  observers: {
    'visible, selectedDate': function (visible) {
      // 仅当面板从关闭变为打开时初始化，避免选中回调导致的重复刷新
      if (visible && !this.data.lastVisible) {
        this.open(this.data.selectedDate);
      }
      this.setData({ lastVisible: visible });
    }
  },

  methods: {
    open(dateStr) {
      const d = dateStr ? new Date(dateStr + 'T00:00:00') : new Date();
      if (isNaN(d.getTime())) return;
      this.setData({
        year: d.getFullYear(),
        month: d.getMonth() + 1,
        tempSelected: dateStr || '',
        closing: false
      });
      this.generateDates(d.getFullYear(), d.getMonth() + 1);
    },

    generateDates(year, month) {
      const firstDay = new Date(year, month - 1, 1).getDay();
      const daysInMonth = new Date(year, month, 0).getDate();
      const daysInPrev = new Date(year, month - 1, 0).getDate();
      const today = fmtDate(new Date());
      const selected = this.data.tempSelected || this.data.selectedDate;
      const taskDates = new Set(storage.getTasks().map((t) => t.targetDate));

      const dates = [];

      // 上月末尾补齐（使本月 1 号对齐星期）
      for (let i = firstDay - 1; i >= 0; i--) {
        const day = daysInPrev - i;
        const ds = fmtDate(new Date(year, month - 2, day));
        dates.push({
          day: day,
          date: ds,
          isCurrentMonth: false,
          isToday: false,
          isSelected: ds === selected,
          hasTask: taskDates.has(ds)
        });
      }

      // 本月
      for (let i = 1; i <= daysInMonth; i++) {
        const ds = fmtDate(new Date(year, month - 1, i));
        dates.push({
          day: i,
          date: ds,
          isCurrentMonth: true,
          isToday: ds === today,
          isSelected: ds === selected,
          hasTask: taskDates.has(ds)
        });
      }

      // 下月开头补齐（保持 6 行 42 格）
      const remaining = 42 - dates.length;
      for (let i = 1; i <= remaining; i++) {
        const ds = fmtDate(new Date(year, month, i));
        dates.push({
          day: i,
          date: ds,
          isCurrentMonth: false,
          isToday: false,
          isSelected: ds === selected,
          hasTask: taskDates.has(ds)
        });
      }

      this.setData({ dates });
    },

    prevMonth() {
      let { year, month } = this.data;
      if (month === 1) {
        year--;
        month = 12;
      } else {
        month--;
      }
      this.setData({ year, month });
      this.generateDates(year, month);
    },

    nextMonth() {
      let { year, month } = this.data;
      if (month === 12) {
        year++;
        month = 1;
      } else {
        month++;
      }
      this.setData({ year, month });
      this.generateDates(year, month);
    },

    goToday() {
      const d = new Date();
      const year = d.getFullYear();
      const month = d.getMonth() + 1;
      this.setData({ year, month, tempSelected: fmtDate(d) });
      this.generateDates(year, month);
    },

    selectDate(e) {
      const date = e.currentTarget.dataset.date;
      const clicked = this.data.dates.find((d) => d.date === date);
      const dates = this.data.dates.map((item) =>
        Object.assign({}, item, { isSelected: item.date === date })
      );
      this.setData({ dates, tempSelected: date });

      // 点击非当月日期：自动切换到对应月份并保持选中
      if (clicked && !clicked.isCurrentMonth) {
        const d = new Date(date + 'T00:00:00');
        this.setData({ year: d.getFullYear(), month: d.getMonth() + 1 });
        this.generateDates(d.getFullYear(), d.getMonth() + 1);
      }
    },

    onConfirm() {
      const selected = this.data.tempSelected || this.data.selectedDate;
      if (selected) {
        this.triggerEvent('select', { date: selected });
      }
      this.animateClose();
    },

    onCloseTap() {
      this.animateClose();
    },

    onMaskTap(e) {
      if (e.target === e.currentTarget) {
        this.animateClose();
      }
    },

    noop() {},

    animateClose() {
      this.setData({ closing: true });
      setTimeout(() => {
        this.triggerEvent('close');
      }, 240);
    }
  }
});
