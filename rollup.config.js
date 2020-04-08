var uglify = require("rollup-plugin-terser").terser;
var pkg = require("./package.json");
var resolve = require("rollup-plugin-node-resolve");

/* prettier-ignore */
var banner = "//  Perfecto v" + pkg.version + "\n" +
  "//  https://github.com/karevn/perfecto\n" +
  "//  (c) 2017-" + new Date().getFullYear() + " Nikolay Karev\n" +
  "//  Perfecto may be freely distributed under the MIT license.\n";

var input = "src/index.js";

var config = {
  input: input,
  output: {
    format: "umd",
    name: "R",
    exports: "named",
    banner: banner
  },
  plugins: [
    resolve({
      browser: true,
      main: true,
      extensions: [".js"]
    })
  ]
};

if (process.env.NODE_ENV === "production") {
  config.plugins.push(
    uglify({
      compress: {
        pure_getters: true,
        unsafe: true,
        unsafe_comps: true,
        warnings: false
      }
    })
  );
}

module.exports = config;
