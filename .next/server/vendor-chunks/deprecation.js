"use strict";
/*
 * ATTENTION: An "eval-source-map" devtool has been used.
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file with attached SourceMaps in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
exports.id = "vendor-chunks/deprecation";
exports.ids = ["vendor-chunks/deprecation"];
exports.modules = {

/***/ "(rsc)/./node_modules/deprecation/dist-web/index.js":
/*!****************************************************!*\
  !*** ./node_modules/deprecation/dist-web/index.js ***!
  \****************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   Deprecation: () => (/* binding */ Deprecation)\n/* harmony export */ });\nclass Deprecation extends Error {\n  constructor(message) {\n    super(message); // Maintains proper stack trace (only available on V8)\n\n    /* istanbul ignore next */\n\n    if (Error.captureStackTrace) {\n      Error.captureStackTrace(this, this.constructor);\n    }\n\n    this.name = 'Deprecation';\n  }\n\n}\n\n\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvLi9ub2RlX21vZHVsZXMvZGVwcmVjYXRpb24vZGlzdC13ZWIvaW5kZXguanMiLCJtYXBwaW5ncyI6Ijs7OztBQUFBO0FBQ0E7QUFDQSxvQkFBb0I7O0FBRXBCOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBOztBQUV1QiIsInNvdXJjZXMiOlsid2VicGFjazovL21hcmtkb3dudmlld2VyYXBwLy4vbm9kZV9tb2R1bGVzL2RlcHJlY2F0aW9uL2Rpc3Qtd2ViL2luZGV4LmpzPzBiZTQiXSwic291cmNlc0NvbnRlbnQiOlsiY2xhc3MgRGVwcmVjYXRpb24gZXh0ZW5kcyBFcnJvciB7XG4gIGNvbnN0cnVjdG9yKG1lc3NhZ2UpIHtcbiAgICBzdXBlcihtZXNzYWdlKTsgLy8gTWFpbnRhaW5zIHByb3BlciBzdGFjayB0cmFjZSAob25seSBhdmFpbGFibGUgb24gVjgpXG5cbiAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqL1xuXG4gICAgaWYgKEVycm9yLmNhcHR1cmVTdGFja1RyYWNlKSB7XG4gICAgICBFcnJvci5jYXB0dXJlU3RhY2tUcmFjZSh0aGlzLCB0aGlzLmNvbnN0cnVjdG9yKTtcbiAgICB9XG5cbiAgICB0aGlzLm5hbWUgPSAnRGVwcmVjYXRpb24nO1xuICB9XG5cbn1cblxuZXhwb3J0IHsgRGVwcmVjYXRpb24gfTtcbiJdLCJuYW1lcyI6W10sInNvdXJjZVJvb3QiOiIifQ==\n//# sourceURL=webpack-internal:///(rsc)/./node_modules/deprecation/dist-web/index.js\n");

/***/ })

};
;