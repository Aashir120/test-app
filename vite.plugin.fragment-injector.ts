import type { Plugin } from "vite";
import { createRequire } from "module";
import fragmentMapperPlugin from "./joylo-fragment-mapper";

const require = createRequire(import.meta.url);
const babel = require("@babel/core");

export default function fragmentInjector(): Plugin {
  return {
    name: "fragment-injector",
    enforce: "pre",
    async transform(code, id) {
      if (!id.endsWith(".tsx") && !id.endsWith(".jsx")) return null;

      const result = babel.transformSync(code, {
        filename: id,
        presets: [
          [
            "@babel/preset-typescript",
            { isTSX: true, allExtensions: true, allowDeclareFields: true },
          ],
          [
            "@babel/preset-react",
            {
              runtime: "automatic", // ✅ use modern JSX runtime
              importSource: "react",
              development: process.env.NODE_ENV !== "production",
            },
          ],
        ],
        plugins: [fragmentMapperPlugin],
        babelrc: false,
        configFile: false,
      });

      if (!result?.code) return null;
      return { code: result.code, map: result.map };
    },
  };
}
