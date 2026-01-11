"use client";

import { useState, useRef, useCallback, useMemo } from "react";
import { Download, FileText, Edit2, X } from "lucide-react";
import { LexicalEditor as LexicalEditorType } from "lexical";
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  AlignmentType,
  PageBreak,
  Table,
  TableRow,
  TableCell,
  WidthType,
} from "docx";
import { saveAs } from "file-saver";
import {
  DocumentEditor,
  TableRenderer,
  type Block,
} from "@/components/lexicalEditor";

/* ================= TYPES ================= */
interface DownloadPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onDownload: (format: "pdf" | "docx") => void;
}

interface PagePreviewProps {
  blocks: Block[];
  pageNo: number;
  isEditing: boolean;
  onEditorReady: (editor: LexicalEditorType) => void;
}

interface InputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
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
            <h2 className="text-lg font-semibold text-slate-800">
              Download Format
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
            className="w-full p-4 border-2 border-blue-300 rounded-lg hover:bg-blue-50 transition flex items-center gap-3 cursor-pointer"
          >
            <div className="w-10 h-10 rounded bg-red-100 flex items-center justify-center">
              <span className="text-red-600 font-bold text-sm">PDF</span>
            </div>
            <div className="text-left">
              <p className="font-semibold text-slate-900">PDF Format</p>
              <p className="text-xs text-slate-500">ప్రింట్ కోసం సిద్ధం</p>
            </div>
          </button>

          <button
            onClick={() => onDownload("docx")}
            className="w-full p-4 border-2 border-blue-300 rounded-lg hover:bg-blue-50 transition flex items-center gap-3 cursor-pointer"
          >
            <div className="w-10 h-10 rounded bg-blue-100 flex items-center justify-center">
              <span className="text-blue-600 font-bold text-sm">DOC</span>
            </div>
            <div className="text-left">
              <p className="font-semibold text-slate-900">DOCX Format</p>
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

