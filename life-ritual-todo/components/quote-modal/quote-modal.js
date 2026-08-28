const quotes = require('../../utils/quotes');

Component({
  properties: {
    visible: { type: Boolean, value: false }
  },
  data: {
    quote: ''
  },
  observers: {
    visible(v) {
      if (v) {
        this.setData({ quote: quotes[Math.floor(Math.random() * quotes.length)] });
      }
    }
  },
  methods: {
    onClose() {
      this.triggerEvent('close');
    },
    onStart() {
      this.triggerEvent('start');
    },
    noop() {}
  }
});
