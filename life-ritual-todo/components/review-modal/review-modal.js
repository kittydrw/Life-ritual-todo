const MOODS = ['😊', '😤', '😴', '😌', '🤗', '😅'];

Component({
  properties: {
    visible: { type: Boolean, value: false },
    task: { type: Object, value: null }
  },
  data: {
    moods: MOODS,
    mood: '',
    rating: 0,
    note: ''
  },
  observers: {
    visible(v) {
      if (v) {
        const t = this.properties.task;
        this.setData({
          mood: (t && t.mood) || '',
          rating: (t && t.rating) || 0,
          note: ''
        });
      }
    }
  },
  methods: {
    onPickMood(e) {
      this.setData({ mood: e.currentTarget.dataset.mood });
    },
    onPickStar(e) {
      this.setData({ rating: Number(e.currentTarget.dataset.star) });
    },
    onNoteInput(e) {
      this.setData({ note: e.detail.value });
    },
    onSubmit() {
      this.triggerEvent('submit', {
        mood: this.data.mood,
        rating: this.data.rating,
        note: this.data.note
      });
    },
    onSkip() {
      this.triggerEvent('skip');
    },
    noop() {}
  }
});
