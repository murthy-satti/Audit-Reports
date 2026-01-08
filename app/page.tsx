"use client";

import { useState, useRef, useCallback, useMemo, useEffect } from "react";
import { Download, FileText, Edit2, X } from "lucide-react";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { AutoFocusPlugin } from "@lexical/react/LexicalAutoFocusPlugin";
import { HeadingNode, QuoteNode } from "@lexical/rich-text";
import { TableNode, TableRowNode, TableCellNode } from "@lexical/table";
import { ListNode, ListItemNode } from "@lexical/list";
import { LinkNode } from "@lexical/link";
import {
  $generateHtmlFromNodes,
  $generateNodesFromDOM,
} from "@lexical/html";
import { LexicalEditor as LexicalEditorType } from "lexical";
import {
  $getRoot,
  $createParagraphNode,
  $createTextNode,
  RangeSelection,
} from "lexical";

/* ================= TYPES ================= */
interface DownloadPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onDownload: (format: "pdf" | "docx") => void;
}

interface ToolbarPluginProps {
  editor: LexicalEditorType | null;
}

interface Block {
  type: "paragraph" | "heading";
  text: string;
  align: "left" | "center" | "right" | "justify";
  bold?: boolean;
  italic?: boolean;
  color?: string;
}

interface PagePreviewProps {
  blocks: Block[];
  pageNo: number;
  isEditing: boolean;
  editor: LexicalEditorType | null;
  onEditorReady: (editor: LexicalEditorType) => void;
}

interface InputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
}

/* ================= LEXICAL CONFIG ================= */
const createLexicalConfig = () => ({
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
});

/* ================= TOOLBAR PLUGIN (MS WORD STYLE) ================= */
function ToolbarPlugin({ editor }: ToolbarPluginProps) {
  const applyFormat = (formatType: "bold" | "italic" | "underline") => {
    if (!editor) return;

    editor.update(() => {
      const selection = editor.getSelection() as RangeSelection | null;
      if (selection && selection.formatText) {
        selection.formatText(formatType);
      }
    });
  };

  return (
    <div className="w-full bg-white border-b border-slate-300 p-3 flex flex-wrap gap-2 items-center sticky top-0 z-40">
      {/* Font Section */}
      <select className="px-3 py-2 border border-slate-300 rounded text-sm bg-white hover:bg-slate-50 cursor-pointer">
        <option>Arial</option>
        <option>Times New Roman</option>
        <option>Courier New</option>
        <option>Georgia</option>
      </select>

      {/* Font Size */}
      <div className="flex items-center gap-1 border border-slate-300 rounded">
        <button className="px-2 py-1 hover:bg-slate-100 text-sm transition">
          −
        </button>
        <input
          type="number"
          defaultValue="11"
          className="w-12 text-center border-l border-r border-slate-200 py-1 text-sm"
        />
        <button className="px-2 py-1 hover:bg-slate-100 text-sm transition">
          +
        </button>
      </div>

      {/* Divider */}
      <div className="h-6 border-l border-slate-300" />

      {/* Formatting Buttons */}
      <button
        onMouseDown={(e) => {
          e.preventDefault();
          applyFormat("bold");
        }}
        className="px-3 py-2 border border-slate-300 rounded hover:bg-slate-100 font-bold transition"
        title="బోల్డ్ (Ctrl+B)"
      >
        B
      </button>

      <button
        onMouseDown={(e) => {
          e.preventDefault();
          applyFormat("italic");
        }}
        className="px-3 py-2 border border-slate-300 rounded hover:bg-slate-100 italic transition"
        title="ఇటాలిక్ (Ctrl+I)"
      >
        I
      </button>

      <button
        onMouseDown={(e) => {
          e.preventDefault();
          applyFormat("underline");
        }}
        className="px-3 py-2 border border-slate-300 rounded hover:bg-slate-100 underline transition"
        title="అండర్‌లైన్ (Ctrl+U)"
      >
        U
      </button>

      {/* Text Color */}
      <input
        type="color"
        defaultValue="#000000"
        className="w-10 h-9 border border-slate-300 rounded cursor-pointer"
        title="పాఠ్య రంగు"
      />

      {/* Divider */}
      <div className="h-6 border-l border-slate-300" />

      {/* Alignment Buttons */}
      <button
        className="px-3 py-2 border border-slate-300 rounded hover:bg-slate-100 text-sm transition"
        title="ఎడమ సమలేఖనం"
      >
        ⬅
      </button>

      <button
        className="px-3 py-2 border border-slate-300 rounded hover:bg-slate-100 text-sm transition"
        title="కేంద్ర సమలేఖనం"
      >
        ⬇
      </button>

      <button
        className="px-3 py-2 border border-slate-300 rounded hover:bg-slate-100 text-sm transition"
        title="కుడి సమలేఖనం"
      >
        ➡
      </button>

      {/* Divider */}
      <div className="h-6 border-l border-slate-300" />

      {/* List Buttons */}
      <button
        className="px-3 py-2 border border-slate-300 rounded hover:bg-slate-100 text-sm transition"
        title="బుల్లెట్ జాబితా"
      >
        ▸
      </button>

      <button
        className="px-3 py-2 border border-slate-300 rounded hover:bg-slate-100 text-sm transition"
        title="సంఖ్య జాబితా"
      >
        1️⃣
      </button>

      {/* Divider */}
      <div className="h-6 border-l border-slate-300" />

      {/* More Options */}
      <button
        className="px-3 py-2 border border-slate-300 rounded hover:bg-slate-100 transition"
        title="లింక్ చేయండి"
      >
        🔗
      </button>

      <button
        className="px-3 py-2 border border-slate-300 rounded hover:bg-slate-100 transition"
        title="చిత్రం చేర్చండి"
      >
        🖼️
      </button>

      {/* Divider */}
      <div className="h-6 border-l border-slate-300" />

      {/* Clear Formatting */}
      <button
        className="px-3 py-2 border border-slate-300 rounded hover:bg-slate-100 text-sm transition"
        title="ఫార్మాటింగ్ క్లియర్ చేయండి"
      >
        🗑️
      </button>

      {/* Help Text */}
      <div className="ml-auto text-xs text-slate-500 whitespace-nowrap">
        సవరించండి: టెక్స్ట్ ఎంచుకోండి → బటన్‌ను క్లిక్ చేయండి
      </div>
    </div>
  );
}

