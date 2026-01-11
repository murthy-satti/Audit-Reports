"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { AutoFocusPlugin } from "@lexical/react/LexicalAutoFocusPlugin";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { LinkPlugin } from "@lexical/react/LexicalLinkPlugin";
import { TablePlugin } from "@lexical/react/LexicalTablePlugin";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { HeadingNode, QuoteNode } from "@lexical/rich-text";
import { ParagraphNode } from "lexical";

import {
  TableNode,
  TableRowNode,
  TableCellNode,
  $createTableNodeWithDimensions,
  $isTableSelection,
} from "@lexical/table";
import { ListNode, ListItemNode } from "@lexical/list";
import { LinkNode, $isLinkNode, $createLinkNode } from "@lexical/link";
import { $setBlocksType } from "@lexical/selection";
import {
  INSERT_ORDERED_LIST_COMMAND,
  INSERT_UNORDERED_LIST_COMMAND,
  REMOVE_LIST_COMMAND,
} from "@lexical/list";
import { $isHeadingNode, $createHeadingNode } from "@lexical/rich-text";
import {
  LexicalEditor,
  $getRoot,
  $getSelection,
  $isRangeSelection,
  $createParagraphNode,
  $createTextNode,
  FORMAT_TEXT_COMMAND,
  FORMAT_ELEMENT_COMMAND,
  UNDO_COMMAND,
  REDO_COMMAND,
  SELECTION_CHANGE_COMMAND,
  $isElementNode,
  ElementFormatType,
  TextFormatType,
} from "lexical";
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  Undo2,
  Redo2,
  Link,
  Unlink,
  Table,
  Type,
  Palette,
  Highlighter,
  Subscript,
  Superscript,
  RemoveFormatting,
  Indent,
  Outdent,
  Heading1,
  Heading2,
  Heading3,
  Pilcrow,
  TableProperties,
  Plus,
  Minus,
  RowsIcon,
  Columns,
} from "lucide-react";

/* ================= TYPES ================= */
export interface Block {
  type: "paragraph" | "heading" | "table";
  text?: string;
  fontSize?: number;
  align?: "left" | "center" | "right" | "justify";
  bold?: boolean;
  italic?: boolean;
  color?: string;
rows?: {
  cells: {
    text: string;
    bold?: boolean;
    align?: "left" | "center" | "right";
  }[];
}[];
}

interface ToolbarButtonProps {
  onClick: () => void;
  isActive?: boolean;
  disabled?: boolean;
  title: string;
  children: React.ReactNode;
}

/* ================= LEXICAL CONFIG ================= */
export const createEditorConfig = () => ({
  namespace: "GramaPanchayatiEditor",
  nodes: [
    HeadingNode,
    ListNode,
    ListItemNode,
    QuoteNode,
    TableNode,
    TableRowNode,
    TableCellNode,
    LinkNode,
  ],
  onError: (error: Error) => console.error("Lexical error:", error),
  theme: {
    text: {
      bold: "font-bold",
      italic: "italic",
      underline: "underline",
      strikethrough: "line-through",
      subscript: "text-xs align-sub",
      superscript: "text-xs align-super",
    },
    heading: {
      h1: "text-2xl font-bold mb-4",
      h2: "text-xl font-bold mb-3",
      h3: "text-lg font-bold mb-2",
    },
    list: {
      ul: "list-disc ml-6 mb-2",
      ol: "list-decimal ml-6 mb-2",
      listitem: "mb-1",
    },
    table: "border-collapse w-full mb-4",
    tableCell: "border border-slate-300 p-2",
    tableCellHeader: "border border-slate-300 p-2 bg-slate-100 font-bold",
    link: "text-blue-600 underline cursor-pointer",
  },
});

/* ================= TOOLBAR BUTTON ================= */
function ToolbarButton({
  onClick,
  isActive = false,
  disabled = false,
  title,
  children,
}: ToolbarButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`p-1.5 rounded hover:bg-slate-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
        isActive ? "bg-blue-100 text-blue-700" : "text-slate-700"
      }`}
    >
      {children}
    </button>
  );
}

/* ================= TOOLBAR DIVIDER ================= */
function ToolbarDivider() {
  return <div className="h-6 w-px bg-slate-300 mx-1" />;
}

