"use client";

import { useState, useRef } from "react";
import { PDFDocument, rgb } from "pdf-lib";
import { Download, FileText } from "lucide-react";

/* ================= DOCUMENT BLOCK TYPE ================= */
type Block = {
  type: "heading" | "paragraph";
  text: string;
  align?: "left" | "center" | "right" | "justify";
  bold?: boolean;
  italic?: boolean;
  color?: string;
};

/* ================= BLOCK RENDERER ================= */
function renderBlock(block: Block, index: number) {
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
        className={`text-sm mb-6 ${alignClass}`}
        style={style}
      >
        {block.text}
      </h2>
    );
  }

  return (
    <p
      key={index}
      className={`text-sm whitespace-pre-line leading-7 mb-4 ${alignClass}`}
      style={style}
    >
      {block.text}
    </p>
  );
}

/* ================= A4 PAGE PREVIEW ================= */
function PagePreview({
  blocks,
  pageNo,
}: {
  blocks: Block[];
  pageNo: number;
}) {
  return (
    <div className="mx-auto w-[210mm] h-[297mm] bg-white rounded-lg shadow-lg flex flex-col border border-slate-300 shrink-0">
      <div className="flex-1 overflow-y-auto px-[3vw] py-[4vh]">
        {blocks.map(renderBlock)}
      </div>
      <div className="text-center text-xs py-3 text-slate-400">
        Page {pageNo}
      </div>
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
  const [reportDate, setReportDate] = useState("15-14-2025");
  const [auditorName, setAuditorName] = useState("శ్రీ కె. సత్యనారాయణ");

  /* ---------- PAGE 2 FORM ---------- */
  const [sarpanch, setSarpanch] = useState("శ్రీమతి ఎస్. సావిత్రమ్మ");
  const [secretary, setSecretary] = useState("శ్రీ ఎం. శ్రీనివాస్");
  const [income, setIncome] = useState("28,75,000");
  const [expense, setExpense] = useState("27,90,000");
  const [finalDate, setFinalDate] = useState("15-03-2025");

  const formScrollRef = useRef<HTMLDivElement>(null);

  /* ================= PAGE BLOCKS ================= */
  const page1Blocks: Block[] = [
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
      text:
        "గ్రామ పంచాయతీ పరిధిలో నిర్వహించబడిన అభివృద్ధి కార్యక్రమాలు, నిధుల వినియోగం, ఆదాయ–వ్యయాల వివరాలు, రికార్డుల నిర్వహణ తదితర అంశాలపై ఈ ఆడిట్ నివేదికను మండల ఆడిట్ రిపోర్టర్ గారికి సమర్పిస్తున్నాము.",
      align: "justify",
    },
    {
      type: "paragraph",
      text: `ఆడిట్ రిపోర్టర్ పేరు : ${auditorName}`,
      bold: true,
    },
  ];

  const page2Blocks: Block[] = [
    {
      type: "heading",
      text: "గ్రామ పంచాయతీ పాలకవర్గ వివరాలు",
      bold: true,
    },
    {
      type: "paragraph",
      text: `సర్పంచ్ పేరు : ${sarpanch}
పంచాయతీ కార్యదర్శి : ${secretary}`,
    },
    {
      type: "heading",
      text: "ఆర్థిక వివరాలు",
      bold: true,
    },
    {
      type: "paragraph",
      text: `మొత్తం ఆదాయం రూ. ${income}/-
మొత్తం వ్యయం రూ. ${expense}/-`,
    },
    {
      type: "paragraph",
      text:
        "ఈ ఆడిట్ నివేదికలో పొందుపరిచిన సమాచారం పంచాయతీ రికార్డుల ఆధారంగా సమర్పించబడినదిగా తెలియజేస్తున్నాము.",
      align: "justify",
    },
    {
      type: "paragraph",
      text: `తేదీ : ${finalDate}`,
    },
  ];

  /* ================= PDF DOWNLOAD ================= */
  const downloadPdf = async () => {
    const pdfDoc = await PDFDocument.create();

    const fontBytes = await fetch(
      "/fonts/NotoSansTelugu-Regular.ttf"
    ).then((r) => r.arrayBuffer());

    const font = await pdfDoc.embedFont(fontBytes);

    [page1Blocks, page2Blocks].forEach((blocks) => {
      const page = pdfDoc.addPage([595, 842]);
      let y = 780;

      blocks.forEach((block) => {
        page.drawText(block.text, {
          x: block.align === "center" ? 150 : 50,
          y,
          size: 12,
          font,
          maxWidth: 495,
          lineHeight: 16,
          color: rgb(0, 0, 0),
        });
        y -= 50;
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
  };

  return (
    <div className="h-screen overflow-hidden bg-linear-to-br from-slate-100 via-gray-100 to-slate-100 flex flex-col">
      {/* Top Navigation Bar */}
      <nav className="bg-white shadow-md border-b border-slate-200 shrink-0">
        <div className="max-w-full px-8 py-3 flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-linear-to-br from-slate-500 to-gray-600 flex items-center justify-center shadow-lg">
            <FileText className="text-white" size={20} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">గ్రామ పంచాయతీ</h1>
            <p className="text-sm text-slate-500">ఆడిట్ నివేదిక జెనరేటర్</p>
          </div>
        </div>
      </nav>

      {/* Main Content - Takes remaining space */}
      <div className="flex-1 flex flex-col px-6 py-6 min-h-0 overflow-hidden">
        <div className="grid grid-cols-3 gap-6 h-full min-h-0">
          {/* ================= LEFT - PREVIEW (SCROLLABLE) ================= */}
          <div className="col-span-2 overflow-y-auto space-y-8 pr-4 min-h-0">
            <div>
              <PagePreview blocks={page1Blocks} pageNo={1} />
            </div>
            <div>
              <PagePreview blocks={page2Blocks} pageNo={2} />
            </div>
          </div>

          {/* ================= RIGHT - FORM ================= */}
          <div className="col-span-1 h-full flex flex-col min-h-0">
            {/* Form Card with Scroll */}
            <div className="bg-slate-100 rounded-xl shadow-2xl border border-slate-300 h-full flex flex-col overflow-hidden min-h-0">
              {/* Header */}
              <div className="flex items-center gap-3 bg-linear-to-r from-slate-500 to-slate-600 px-6 py-5 border-b border-blue-400 shrink-0">
                <h2 className="text-lg font-bold text-white">వివరాలు సవరించండి</h2>
                <p className="text-xs text-blue-100 mt-1">అన్ని క్షేత్రాలను నిండిపెట్టండి</p>
              </div>

              {/* Scrollable Form Content */}
              <div
                ref={formScrollRef}
                className="flex-1 overflow-y-auto px-6 py-6 space-y-6 min-h-0"
              >
                {/* Page 1 Section */}
                <div>
                  <h3 className="text-sm font-bold text-slate-700 mb-4 uppercase tracking-wider border-b-2 border-slate-400 pb-2">
                    పేజీ 1 వివరాలు
                  </h3>
                  <div className="space-y-3">
                    <Input
                      label="గ్రామ పంచాయతీ పేరు"
                      v={gpName}
                      s={setGpName}
                    />
                    <Input label="మండలం" v={mandal} s={setMandal} />
                    <Input label="జిల్లా" v={district} s={setDistrict} />
                    <Input
                      label="ఆర్థిక సంవత్సరం"
                      v={financialYear}
                      s={setFinancialYear}
                    />
                    <Input
                      label="ఆడిట్ నివేదిక తేదీ"
                      v={reportDate}
                      s={setReportDate}
                    />
                    <Input
                      label="ఆడిట్ రిపోర్టర్ పేరు"
                      v={auditorName}
                      s={setAuditorName}
                    />
                  </div>
                </div>

                {/* Page 2 Section */}
                <div>
                  <h3 className="text-sm font-bold text-slate-700 mb-4 uppercase tracking-wider border-b-2 border-slate-400 pb-2">
                    పేజీ 2 వివరాలు
                  </h3>
                  <div className="space-y-3">
                    <Input label="సర్పంచ్ పేరు" v={sarpanch} s={setSarpanch} />
                    <Input
                      label="కార్యదర్శి పేరు"
                      v={secretary}
                      s={setSecretary}
                    />
                    <Input
                      label="మొత్తం ఆదాయం"
                      v={income}
                      s={setIncome}
                    />
                    <Input
                      label="మొత్తం వ్యయం"
                      v={expense}
                      s={setExpense}
                    />
                    <Input label="తేదీ" v={finalDate} s={setFinalDate} />
                  </div>
                </div>
              </div>

              {/* Download Button (Fixed at Bottom) */}
              <div className="bg-slate-100 px-6 py-4 border-t border-slate-300 shrink-0">
                <button
                  onClick={downloadPdf}
                  className="cursor-pointer w-full bg-linear-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white py-3 px-4 rounded-lg font-bold flex items-center justify-center gap-2 transition-all duration-200 shadow-lg hover:shadow-xl active:scale-95"
                >
                  <Download size={20} />
                  PDF డౌన్‌లోడ్
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        /* Custom scrollbar styling */
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

/* ================= UI HELPERS ================= */
function Input({
  label,
  v,
  s,
}: {
  label: string;
  v: string;
  s: (v: string) => void;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">
        {label}
      </label>
      <input
        value={v}
        onChange={(e) => s(e.target.value)}
        className="w-full border-2 border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 bg-white font-medium"
        placeholder={label}
      />
    </div>
  );
}