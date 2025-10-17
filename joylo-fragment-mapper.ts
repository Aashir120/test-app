/// <reference types="node" />
import { createHash } from "crypto";
import type { NodePath, PluginObj } from "@babel/core";
import type * as t from "@babel/types";

interface BabelState {
  file: {
    opts: {
      filename?: string;
    };
  };
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

        // Compute a short stable hash per element (file + line + tag)
        const hash = createHash("md5")
          .update(filePath + (path.node.loc?.start?.line ?? 0) + path.node.name?.type)
          .digest("hex")
          .slice(0, 8);

        // Helper to check if attribute already exists
        const hasAttr = (name: string) =>
          path.node.attributes.some(
            (a) =>
              a.type === "JSXAttribute" &&
              a.name?.type === "JSXIdentifier" &&
              a.name.name === name
          );

        // Add data-fragment-id
        if (!hasAttr("data-fragment-id")) {
          path.node.attributes.push(
            types.jsxAttribute(
              types.jsxIdentifier("data-fragment-id"),
              types.stringLiteral(`frag-${hash}`)
            )
          );
        }

        // Add data-filepath
        if (!hasAttr("data-filepath")) {
          path.node.attributes.push(
            types.jsxAttribute(
              types.jsxIdentifier("data-filepath"),
              types.stringLiteral(filePath)
            )
          );
        }

        // Add data-filename
        if (!hasAttr("data-filename")) {
          const fileName = filePath.split("/").pop() || "";
          path.node.attributes.push(
            types.jsxAttribute(
              types.jsxIdentifier("data-filename"),
              types.stringLiteral(fileName)
            )
          );
        }
      },
    },
  };
}