/* ================= TOOLBAR DROPDOWN ================= */
function ToolbarSelect({
  value,
  onChange,
  options,
  title,
  className = "",
}: {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  title: string;
  className?: string;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      title={title}
      className={`px-2 py-1 border border-slate-300 rounded text-sm bg-white hover:bg-slate-50 cursor-pointer focus:outline-none focus:border-blue-500 ${className}`}
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}

/* ================= MAIN TOOLBAR PLUGIN ================= */
export function EditorToolbar() {
  const [editor] = useLexicalComposerContext();

  // Format states
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [isStrikethrough, setIsStrikethrough] = useState(false);
  const [isSubscript, setIsSubscript] = useState(false);
  const [isSuperscript, setIsSuperscript] = useState(false);
  const [blockType, setBlockType] = useState("paragraph");
  const [fontSize, setFontSize] = useState("14");
  const [fontFamily, setFontFamily] = useState("Arial");
  const [textColor, setTextColor] = useState("#000000");
  const [bgColor, setBgColor] = useState("#ffffff");
  const [alignment, setAlignment] = useState<ElementFormatType>("left");
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  // Update toolbar state based on selection
  const updateToolbar = useCallback(() => {
    const selection = $getSelection();
    if ($isRangeSelection(selection)) {
      setIsBold(selection.hasFormat("bold"));
      setIsItalic(selection.hasFormat("italic"));
      setIsUnderline(selection.hasFormat("underline"));
      setIsStrikethrough(selection.hasFormat("strikethrough"));
      setIsSubscript(selection.hasFormat("subscript"));
      setIsSuperscript(selection.hasFormat("superscript"));

      const anchorNode = selection.anchor.getNode();
      const element =
        anchorNode.getKey() === "root"
          ? anchorNode
          : anchorNode.getTopLevelElementOrThrow();

      if ($isHeadingNode(element)) {
        setBlockType(element.getTag());
      } else if ($isElementNode(element)) {
        setBlockType(element.getType());
      }
    }
  }, []);

  useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        updateToolbar();
      });
    });
  }, [editor, updateToolbar]);

  useEffect(() => {
    return editor.registerCommand(
      SELECTION_CHANGE_COMMAND,
      () => {
        updateToolbar();
        return false;
      },
      1
    );
  }, [editor, updateToolbar]);

  // Format handlers
  const formatText = (format: TextFormatType) => {
    editor.dispatchCommand(FORMAT_TEXT_COMMAND, format);
  };

  const formatAlignment = (align: ElementFormatType) => {
    editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, align);
    setAlignment(align);
  };

  const formatHeading = (headingType: string) => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        if (headingType === "paragraph") {
          $setBlocksType(selection, () => $createParagraphNode());
        } else {
          $setBlocksType(selection, () =>
            $createHeadingNode(headingType as "h1" | "h2" | "h3")
          );
        }
      }
    });
    setBlockType(headingType);
  };

  const insertList = (type: "bullet" | "number") => {
    if (type === "bullet") {
      editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined);
    } else {
      editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined);
    }
  };

  const insertTable = () => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        const tableNode = $createTableNodeWithDimensions(3, 3, true);
        selection.insertNodes([tableNode]);
      }
    });
  };

  const insertLink = () => {
    const url = prompt("Enter URL:");
    if (url) {
      editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          const linkNode = $createLinkNode(url);
          selection.insertNodes([linkNode]);
        }
      });
    }
  };

  const removeLink = () => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        const nodes = selection.getNodes();
        nodes.forEach((node) => {
          const parent = node.getParent();
          if ($isLinkNode(parent)) {
            const children = parent.getChildren();
            children.forEach((child) => parent.insertBefore(child));
            parent.remove();
          }
        });
      }
    });
  };

  const clearFormatting = () => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        selection.getNodes().forEach((node) => {
          if (node.getType() === "text") {
            (node as any).setFormat(0);
          }
        });
      }
    });
  };

  const applyFontSize = (size: string) => {
    setFontSize(size);
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        selection.getNodes().forEach((node) => {
          if (node.getType() === "text") {
            (node as any).setStyle(`font-size: ${size}px`);
          }
        });
      }
    });
  };

  const applyTextColor = (color: string) => {
    setTextColor(color);
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        selection.getNodes().forEach((node) => {
          if (node.getType() === "text") {
            (node as any).setStyle(`color: ${color}`);
          }
        });
      }
    });
  };

  const applyBgColor = (color: string) => {
    setBgColor(color);
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        selection.getNodes().forEach((node) => {
          if (node.getType() === "text") {
            (node as any).setStyle(`background-color: ${color}`);
          }
        });
      }
    });
  };

  const fontFamilies = [
    { value: "Arial", label: "Arial" },
    { value: "Times New Roman", label: "Times New Roman" },
    { value: "Georgia", label: "Georgia" },
    { value: "Courier New", label: "Courier New" },
    { value: "Verdana", label: "Verdana" },
    { value: "Tahoma", label: "Tahoma" },
  ];

  const fontSizes = [
    { value: "10", label: "10" },
    { value: "11", label: "11" },
    { value: "12", label: "12" },
    { value: "14", label: "14" },
    { value: "16", label: "16" },
    { value: "18", label: "18" },
    { value: "20", label: "20" },
    { value: "24", label: "24" },
    { value: "28", label: "28" },
    { value: "32", label: "32" },
    { value: "36", label: "36" },
    { value: "48", label: "48" },
  ];

  const blockTypes = [
    { value: "paragraph", label: "Normal" },
    { value: "h1", label: "Heading 1" },
    { value: "h2", label: "Heading 2" },
    { value: "h3", label: "Heading 3" },
  ];

  return (
    <div className="w-full bg-white border-b border-slate-300 px-2 py-1.5 flex flex-wrap items-center gap-0.5 sticky top-0 z-40">
      {/* Undo/Redo */}
      <ToolbarButton
        onClick={() => editor.dispatchCommand(UNDO_COMMAND, undefined)}
        title="Undo (Ctrl+Z)"
      >
        <Undo2 size={16} />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.dispatchCommand(REDO_COMMAND, undefined)}
        title="Redo (Ctrl+Y)"
      >
        <Redo2 size={16} />
      </ToolbarButton>

      <ToolbarDivider />

      {/* Block Type */}
      <ToolbarSelect
        value={blockType}
        onChange={formatHeading}
        options={blockTypes}
        title="Block Type"
        className="w-28"
      />

      <ToolbarDivider />

      {/* Font Family */}
      <ToolbarSelect
        value={fontFamily}
        onChange={setFontFamily}
        options={fontFamilies}
        title="Font Family"
        className="w-32"
      />

      {/* Font Size */}
      <ToolbarSelect
        value={fontSize}
        onChange={applyFontSize}
        options={fontSizes}
        title="Font Size"
        className="w-16"
      />

      <ToolbarDivider />

      {/* Text Formatting */}
      <ToolbarButton
        onClick={() => formatText("bold")}
        isActive={isBold}
        title="Bold (Ctrl+B)"
      >
        <Bold size={16} />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => formatText("italic")}
        isActive={isItalic}
        title="Italic (Ctrl+I)"
      >
        <Italic size={16} />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => formatText("underline")}
        isActive={isUnderline}
        title="Underline (Ctrl+U)"
      >
        <Underline size={16} />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => formatText("strikethrough")}
        isActive={isStrikethrough}
        title="Strikethrough"
      >
        <Strikethrough size={16} />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => formatText("subscript")}
        isActive={isSubscript}
        title="Subscript"
      >
        <Subscript size={16} />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => formatText("superscript")}
        isActive={isSuperscript}
        title="Superscript"
      >
        <Superscript size={16} />
      </ToolbarButton>

      <ToolbarDivider />

      {/* Text Color */}
      <div className="relative">
        <input
          type="color"
          value={textColor}
          onChange={(e) => applyTextColor(e.target.value)}
          title="Text Color"
          className="w-7 h-7 cursor-pointer border border-slate-300 rounded"
        />
      </div>

      {/* Background Color */}
      <div className="relative">
        <input
          type="color"
          value={bgColor}
          onChange={(e) => applyBgColor(e.target.value)}
          title="Highlight Color"
          className="w-7 h-7 cursor-pointer border border-slate-300 rounded"
        />
      </div>

      <ToolbarDivider />

      {/* Alignment */}
      <ToolbarButton
        onClick={() => formatAlignment("left")}
        isActive={alignment === "left"}
        title="Align Left"
      >
        <AlignLeft size={16} />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => formatAlignment("center")}
        isActive={alignment === "center"}
        title="Align Center"
      >
        <AlignCenter size={16} />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => formatAlignment("right")}
        isActive={alignment === "right"}
        title="Align Right"
      >
        <AlignRight size={16} />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => formatAlignment("justify")}
        isActive={alignment === "justify"}
        title="Justify"
      >
        <AlignJustify size={16} />
      </ToolbarButton>

      <ToolbarDivider />

      {/* Lists */}
      <ToolbarButton onClick={() => insertList("bullet")} title="Bullet List">
        <List size={16} />
      </ToolbarButton>
      <ToolbarButton onClick={() => insertList("number")} title="Numbered List">
        <ListOrdered size={16} />
      </ToolbarButton>

      <ToolbarDivider />

      {/* Links */}
      <ToolbarButton onClick={insertLink} title="Insert Link">
        <Link size={16} />
      </ToolbarButton>
      <ToolbarButton onClick={removeLink} title="Remove Link">
        <Unlink size={16} />
      </ToolbarButton>

      <ToolbarDivider />

      {/* Table */}
      <ToolbarButton onClick={insertTable} title="Insert Table (3x3)">
        <Table size={16} />
      </ToolbarButton>

      <ToolbarDivider />

      {/* Clear Formatting */}
      <ToolbarButton onClick={clearFormatting} title="Clear Formatting">
        <RemoveFormatting size={16} />
      </ToolbarButton>

      {/* Help text */}
      <div className="ml-auto text-xs text-slate-500 hidden lg:block">
        Select text to format | Ctrl+B Bold | Ctrl+I Italic | Ctrl+U Underline
      </div>
    </div>
  );
}

