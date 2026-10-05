const React = window.React;
function jsx(type, props, key) {
  return React.createElement(type, key !== undefined ? Object.assign({}, props, { key }) : props);
}
module.exports = { jsx, jsxs: jsx, jsxDEV: jsx, Fragment: React.Fragment };