/* ================= A4 PAGE PREVIEW WITH INTEGRATED EDITOR ================= */
function PagePreview({
  blocks,
  pageNo,
  isEditing,
  onEditorReady,
}: PagePreviewProps) {
  if (isEditing) {
    return (
      <div className="mx-auto w-[210mm] h-[297mm] bg-white rounded-lg shadow-lg flex flex-col border-2 border-blue-500 shrink-0 overflow-hidden">
        <DocumentEditor
          blocks={blocks}
          onEditorReady={onEditorReady}
          pageNo={pageNo}
        />
        <div className="text-center text-xs py-3 text-slate-400 border-t border-slate-200">
          Page {pageNo}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-[210mm] h-[297mm] bg-white rounded-lg shadow-lg flex flex-col border-2 border-slate-300 shrink-0">
      <div className="flex-1 overflow-y-auto px-5 py-7 text-slate-900">
        {blocks && blocks.length > 0 ? (
          blocks.map((block, index) => {
            // Handle table blocks
            if (block.type === "table" && block.rows) {
              return <TableRenderer key={index} rows={block.rows} />;
            }

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
              fontSize: block.fontSize ? `${block.fontSize}px` : "14px",
              lineHeight: "1.7",
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
          <div className="text-slate-600 text-center py-10">
            పేజీ ఖాళీగా ఉంది
          </div>
        )}
      </div>

      <div className="text-center text-xs py-3 text-slate-400">
        Page {pageNo}
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
                fontSize: 18

      },
      {
        type: "paragraph",
        text: "(మండల ఆడిట్ రిపోర్టర్‌కు సమర్పించుటకు)",
        align: "center",
      },
      {
        type: "paragraph",
        text: `గ్రామ పంచాయతీ పేరు : ${gpName}\n మండలం : ${mandal}\n జిల్లా : ${district}\n ఆర్థిక సంవత్సరం : ${financialYear}\n ఆడిట్ నివేదిక తేదీ : ${reportDate}`,
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
        align: "center",
        bold: true,
                fontSize: 18

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

  const generatePage3Blocks = useCallback(
    (): Block[] => [
      {
        type: "heading",
        text: "ఆదాయ-వ్యయాల వివరాలు",
        align: "center",
        bold: true,
        fontSize: 18
      },
      {
        type: "paragraph",
        text: `ఆర్థిక సంవత్సరం: ${financialYear}`,
        align: "center",
      },
      {
        type: "table",
        rows: [
          {
            cells: [
              { text: "క్ర.సం.", bold: true },
              { text: "వివరణ", bold: true },
              { text: "ఆదాయం (రూ.)", bold: true },
              { text: "వ్యయం (రూ.)", bold: true },
            ],
          },
          {
            cells: [
              { text: "1" },
              { text: "ప్రభుత్వ గ్రాంట్లు" },
              { text: "15,00,000" },
              { text: "-" },
            ],
          },
          {
            cells: [
              { text: "2" },
              { text: "పన్నుల ద్వారా ఆదాయం" },
              { text: "8,50,000" },
              { text: "-" },
            ],
          },
          {
            cells: [
              { text: "3" },
              { text: "ఇతర ఆదాయం" },
              { text: "5,25,000" },
              { text: "-" },
            ],
          },
          {
            cells: [
              { text: "4" },
              { text: "వేతనాలు & భత్యాలు" },
              { text: "-" },
              { text: "12,00,000" },
            ],
          },
          {
            cells: [
              { text: "5" },
              { text: "అభివృద్ధి పనులు" },
              { text: "-" },
              { text: "10,50,000" },
            ],
          },
          {
            cells: [
              { text: "6" },
              { text: "నిర్వహణ ఖర్చులు" },
              { text: "-" },
              { text: "5,40,000" },
            ],
          },
          {
            cells: [
              { text: "" },
              { text: "మొత్తం", bold: true },
              { text: income, bold: true },
              { text: expense, bold: true },
            ],
          },
        ],
      },
      {
        type: "paragraph",
        text: "పై వివరాలు గ్రామ పంచాయతీ రికార్డుల ఆధారంగా సమర్పించబడినవి.",
        align: "justify",
      },
      {
        type: "paragraph",
        text: `సర్పంచ్: ${sarpanch}`,
        align: "left",
        bold: true,
      },
      {
        type: "paragraph",
        text: `కార్యదర్శి: ${secretary}`,
        align: "left",
        bold: true,
      },
    ],
    [financialYear, income, expense, sarpanch, secretary]
  );

  const page1Blocks = useMemo(
    () => generatePage1Blocks(),
    [generatePage1Blocks]
  );
  const page2Blocks = useMemo(
    () => generatePage2Blocks(),
    [generatePage2Blocks]
  );
  const page3Blocks = useMemo(
    () => generatePage3Blocks(),
    [generatePage3Blocks]
  );

  /* ================= PDF DOWNLOAD ================= */
  const downloadPdf = async () => {
    try {
      const html2canvas = (await import("html2canvas")).default;
      const { jsPDF } = await import("jspdf");

      // Temp container
      const container = document.createElement("div");
      container.style.position = "absolute";
      container.style.left = "-9999px";
      container.style.top = "0";
      container.style.background = "white";
      document.body.appendChild(container);

      const pdf = new jsPDF("p", "mm", "a4");

      const pageWidth = 210;
      const pageHeight = 297;
      const margin = 5;
      const contentWidth = pageWidth - margin * 2;

      const allPages = [
        page1Blocks,
        page2Blocks,
        page3Blocks,
      ];

      for (let i = 0; i < allPages.length; i++) {
        if (i > 0) pdf.addPage();

        const blocks = allPages[i];

        /* ===== A4 PAGE WRAPPER ===== */
        const pageDiv = document.createElement("div");
        pageDiv.style.width = "595px";
        pageDiv.style.height = "842px"; // FIXED A4 HEIGHT
        pageDiv.style.padding = "20px";
        pageDiv.style.boxSizing = "border-box";
        pageDiv.style.display = "flex";
        pageDiv.style.flexDirection = "column";
        pageDiv.style.background = "white";
        pageDiv.style.fontFamily = "Arial, sans-serif";
        pageDiv.style.color = "black";

        /* ===== CONTENT AREA ===== */
        const contentDiv = document.createElement("div");
        contentDiv.style.flex = "1";

        blocks.forEach((block) => {
          if (block.type === "table" && block.rows) {
            const table = document.createElement("table");
            table.style.width = "100%";
            table.style.borderCollapse = "collapse";
            table.style.marginBottom = "16px";

            block.rows.forEach((row) => {
              const tr = document.createElement("tr");

              row.cells.forEach((cell) => {
                const td = document.createElement("td");

                td.textContent = cell.text;
                td.style.border = "2px solid #333";
                td.style.padding = "8px";
                td.style.fontSize = "12px";

                if (cell.bold) td.style.fontWeight = "bold";
                if (cell.align) td.style.textAlign = cell.align;

                tr.appendChild(td);
              });

              table.appendChild(tr);
            });


            contentDiv.appendChild(table);
          } else {
            const el = document.createElement(
              block.type === "heading" ? "h2" : "p"
            );
            el.textContent = block.text || "";
            el.style.margin = "0 0 16px 0";
            const fontPx =
              block.fontSize ??
              (block.type === "heading" ? 16 : 12);

            el.style.fontSize = `${fontPx}px`;
            el.style.fontWeight =
              block.bold || block.type === "heading" ? "bold" : "normal";
            el.style.fontStyle = block.italic ? "italic" : "normal";
            el.style.textAlign = block.align || "left";
            el.style.lineHeight = "1.8";
            el.style.whiteSpace = "pre-wrap";

            contentDiv.appendChild(el);
          }
        });

        pageDiv.appendChild(contentDiv);

        /* ===== FOOTER ===== */
        const pageNum = document.createElement("div");
        pageNum.textContent = `Page ${i + 1}`;
        pageNum.style.textAlign = "center";
        pageNum.style.fontSize = "12px";
        pageNum.style.color = "#666";
        pageNum.style.marginTop = "auto"; // STICKS TO BOTTOM

        pageDiv.appendChild(pageNum);

        container.innerHTML = "";
        container.appendChild(pageDiv);

        /* ===== RENDER TO PDF ===== */
        const canvas = await html2canvas(pageDiv, {
          scale: 2,
          useCORS: true,
          backgroundColor: "#ffffff",
        });

        const imgData = canvas.toDataURL("image/jpeg", 0.95);
        const imgHeight = (canvas.height * contentWidth) / canvas.width;

        pdf.addImage(
          imgData,
          "JPEG",
          margin,
          margin,
          contentWidth,
          pageHeight - margin * 2
        );
      }

      document.body.removeChild(container);
      pdf.save("grama_panchayati_audit_report.pdf");
      setDownloadPopupOpen(false);
    } catch (error) {
      console.error("PDF generation error:", error);
      alert("PDF డౌన్‌లోడ్ సమయంలో లోపం వచ్చింది");
    }
  };


  /* ================= DOCX DOWNLOAD ================= */

  const downloadDocx = async () => {
    try {
      const getAlignment = (align?: string) => {
        switch (align) {
          case "center":
            return AlignmentType.CENTER;
          case "right":
            return AlignmentType.RIGHT;
          case "justify":
            return AlignmentType.JUSTIFIED;
          default:
            return AlignmentType.LEFT;
        }
      };

      // ---- TABLE CREATION ----
      const createDocxTable = (
        rows: {
          cells: {
            text: string;
            bold?: boolean;
            align?: "left" | "center" | "right";
          }[];
        }[]
      ) => {
        return new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: rows.map(
            (row) =>
              new TableRow({
                children: row.cells.map(
                  (cell) =>
                    new TableCell({
                      children: [
                        new Paragraph({
                          children: [
                            new TextRun({
                              text: cell.text,
                              bold: cell.bold,
                              font: "Arial",
                              size: 24, // 12px table text
                            }),
                          ],
                        }),
                      ],
                    })
                ),
              })
          ),
        });
      };

      // ---- BLOCK → DOC ELEMENTS ----
      const createDocElements = (
        blocks: Block[],
        addPageBreak: boolean = false
      ) => {
        const elements: (Paragraph | Table)[] = [];

        blocks.forEach((block) => {
          if (block.type === "table" && block.rows) {
            elements.push(createDocxTable(block.rows));
          } else {
            // 🔑 px → docx (half-points)
            const fontPx =
              block.fontSize ??
              (block.type === "heading" ? 16 : 12);

            elements.push(
              new Paragraph({
                children: [
                  new TextRun({
                    text: block.text || "",
                    bold: block.bold || block.type === "heading",
                    italics: block.italic,
                    font: "Arial",
                    size: fontPx * 2, // ⭐ IMPORTANT FIX
                  }),
                ],
                alignment: getAlignment(block.align),
                spacing: {
                  after: 200,
                  line: 360,
                },
              })
            );
          }
        });

        if (addPageBreak) {
          elements.push(
            new Paragraph({
              children: [new PageBreak()],
            })
          );
        }

        return elements;
      };

      //margin of the page
      const doc = new Document({
        sections: [
          {
            properties: {
              page: {
                margin: {
                  top: 720,    // 0.5 inch
                  bottom: 720,
                  left: 720,
                  right: 720,
                },
              },
            },
            children: [
              ...createDocElements(page1Blocks, true),
              ...createDocElements(page2Blocks, true),
              ...createDocElements(page3Blocks, false),
            ],
          },
        ],
      });


      const blob = await Packer.toBlob(doc);
      saveAs(blob, "grama_panchayati_audit_report.docx");
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
        <div className="max-w-full px-3 md:px-6 py-3 md:py-4 flex items-center justify-between">
          {/* Left - Logo & Title */}
          <div className="flex items-center gap-4">
            <div className="w-8 md:w-10 h-8 md:h-10 rounded-lg bg-linear-to-br from-blue-600 to-blue-700 flex items-center justify-center shadow-lg">
              <FileText className="text-white" size={20} />
            </div>
            <div>
              <h1 className="text-sm md:text-xl font-bold text-slate-900">
                గ్రామ పంచాయతీ నివేదిక
              </h1>
              <p className="text-[10px] md:text-xs text-slate-500">ఆడిట్ జెనరేటర్</p>
            </div>
          </div>

          {/* Right - Action Buttons */}
          <div className="flex items-center gap-3">
            {/* Toggle Editor Button */}
            <button
              onClick={() => setEditorActive(!editorActive)}
              className={`text-sm md:text-base flex items-center gap-2 px-2 md:px-4 py-2.5 rounded-lg font-medium transition-all ${editorActive
                ? "bg-blue-600 text-white hover:bg-blue-700"
                : "bg-slate-200 text-slate-700 hover:bg-slate-300"
                } whitespace-nowrap`}
            >
              <Edit2 className="h-4 md:h-5 w-4 md:w-5" />
              {editorActive ? "Cancel Edit" : "Edit Mode"}
            </button>

            {/* Download Button */}
            <button
              onClick={() => setDownloadPopupOpen(true)}
              className="ext-sm md:text-base flex items-center gap-2 px-2 md:px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-all"
            >
              <Download className="h-4 md:h-5 w-4 md:w-5" />
              Download
            </button>
          </div>
        </div>
      </nav>

      {/* ================= MAIN CONTENT ================= */}
      <div className="flex-1 flex flex-col p-2.5 md:p-5 min-h-0 overflow-hidden gap-6">
<div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-6 h-full min-h-0 overflow-y-auto">
          {/* ================= LEFT - PREVIEW (SCROLLABLE) ================= */}
  <div className="md:col-span-2 flex flex-col gap-6 h-[60vh] md:h-[85vh] overflow-y-auto">
                <div>
              <PagePreview
                blocks={page1Blocks}
                pageNo={1}
                isEditing={editorActive}
                onEditorReady={setCurrentEditor}
              />
            </div>
            <div>
              <PagePreview
                blocks={page2Blocks}
                pageNo={2}
                isEditing={editorActive}
                onEditorReady={setCurrentEditor}
              />
            </div>
            <div>
              <PagePreview
                blocks={page3Blocks}
                pageNo={3}
                isEditing={editorActive}
                onEditorReady={setCurrentEditor}
              />
            </div>
          </div>

          {/* ================= RIGHT - FORM ================= */}
  <div className="md:col-span-1 flex flex-col">
            {/* Form Card */}
            <div className="bg-white rounded-xl shadow-lg border border-slate-300 h-full flex flex-col overflow-hidden min-h-0">
              {/* Header */}
              <div className="flex items-center gap-3 bg-linear-to-r from-blue-600 to-blue-700 px-6 py-4 border-b border-blue-400 shrink-0">

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
                  <h3 className="text-xs font-bold text-slate-800 mb-3  tracking-wider border-b-2 border-blue-300 pb-2">
                    Page 1
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
                  <h3 className="text-xs font-bold text-slate-800 mb-3  tracking-wider border-b-2 border-blue-300 pb-2">
                    Page 2
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