/* ================= POPULATE EDITOR PLUGIN ================= */
export function PopulateEditorPlugin({
  blocks,
  onEditorReady,
}: {
  blocks: Block[];
  onEditorReady: (editor: LexicalEditor) => void;
}) {
  const [editor] = useLexicalComposerContext();
  const hasPopulated = useRef(false);

  useEffect(() => {
    if (hasPopulated.current) return;
    hasPopulated.current = true;

    editor.update(() => {
      const root = $getRoot();
      root.clear();

      blocks.forEach((block) => {
  if (block.type === "table" && block.rows) {
  const numRows = block.rows.length;
  const numCols = block.rows[0]?.cells.length || 1;

  const tableNode = $createTableNodeWithDimensions(numRows, numCols, false);
  const tableRows = tableNode.getChildren() as TableRowNode[];

  block.rows.forEach((rowData, rowIndex) => {
    const rowNode = tableRows[rowIndex];
    if (!rowNode) return;

    const cellNodes = rowNode.getChildren() as TableCellNode[];

    rowData.cells.forEach((cell, cellIndex) => {
      const cellNode = cellNodes[cellIndex];
      if (!cellNode) return;

const paragraph = cellNode.getFirstChild();

if (!(paragraph instanceof ParagraphNode)) return;
      if (!paragraph) return;

      const textNode = $createTextNode(cell.text);

      if (cell.bold) {
        textNode.toggleFormat("bold");
      }

      paragraph.clear();
      paragraph.append(textNode);

      if (cell.align) {
        paragraph.setFormat(cell.align);
      }
    });
  });

  root.append(tableNode);
        } else if (block.type === "heading") {
          // Create heading node
          const heading = $createHeadingNode("h2");
          const text = $createTextNode(block.text || "");

          text.toggleFormat("bold");
          if (block.italic) {
            text.toggleFormat("italic");
          }

          heading.append(text);

          // Apply alignment
          if (block.align === "center") {
            heading.setFormat("center");
          } else if (block.align === "right") {
            heading.setFormat("right");
          } else if (block.align === "justify") {
            heading.setFormat("justify");
          }

          root.append(heading);
        } else {
          // Create paragraph
          const paragraph = $createParagraphNode();
          const text = $createTextNode(block.text || "");

          if (block.bold) {
            text.toggleFormat("bold");
          }
          if (block.italic) {
            text.toggleFormat("italic");
          }

          paragraph.append(text);

          // Apply alignment
          if (block.align === "center") {
            paragraph.setFormat("center");
          } else if (block.align === "right") {
            paragraph.setFormat("right");
          } else if (block.align === "justify") {
            paragraph.setFormat("justify");
          }

          root.append(paragraph);
        }
      });
    });

    onEditorReady(editor);
  }, [editor, blocks, onEditorReady]);

  return null;
}

