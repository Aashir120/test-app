import { createHash } from "crypto";
import type { NodePath, PluginObj } from "@babel/core";
import type * as t from "@babel/types";

interface BabelState {
  file: { opts: { filename?: string } };
}

export default function fragmentMapperPlugin({
  types,
}: {
  types: typeof t;
}): PluginObj<BabelState> {
  return {
    name: "fragment-mapper-plugin",
    visitor: {
      JSXOpeningElement(path: NodePath<t.JSXOpeningElement>, state: BabelState) {
        const filename = state.file.opts.filename || "unknown";
        const filePath = filename.replace(process.cwd(), "").replace(/\\/g, "/");

        const line = path.node.loc?.start?.line ?? 0;
        const column = path.node.loc?.start?.column ?? 0;

        const hash = createHash("md5")
          .update(filePath + line + column + path.node.name?.type)
          .digest("hex")
          .slice(0, 8);

        const hasAttr = (name: string) =>
          path.node.attributes.some(
            (a) =>
              a.type === "JSXAttribute" &&
              a.name?.type === "JSXIdentifier" &&
              a.name.name === name
          );

        if (!hasAttr("data-fragment-id")) {
          path.node.attributes.push(
            types.jsxAttribute(
              types.jsxIdentifier("data-fragment-id"),
              types.stringLiteral(`frag-${hash}`)
            )
          );
        }

        if (!hasAttr("data-filepath")) {
          // include line + column in path for precision
          const fullPath = `${filePath}:${line}:${column}`;
          path.node.attributes.push(
            types.jsxAttribute(
              types.jsxIdentifier("data-filepath"),
              types.stringLiteral(fullPath)
            )
          );
        }

        if (!hasAttr("data-filename")) {
          const fileName = filePath.split("/").pop() || "";
          path.node.attributes.push(
            types.jsxAttribute(
              types.jsxIdentifier("data-filename"),
              types.stringLiteral(fileName)
            )
          );
        }

        // ✅ optional: include line metadata separately
        if (!hasAttr("data-line")) {
          path.node.attributes.push(
            types.jsxAttribute(
              types.jsxIdentifier("data-line"),
              types.stringLiteral(String(line))
            )
          );
        }
      },
    },
  };
}