/* ================= DOWNLOAD POPUP ================= */
function DownloadPopup({
  isOpen,
  onClose,
  onDownload,
}: DownloadPopupProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center">
              <Download className="text-white" size={20} />
            </div>
            <h2 className="text-lg font-bold text-slate-900">
              డౌన్‌లోడ్ ఫార్మాట్
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Options */}
        <div className="p-6 space-y-3">
          <button
            onClick={() => onDownload("pdf")}
            className="w-full p-4 border-2 border-blue-300 rounded-lg hover:bg-blue-50 transition flex items-center gap-3"
          >
            <div className="w-10 h-10 rounded bg-red-100 flex items-center justify-center">
              <span className="text-red-600 font-bold text-sm">PDF</span>
            </div>
            <div className="text-left">
              <p className="font-semibold text-slate-900">PDF ఫార్మాట్</p>
              <p className="text-xs text-slate-500">ప్రింట్ కోసం సిద్ధం</p>
            </div>
          </button>

          <button
            onClick={() => onDownload("docx")}
            className="w-full p-4 border-2 border-blue-300 rounded-lg hover:bg-blue-50 transition flex items-center gap-3"
          >
            <div className="w-10 h-10 rounded bg-blue-100 flex items-center justify-center">
              <span className="text-blue-600 font-bold text-sm">DOC</span>
            </div>
            <div className="text-left">
              <p className="font-semibold text-slate-900">DOCX ఫార్మాట్</p>
              <p className="text-xs text-slate-500">MS Word లో సవరించండి</p>
            </div>
          </button>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 font-medium transition"
          >
            రద్దు చేయండి
          </button>
        </div>
      </div>
    </div>
  );
}