/* ================= EDITOR WRAPPER ================= */
export function DocumentEditor({
  blocks,
  onEditorReady,
  pageNo,
}: {
  blocks: Block[];
  onEditorReady: (editor: LexicalEditor) => void;
  pageNo: number;
}) {
  return (
    <LexicalComposer initialConfig={createEditorConfig()}>
      <div className="flex flex-col h-full">
        <EditorToolbar />
        <div className="flex-1 overflow-auto px-5 py-7">
          <RichTextPlugin
            contentEditable={
              <ContentEditable
                className="w-full min-h-full outline-none text-slate-900"
                style={{
                  lineHeight: "1.8",
                  fontSize: "14px",
                  fontFamily: "Arial, sans-serif",
                }}
              />
            }
            placeholder={
              <div className="text-slate-400 text-center py-10">
                <p className="text-sm">Start typing... (Page {pageNo})</p>
              </div>
            }
            ErrorBoundary={() => null}
          />
          <HistoryPlugin />
          <AutoFocusPlugin />
          <ListPlugin />
          <LinkPlugin />
          <TablePlugin />
          <PopulateEditorPlugin blocks={blocks} onEditorReady={onEditorReady} />
        </div>
      </div>
    </LexicalComposer>
  );
}

/* ================= TABLE RENDERER (for preview mode) ================= */
export function TableRenderer({
  rows,
}: {
  rows: {
    cells: {
      text: string;
      bold?: boolean;
      align?: "left" | "center" | "right";
    }[];
  }[];
}) {
  return (
    <table className="w-full border-collapse mb-4">
      <tbody>
        {rows.map((row, rowIndex) => (
          <tr key={rowIndex}>
            {row.cells.map((cell, cellIndex) => (
              <td
                key={cellIndex}
                className="border border-slate-300 p-2 text-sm"
                style={{
                  fontWeight: cell.bold ? "600" : "400",
                  textAlign: cell.align || "left",
                }}
              >
                {cell.text}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

