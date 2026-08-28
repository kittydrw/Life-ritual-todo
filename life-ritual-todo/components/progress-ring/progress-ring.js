Component({
  properties: {
    percent: { type: Number, value: 0 },
    size: { type: Number, value: 220 },
    color: { type: String, value: 'var(--primary)' },
    stroke: { type: Number, value: 16 }
  },
  data: {
    innerSize: 188,
    clamped: 0
  },
  observers: {
    'size, stroke': function (size, stroke) {
      this.setData({ innerSize: Math.max(size - stroke * 2, 20) });
    },
    percent: function (p) {
      let v = Number(p) || 0;
      if (v < 0) v = 0;
      if (v > 100) v = 100;
      if (v !== this.data.clamped) this.setData({ clamped: v });
    }
  },
  lifetimes: {
    attached() {
      const p = this.properties.percent || 0;
      this.setData({
        innerSize: Math.max(this.properties.size - this.properties.stroke * 2, 20),
        clamped: Math.max(0, Math.min(100, p))
      });
    }
  }
});
