// 数据读写封装
const { DEFAULT_CATEGORIES } = require('./colors');

const TASKS_KEY = 'ritual_tasks';
const CATEGORIES_KEY = 'ritual_categories';
const LAST_OPEN_KEY = 'ritual_last_open_date';

function getTasks() {
  return wx.getStorageSync(TASKS_KEY) || [];
}

function saveTasks(tasks) {
  wx.setStorageSync(TASKS_KEY, tasks);
}

function getTaskById(id) {
  return getTasks().find((t) => t.id === id) || null;
}

function addTask(task) {
  const tasks = getTasks();
  tasks.unshift(task);
  saveTasks(tasks);
}

function updateTask(updated) {
  const tasks = getTasks().map((t) => (t.id === updated.id ? updated : t));
  saveTasks(tasks);
}

function deleteTask(id) {
  const tasks = getTasks().filter((t) => t.id !== id);
  saveTasks(tasks);
}

function getCategories() {
  const stored = wx.getStorageSync(CATEGORIES_KEY);
  return stored && stored.length ? stored : DEFAULT_CATEGORIES.slice();
}

function saveCategories(categories) {
  wx.setStorageSync(CATEGORIES_KEY, categories);
}

function addCategory(name, color) {
  const cats = getCategories();
  cats.push({ name, color });
  saveCategories(cats);
  return cats;
}

function getLastOpenDate() {
  return wx.getStorageSync(LAST_OPEN_KEY) || '';
}

function setLastOpenDate(date) {
  wx.setStorageSync(LAST_OPEN_KEY, date);
}

function getTheme() {
  return wx.getStorageSync('theme') || 'light';
}

function saveTheme(theme) {
  wx.setStorageSync('theme', theme);
}

// 生成唯一 ID
function genId() {
  return 't_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
}

module.exports = {
  getTasks,
  saveTasks,
  getTaskById,
  addTask,
  updateTask,
  deleteTask,
  getCategories,
  saveCategories,
  addCategory,
  getLastOpenDate,
  setLastOpenDate,
  getTheme,
  saveTheme,
  genId
};
