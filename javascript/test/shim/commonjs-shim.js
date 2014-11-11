// XXX: hack to allow loading of common js modules without such a module system - used for tests only
window.module = {};
window.module.exports = {};
window.exports = window.module.exports;