/* ================= HTML TO BLOCKS CONVERTER ================= */
function htmlToBlocks(html: string): Block[] {
  if (!html || !html.trim()) return [];

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  const blocks: Block[] = [];

  const processNode = (node: Node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent?.trim() || "";
      if (text) {
        blocks.push({
          type: "paragraph",
          text,
          align: "left",
          bold: false,
          italic: false,
          color: "#000000",
        });
      }
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const element = node as HTMLElement;
      const tag = element.tagName.toLowerCase();
      const text = element.textContent?.trim() || "";

      if (!text) return;

      const style = window.getComputedStyle(element);
      const bold =
        parseInt(style.fontWeight) > 500 ||
        tag === "strong" ||
        tag === "b" ||
        element.classList.contains("bold");
      const italic =
        style.fontStyle === "italic" ||
        tag === "em" ||
        tag === "i" ||
        element.classList.contains("italic");

      const alignMap: Record<string, "center" | "right" | "justify" | "left"> =
        {
          center: "center",
          right: "right",
          justify: "justify",
        };
      const align: "center" | "right" | "justify" | "left" =
        alignMap[style.textAlign] || "left";

      if (["h1", "h2", "h3", "h4", "h5", "h6"].includes(tag)) {
        blocks.push({
          type: "heading",
          text,
          align,
          bold: true,
          italic,
          color: style.color || "#000000",
        });
      } else if (["p", "div", "section"].includes(tag)) {
        blocks.push({
          type: "paragraph",
          text,
          align,
          bold,
          italic,
          color: style.color || "#000000",
        });
      } else if (tag === "ul" || tag === "ol") {
        Array.from(element.children).forEach((li) => {
          blocks.push({
            type: "paragraph",
            text: `• ${(li as HTMLElement).textContent?.trim() || ""}`,
            align: "left",
            bold: false,
            italic: false,
            color: "#000000",
          });
        });
      }
    }
  };

  Array.from(doc.body.childNodes).forEach(processNode);
  return blocks;
}

/* ================= POPULATE EDITOR PLUGIN ================= */
function PopulateEditorPlugin({
  blocks,
  onEditorReady,
}: {
  blocks: Block[];
  onEditorReady: (editor: LexicalEditorType) => void;
}) {
  useEffect(() => {
    // Get the editor instance from the LexicalComposer
    const handleEditorReady = (editor: LexicalEditorType) => {
      editor.update(() => {
        const root = $getRoot();
        root.clear();

        // Add blocks to the editor
        blocks.forEach((block) => {
          const paragraph = $createParagraphNode();
          const text = $createTextNode(block.text);
          paragraph.append(text);

          if (block.type === "heading") {
            // For headings, we create h2 elements
            // Note: Lexical's basic nodes don't support semantic HTML, 
            // so we'll use paragraphs with formatting instead
            text.toggleFormat("bold");
          }

          if (block.bold) {
            text.toggleFormat("bold");
          }
          if (block.italic) {
            text.toggleFormat("italic");
          }

          root.append(paragraph);
        });
      });

      onEditorReady(editor);
    };
  }, [blocks, onEditorReady]);

  return null;
}

/* ================= A4 PAGE PREVIEW WITH INTEGRATED EDITOR ================= */
function PagePreview({
  blocks,
  pageNo,
  isEditing,
  editor,
  onEditorReady,
}: PagePreviewProps) {
  if (isEditing) {
    return (
      <div className="mx-auto w-[210mm] h-[297mm] bg-white rounded-lg shadow-lg flex flex-col border-2 border-blue-500 shrink-0 overflow-hidden">
        <LexicalComposer initialConfig={createLexicalConfig()}>
          <ToolbarPlugin editor={editor} />
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
                  <p className="text-sm">
                    ఇక్కడ సవరించండి... (పేజీ {pageNo})
                  </p>
                </div>
              }
              ErrorBoundary={() => null}
            />
            <HistoryPlugin />
            <AutoFocusPlugin />
          </div>
          <PopulateEditorPlugin
            blocks={blocks}
            onEditorReady={onEditorReady}
          />
        </LexicalComposer>
        <div className="text-center text-xs py-3 text-slate-400 border-t border-slate-200">
          పేజీ {pageNo}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-[210mm] h-[297mm] bg-white rounded-lg shadow-lg flex flex-col border-2 border-slate-300 shrink-0">
      <div className="flex-1 overflow-y-auto px-5 py-7 text-slate-900">
        {blocks && blocks.length > 0 ? (
          blocks.map((block, index) => {
            const alignClass =
              block.align === "center"
                ? "text-center"
                : block.align === "right"
                ? "text-right"
                : block.align === "justify"
                ? "text-justify"
                : "text-left";

            const style = {
              fontWeight: block.bold ? "600" : "400",
              fontStyle: block.italic ? "italic" : "normal",
              color: block.color || "inherit",
            };

            if (block.type === "heading") {
              return (
                <h2
                  key={index}
                  className={`text-sm mb-4 font-bold ${alignClass}`}
                  style={style}
                >
                  {block.text}
                </h2>
              );
            }

            return (
              <p
                key={index}
                className={`text-sm whitespace-pre-line leading-6 mb-3 ${alignClass}`}
                style={style}
              >
                {block.text}
              </p>
            );
          })
        ) : (
          <div className="text-slate-400 text-center py-10">
            పేజీ ఖాళీగా ఉంది
          </div>
        )}
      </div>

      <div className="text-center text-xs py-3 text-slate-400 border-t border-slate-200">
        పేజీ {pageNo}
      </div>
    </div>
  );
}

