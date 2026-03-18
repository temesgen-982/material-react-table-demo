import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

import type { Post } from "./types";

type ExportablePost = {
  id: number;
  title: string;
  body: string;
  tags: string;
  likes: number;
  dislikes: number;
  views: number;
  userId: number;
};

const exportHeaders: Array<keyof ExportablePost> = [
  "id",
  "title",
  "body",
  "tags",
  "likes",
  "dislikes",
  "views",
  "userId",
];

function toExportablePost(post: Post): ExportablePost {
  return {
    id: post.id,
    title: post.title,
    body: post.body,
    tags: post.tags.join(", "),
    likes: post.reactions.likes,
    dislikes: post.reactions.dislikes,
    views: post.views,
    userId: post.userId,
  };
}

function escapeCsvValue(value: string | number) {
  const stringValue = String(value).replace(/"/g, '""');
  return `"${stringValue}"`;
}

function downloadFile(contents: string, fileName: string, mimeType: string) {
  const blob = new Blob([contents], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = fileName;
  link.click();

  URL.revokeObjectURL(url);
}

function escapeHtml(value: string | number) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function openAndDownloadBlob(blob: Blob, fileName: string) {
  const blobUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = blobUrl;
  link.download = fileName;
  link.click();

  window.setTimeout(() => {
    URL.revokeObjectURL(blobUrl);
  }, 60_000);
}

export function exportPostsToCsv(rows: Post[], fileName: string) {
  const exportableRows = rows.map(toExportablePost);
  const csv = [
    exportHeaders.join(","),
    ...exportableRows.map((row) =>
      exportHeaders.map((header) => escapeCsvValue(row[header])).join(","),
    ),
  ].join("\n");

  downloadFile(csv, fileName, "text/csv;charset=utf-8;");
}

export function exportPostsToPdf(rows: Post[], title: string) {
  const exportableRows = rows.map(toExportablePost);
  const doc = new jsPDF({
    orientation: "landscape",
    unit: "pt",
    format: "a4",
  });
  const exportTime = new Date().toLocaleString();
  const fileName = `${title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "posts-export"}.pdf`;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text(title, 40, 40);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(`${rows.length} rows exported on ${exportTime}`, 40, 60);

  autoTable(doc, {
    startY: 76,
    head: [exportHeaders],
    body: exportableRows.map((row) => exportHeaders.map((header) => String(row[header]))),
    styles: {
      font: "helvetica",
      fontSize: 8,
      cellPadding: 6,
      overflow: "linebreak",
      valign: "top",
    },
    headStyles: {
      fillColor: [227, 241, 238],
      textColor: [23, 32, 31],
      fontStyle: "bold",
    },
    bodyStyles: {
      textColor: [23, 32, 31],
    },
    margin: {
      top: 76,
      right: 40,
      bottom: 40,
      left: 40,
    },
    columnStyles: {
      0: { cellWidth: 38 },
      1: { cellWidth: 180 },
      2: { cellWidth: 250 },
      3: { cellWidth: 120 },
      4: { cellWidth: 55 },
      5: { cellWidth: 60 },
      6: { cellWidth: 55 },
      7: { cellWidth: 50 },
    },
  });

  openAndDownloadBlob(doc.output("blob"), fileName);
}
