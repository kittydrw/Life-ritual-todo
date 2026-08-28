// 显式数组定义，避免 split('') 拆分 UTF-16 代理对导致部分 Emoji 显示异常
const DEFAULT_EMOJIS = ['📝', '💼', '🏋️', '🩺', '📚', '🎯', '💡', '🎨', '🚀', '💪', '🧘', '🍽️', '📅', '☕', '🏠', '❤️', '⭐', '🔥', '🌸', '🌈', '🎉', '🎈', '🎁', '🎀', '🥇', '🏆', '🎵', '🎶', '✏️', '📖', '🧠', '🌿'];

Component({
  properties: {
    value: { type: String, value: '' },
    list: { type: Array, value: [] }
  },
  data: {
    emojis: DEFAULT_EMOJIS
  },
  lifetimes: {
    attached() {
      const l = this.properties.list;
      if (l && l.length) this.setData({ emojis: l });
    }
  },
  methods: {
    onPick(e) {
      const emoji = e.currentTarget.dataset.emoji;
      this.triggerEvent('change', { emoji });
    }
  }
});
