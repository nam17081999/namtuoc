import { Extension } from "@tiptap/core";
import TextStyle from "@tiptap/extension-text-style";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    fontSize: {
      setFontSize: (size: string) => ReturnType;
    };
  }
}

export const FontSize = Extension.create({
  name: "fontSize",

  addExtensions() {
    return [TextStyle];
  },

  addGlobalAttributes() {
    return [
      {
        types: ["textStyle"],
        attributes: {
          fontSize: {
            default: null,
            parseHTML: (element) => element.style.fontSize?.replace(/['"]+/g, "") || null,
            renderHTML: (attributes) => {
              if (!attributes.fontSize) {
                return {};
              }
              return { style: `font-size: ${attributes.fontSize}` };
            }
          }
        }
      }
    ];
  },

  addStorage() {
    return {
      current: "16px"
    };
  },

  addCommands() {
    return {
      setFontSize:
        (size: string) =>
        ({ chain, editor }) => {
          editor.storage.fontSize.current = size;
          // setMark sets storedMarks so new text keeps the size
          return chain().focus().setMark("textStyle", { fontSize: size }).run();
        }
    };
  },

  addKeyboardShortcuts() {
    return {
      Enter: () => {
        const size = this.editor.storage.fontSize.current as string | undefined;
        const ok = this.editor.commands.splitBlock();
        if (size) {
          this.editor.commands.setMark("textStyle", { fontSize: size });
        }
        return ok;
      }
    };
  }
});
