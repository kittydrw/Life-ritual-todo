const OPEN_OFFSET = 80; // 滑动露出删除按钮的偏移量（px）

Component({
  properties: {
    task: { type: Object, value: null },
    today: { type: String, value: '' }
  },
  data: {
    offsetX: 0,
    dragging: false,
    timeText: '',
    starsText: '',
    overdue: false
  },
  observers: {
    task(task) {
      this.compute(task);
    }
  },
  lifetimes: {
    attached() {
      this.compute(this.properties.task);
    }
  },
  methods: {
    compute(task) {
      if (!task) return;
      const today = this.properties.today;
      let timeText = '';
      if (task.dateType === 'range' && task.startTime && task.endTime) {
        timeText = task.startTime + '-' + task.endTime;
      } else if (task.dateType === 'deadline' && task.deadline) {
        timeText = '截止' + this.dateLabel(task.targetDate) + ' ' + task.deadline;
      }
      const overdue = !task.isCompleted && !!today && !!task.targetDate && task.targetDate < today;
      const starsText = task.rating ? '⭐'.repeat(task.rating) : '';
      this.setData({ timeText, starsText, overdue });
    },
    dateLabel(dateStr) {
      const today = this.properties.today;
      if (!dateStr) return '';
      if (dateStr === today) return '今天';
      const t = new Date(today + 'T00:00:00');
      t.setDate(t.getDate() + 1);
      if (dateStr === this.fmt(t)) return '明天';
      const d = new Date(dateStr + 'T00:00:00');
      return (d.getMonth() + 1) + '月' + d.getDate() + '日';
    },
    fmt(d) {
      const m = d.getMonth() + 1;
      const day = d.getDate();
      return d.getFullYear() + '-' + (m < 10 ? '0' + m : m) + '-' + (day < 10 ? '0' + day : day);
    },
    onTouchStart(e) {
      this.startX = e.touches[0].clientX;
      this.startY = e.touches[0].clientY;
      this.startOffset = this.data.offsetX;
      this.axis = '';
      this.setData({ dragging: true });
    },
    onTouchMove(e) {
      const dx = e.touches[0].clientX - this.startX;
      const dy = e.touches[0].clientY - this.startY;
      if (!this.axis) this.axis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
      if (this.axis !== 'x') return;
      let offset = this.startOffset + dx;
      offset = Math.max(-OPEN_OFFSET, Math.min(0, offset));
      if (offset !== this.data.offsetX) this.setData({ offsetX: offset });
    },
    onTouchEnd() {
      const open = this.data.offsetX < -OPEN_OFFSET / 2;
      this.setData({ offsetX: open ? -OPEN_OFFSET : 0, dragging: false });
    },
    onToggleDone() {
      this.triggerEvent('toggle', { id: this.properties.task.id });
    },
    onCardTap() {
      if (this.data.offsetX < 0) {
        this.setData({ offsetX: 0 });
        return;
      }
      this.triggerEvent('edit', { id: this.properties.task.id });
    },
    onDeleteTap() {
      this.triggerEvent('delete', { id: this.properties.task.id });
    },
    noop() {}
  }
});
