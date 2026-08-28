// 完成仪式动画工具：随机动画 + 粒子数据生成

const TYPES = ['confetti', 'stars', 'coffee', 'petals'];

function rand(min, max) {
  return Math.random() * (max - min) + min;
}

function pickIndex(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickAnimation() {
  return pickIndex(TYPES);
}

// 🎊 撒花：彩色纸屑
function makeConfetti(count) {
  const colors = ['#6BCB77', '#FFD93D', '#FF6B6B', '#1E90FF', '#A29BFE', '#FFA502', '#FF9FF3', '#55E6C1'];
  const list = [];
  for (let i = 0; i < count; i++) {
    list.push({
      left: rand(5, 95),
      delay: rand(0, 0.3),
      duration: rand(0.9, 1.4),
      color: pickIndex(colors),
      size: rand(8, 16),
      drift: rand(-60, 60),
      rotate: rand(-180, 180)
    });
  }
  return list;
}

// 🌸 花瓣飘落
function makePetals(count) {
  const colors = ['#FFB3C1', '#FFD6E0', '#FFC4D6', '#F8C8DC', '#FFE0EC'];
  const list = [];
  for (let i = 0; i < count; i++) {
    list.push({
      left: rand(0, 100),
      delay: rand(0, 0.4),
      duration: rand(1, 1.5),
      color: pickIndex(colors),
      size: rand(10, 18),
      drift: rand(-50, 50)
    });
  }
  return list;
}

// ⭐ 星星升起
function makeStars(count) {
  const chars = ['⭐', '✨', '🌟', '💫'];
  const list = [];
  for (let i = 0; i < count; i++) {
    list.push({
      left: rand(20, 80),
      top: rand(20, 55),
      delay: rand(0, 0.3),
      duration: rand(0.8, 1.3),
      char: pickIndex(chars),
      size: rand(30, 46)
    });
  }
  return list;
}

// ☕ 咖啡热气
function makeCoffee(count) {
  const list = [];
  for (let i = 0; i < count; i++) {
    list.push({
      left: rand(35, 65),
      delay: rand(0, 0.35),
      duration: rand(1, 1.5),
      size: rand(8, 20),
      drift: rand(-15, 15)
    });
  }
  return list;
}

function buildAnimation(type) {
  switch (type) {
    case 'confetti':
      return { type, particles: makeConfetti(40) };
    case 'petals':
      return { type, particles: makePetals(22) };
    case 'stars':
      return { type, particles: makeStars(6) };
    case 'coffee':
      return { type, particles: makeCoffee(9) };
    default:
      return { type: 'confetti', particles: makeConfetti(40) };
  }
}

module.exports = {
  TYPES,
  pickAnimation,
  buildAnimation
};
