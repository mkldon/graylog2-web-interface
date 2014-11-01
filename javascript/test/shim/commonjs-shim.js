// very bad hack to allow loading of common js modules without such a module system - used for tests only
// TODO: come up with something more robust
window.module = {};
window.module.exports = {};
window.exports = window.module.exports;

function require(moduleName) {
    if (moduleName === 'immutable') {
        return universalModule();
    }
}