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
  const printWindow = window.open("", "_blank", "noopener,noreferrer");

  if (!printWindow) {
    return;
  }

  const tableRows = exportableRows
    .map(
      (row) => `
        <tr>
          ${exportHeaders
            .map((header) => `<td>${escapeHtml(row[header])}</td>`)
            .join("")}
        </tr>
      `,
    )
    .join("");

  printWindow.document.write(`
    <!doctype html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <title>${escapeHtml(title)}</title>
        <style>
          body {
            font-family: Inter, system-ui, sans-serif;
            margin: 24px;
            color: #17201f;
          }
          h1 {
            margin: 0 0 8px;
            font-size: 24px;
          }
          p {
            margin: 0 0 24px;
            color: #4b635f;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            table-layout: fixed;
          }
          th, td {
            border: 1px solid #cfe0dc;
            padding: 8px;
            text-align: left;
            vertical-align: top;
            word-break: break-word;
            font-size: 12px;
          }
          th {
            background: #e3f1ee;
          }
          @media print {
            body {
              margin: 12px;
            }
          }
        </style>
      </head>
      <body>
        <h1>${escapeHtml(title)}</h1>
        <p>${escapeHtml(`${rows.length} rows exported on ${new Date().toLocaleString()}`)}</p>
        <table>
          <thead>
            <tr>
              ${exportHeaders.map((header) => `<th>${escapeHtml(header)}</th>`).join("")}
            </tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>
      </body>
    </html>
  `);
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
}