/* ================= INPUT COMPONENT ================= */
function Input({ label, value, onChange }: InputProps) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-700 mb-1 uppercase tracking-wide">
        {label}
      </label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border-2 border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 bg-white font-medium hover:border-slate-400"
        placeholder={label}
      />
    </div>
  );
}

/* ================= MAIN PAGE ================= */
export default function HomePage() {
  /* ---------- PAGE 1 FORM ---------- */
  const [gpName, setGpName] = useState("రావులపాలెం గ్రామ పంచాయతీ");
  const [mandal, setMandal] = useState("రావులపాలెం మండలం");
  const [district, setDistrict] = useState("కోనసీమ జిల్లా");
  const [financialYear, setFinancialYear] = useState("2024 - 2025");
  const [reportDate, setReportDate] = useState("15-03-2025");
  const [auditorName, setAuditorName] = useState("శ్రీ కె. సత్యనారాయణ");

  /* ---------- PAGE 2 FORM ---------- */
  const [sarpanch, setSarpanch] = useState("శ్రీమతి ఎస్. సావిత్రమ్మ");
  const [secretary, setSecretary] = useState("శ్రీ ఎం. శ్రీనివాస్");
  const [income, setIncome] = useState("28,75,000");
  const [expense, setExpense] = useState("27,90,000");
  const [finalDate, setFinalDate] = useState("15-03-2025");

  /* ---------- EDITOR STATE ---------- */
  const [editorActive, setEditorActive] = useState(false);
  const [currentEditor, setCurrentEditor] = useState<LexicalEditorType | null>(
    null
  );
  const [downloadPopupOpen, setDownloadPopupOpen] = useState(false);

  const formScrollRef = useRef<HTMLDivElement>(null);

  /* ================= TEMPLATE BLOCKS (DEFAULT) ================= */
  const generatePage1Blocks = useCallback(
    (): Block[] => [
      {
        type: "heading",
        text: "గ్రామ పంచాయతీ ఆడిట్ నివేదిక",
        align: "center",
        bold: true,
      },
      {
        type: "paragraph",
        text: "(మండల ఆడిట్ రిపోర్టర్‌కు సమర్పించుటకు)",
        align: "center",
        italic: true,
      },
      {
        type: "paragraph",
        text: `గ్రామ పంచాయతీ పేరు : ${gpName}
మండలం : ${mandal}
జిల్లా : ${district}
ఆర్థిక సంవత్సరం : ${financialYear}
ఆడిట్ నివేదిక తేదీ : ${reportDate}`,
        align: "center",
      },
      {
        type: "paragraph",
        text: "గ్రామ పంచాయతీ పరిధిలో నిర్వహించబడిన అభివృద్ధి కార్యక్రమాలు, నిధుల వినియోగం, ఆదాయ–వ్యయాల వివరాలు, రికార్డుల నిర్వహణ తదితర అంశాలపై ఈ ఆడిట్ నివేదికను మండల ఆడిట్ రిపోర్టర్ గారికి సమర్పిస్తున్నాము.",
        align: "justify",
      },
      {
        type: "paragraph",
        text: `ఆడిట్ రిపోర్టర్ పేరు : ${auditorName}`,
        align: "left",
        bold: true,
      },
    ],
    [gpName, mandal, district, financialYear, reportDate, auditorName]
  );

  const generatePage2Blocks = useCallback(
    (): Block[] => [
      {
        type: "heading",
        text: "గ్రామ పంచాయతీ పాలకవర్గ వివరాలు",
        align: "left",
        bold: true,
      },
      {
        type: "paragraph",
        text: `సర్పంచ్ పేరు : ${sarpanch}
పంచాయతీ కార్యదర్శి : ${secretary}`,
        align: "left",
      },
      {
        type: "heading",
        text: "ఆర్థిక వివరాలు",
        align: "left",
        bold: true,
      },
      {
        type: "paragraph",
        text: `మొత్తం ఆదాయం రూ. ${income}/-
మొత్తం వ్యయం రూ. ${expense}/-`,
        align: "left",
      },
      {
        type: "paragraph",
        text: "ఈ ఆడిట్ నివేదికలో పొందుపరిచిన సమాచారం పంచాయతీ రికార్డుల ఆధారంగా సమర్పించబడినదిగా తెలియజేస్తున్నాము.",
        align: "justify",
      },
      {
        type: "paragraph",
        text: `తేదీ : ${finalDate}`,
        align: "left",
      },
    ],
    [sarpanch, secretary, income, expense, finalDate]
  );

  const page1Blocks = useMemo(
    () => generatePage1Blocks(),
    [generatePage1Blocks]
  );
  const page2Blocks = useMemo(
    () => generatePage2Blocks(),
    [generatePage2Blocks]
  );

  /* ================= PDF DOWNLOAD ================= */
  const downloadPdf = async () => {
    try {
      const { PDFDocument, rgb } = await import("pdf-lib");

      const pdfDoc = await PDFDocument.create();

      const fontBytes = await fetch("/fonts/NotoSansTelugu-Regular.ttf").then(
        (r) => r.arrayBuffer()
      );

      const font = await pdfDoc.embedFont(fontBytes);

      const pages = [
        { blocks: page1Blocks, title: "Page 1" },
        { blocks: page2Blocks, title: "Page 2" },
      ];

      pages.forEach(({ blocks }) => {
        const page = pdfDoc.addPage([595, 842]);
        let y = 780;

        blocks.forEach((block) => {
          const xPos = block.align === "center" ? 150 : 50;

          page.drawText(block.text, {
            x: xPos,
            y,
            size: 11,
            font,
            maxWidth: 495,
            lineHeight: 14,
            color: rgb(0, 0, 0),
          });

          y -= 40;
        });
      });

      const bytes = await pdfDoc.save();
      const blob = new Blob([new Uint8Array(bytes)], {
        type: "application/pdf",
      });

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "grama_panchayati_audit_report.pdf";
      a.click();
      URL.revokeObjectURL(url);
      setDownloadPopupOpen(false);
    } catch (error) {
      console.error("PDF generation error:", error);
      alert("PDF డౌన్‌లోడ్ సమయంలో ఎర్రర్ సంభవించింది");
    }
  };

  /* ================= DOCX DOWNLOAD ================= */
  const downloadDocx = async () => {
    try {
      alert("DOCX ఫార్మాట్ త్వరలో అందుబాటులో ఉంటుంది");
      setDownloadPopupOpen(false);
    } catch (error) {
      console.error("DOCX generation error:", error);
      alert("DOCX డౌన్‌లోడ్ సమయంలో ఎర్రర్ సంభవించింది");
    }
  };

  const handleDownload = (format: "pdf" | "docx") => {
    if (format === "pdf") {
      downloadPdf();
    } else if (format === "docx") {
      downloadDocx();
    }
  };

  return (
    <div className="h-screen overflow-hidden bg-linear-to-br from-slate-100 via-slate-50 to-slate-100 flex flex-col">
      {/* ================= HEADER ================= */}
      <nav className="bg-white shadow-md border-b border-slate-200 shrink-0">
        <div className="max-w-full px-6 py-4 flex items-center justify-between">
          {/* Left - Logo & Title */}
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-linear-to-br from-blue-600 to-blue-700 flex items-center justify-center shadow-lg">
              <FileText className="text-white" size={20} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">
                గ్రామ పంచాయతీ నివేదిక
              </h1>
              <p className="text-xs text-slate-500">ఆడిట్ జెనరేటర్</p>
            </div>
          </div>

          {/* Right - Action Buttons */}
          <div className="flex items-center gap-3">
            {/* Toggle Editor Button */}
            <button
              onClick={() => setEditorActive(!editorActive)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all ${
                editorActive
                  ? "bg-blue-600 text-white hover:bg-blue-700"
                  : "bg-slate-200 text-slate-800 hover:bg-slate-300"
              }`}
            >
              <Edit2 size={18} />
              {editorActive ? "సవరణ విస్మరించండి" : "సవరించండి"}
            </button>

            {/* Download Button */}
            <button
              onClick={() => setDownloadPopupOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-all"
            >
              <Download size={18} />
              డౌన్‌లోడ్
            </button>
          </div>
        </div>
      </nav>

      {/* ================= MAIN CONTENT ================= */}
      <div className="flex-1 flex flex-col px-6 py-6 min-h-0 overflow-hidden gap-6">
        <div className="grid grid-cols-3 gap-6 h-full min-h-0">
          {/* ================= LEFT - PREVIEW (SCROLLABLE) ================= */}
          <div className="col-span-2 overflow-y-auto space-y-6 pr-4 min-h-0">
            <div>
              <PagePreview
                blocks={page1Blocks}
                pageNo={1}
                isEditing={editorActive}
                editor={currentEditor}
                onEditorReady={setCurrentEditor}
              />
            </div>
            <div>
              <PagePreview
                blocks={page2Blocks}
                pageNo={2}
                isEditing={editorActive}
                editor={currentEditor}
                onEditorReady={setCurrentEditor}
              />
            </div>
          </div>

          {/* ================= RIGHT - FORM ================= */}
          <div className="col-span-1 h-full flex flex-col min-h-0">
            {/* Form Card */}
            <div className="bg-white rounded-xl shadow-lg border border-slate-300 h-full flex flex-col overflow-hidden min-h-0">
              {/* Header */}
              <div className="flex items-center gap-3 bg-linear-to-r from-blue-600 to-blue-700 px-6 py-4 border-b border-blue-400 shrink-0">
                <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                  <span className="text-white text-sm font-bold">⚙</span>
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">
                    వివరాలు సవరించండి
                  </h2>
                  <p className="text-xs text-blue-100">రిపోర్టర్ డేటా</p>
                </div>
              </div>

              {/* Scrollable Form Content */}
              <div
                ref={formScrollRef}
                className="flex-1 overflow-y-auto px-5 py-5 space-y-5 min-h-0 bg-linear-to-b from-slate-50 to-white"
              >
                {/* Page 1 Section */}
                <div>
                  <h3 className="text-xs font-bold text-slate-800 mb-3 uppercase tracking-wider border-b-2 border-blue-300 pb-2">
                    📄 పేజీ 1
                  </h3>
                  <div className="space-y-2.5">
                    <Input
                      label="గ్రామ పంచాయతీ పేరు"
                      value={gpName}
                      onChange={setGpName}
                    />
                    <Input
                      label="మండలం"
                      value={mandal}
                      onChange={setMandal}
                    />
                    <Input
                      label="జిల్లా"
                      value={district}
                      onChange={setDistrict}
                    />
                    <Input
                      label="ఆర్థిక సంవత్సరం"
                      value={financialYear}
                      onChange={setFinancialYear}
                    />
                    <Input
                      label="ఆడిట్ నివేదిక తేదీ"
                      value={reportDate}
                      onChange={setReportDate}
                    />
                    <Input
                      label="ఆడిట్ రిపోర్టర్ పేరు"
                      value={auditorName}
                      onChange={setAuditorName}
                    />
                  </div>
                </div>

                {/* Page 2 Section */}
                <div>
                  <h3 className="text-xs font-bold text-slate-800 mb-3 uppercase tracking-wider border-b-2 border-blue-300 pb-2">
                    📄 పేజీ 2
                  </h3>
                  <div className="space-y-2.5">
                    <Input
                      label="సర్పంచ్ పేరు"
                      value={sarpanch}
                      onChange={setSarpanch}
                    />
                    <Input
                      label="కార్యదర్శి పేరు"
                      value={secretary}
                      onChange={setSecretary}
                    />
                    <Input
                      label="మొత్తం ఆదాయం"
                      value={income}
                      onChange={setIncome}
                    />
                    <Input
                      label="మొత్తం వ్యయం"
                      value={expense}
                      onChange={setExpense}
                    />
                    <Input
                      label="తేదీ"
                      value={finalDate}
                      onChange={setFinalDate}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Download Popup */}
      <DownloadPopup
        isOpen={downloadPopupOpen}
        onClose={() => setDownloadPopupOpen(false)}
        onDownload={handleDownload}
      />

      <style jsx>{`
        ::-webkit-scrollbar {
          width: 8px;
        }

        ::-webkit-scrollbar-track {
          background: transparent;
        }

        ::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 4px;
        }

        ::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}</style>
    </div>
  );
}