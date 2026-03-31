/**
 * Converts SYSTEM_WRITEUP.md to a print-ready HTML file.
 * Open the output in any browser and use File → Print → Save as PDF.
 *
 * Usage: node scripts/export-writeup-html.js
 */

const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const mdPath = path.join(root, 'SYSTEM_WRITEUP.md');
const outPath = path.join(root, 'SYSTEM_WRITEUP.html');

const md = fs.readFileSync(mdPath, 'utf8');

// ---------------------------------------------------------------------------
// Minimal Markdown → HTML renderer (headings, tables, code, lists, bold,
// inline code, horizontal rules, paragraphs). No external dependencies.
// ---------------------------------------------------------------------------
function renderMarkdown(src) {
  const lines = src.split('\n');
  const out = [];
  let inTable = false;
  let tableHeaderDone = false;
  let inCode = false;
  let inUl = false;
  let inOl = false;

  function closeList() {
    if (inUl) { out.push('</ul>'); inUl = false; }
    if (inOl) { out.push('</ol>'); inOl = false; }
  }

  function closeTable() {
    if (inTable) { out.push('</tbody></table>'); inTable = false; tableHeaderDone = false; }
  }

  function inline(text) {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/`(.+?)`/g, '<code>$1</code>')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
  }

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    const line = raw.trimEnd();

    // Fenced code blocks
    if (line.startsWith('```')) {
      if (inCode) { out.push('</code></pre>'); inCode = false; }
      else { closeList(); closeTable(); out.push('<pre><code>'); inCode = true; }
      continue;
    }
    if (inCode) { out.push(line.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')); continue; }

    // Table rows
    if (line.startsWith('|')) {
      closeList();
      const cells = line.split('|').slice(1, -1).map(c => c.trim());
      const isSep = cells.every(c => /^[-:]+$/.test(c));
      if (isSep) { tableHeaderDone = true; out.push('</thead><tbody>'); continue; }
      if (!inTable) {
        out.push('<table><thead>');
        inTable = true;
        tableHeaderDone = false;
      }
      const tag = inTable && !tableHeaderDone ? 'th' : 'td';
      out.push('<tr>' + cells.map(c => `<${tag}>${inline(c)}</${tag}>`).join('') + '</tr>');
      continue;
    } else {
      closeTable();
    }

    // Horizontal rule
    if (/^---+$/.test(line)) { closeList(); out.push('<hr>'); continue; }

    // Headings
    const hMatch = line.match(/^(#{1,6})\s+(.*)/);
    if (hMatch) {
      closeList();
      const level = hMatch[1].length;
      out.push(`<h${level}>${inline(hMatch[2])}</h${level}>`);
      continue;
    }

    // Ordered list
    const olMatch = line.match(/^(\d+)\.\s+(.*)/);
    if (olMatch) {
      if (!inOl) { if (inUl) { out.push('</ul>'); inUl = false; } out.push('<ol>'); inOl = true; }
      out.push(`<li>${inline(olMatch[2])}</li>`);
      continue;
    }

    // Unordered list
    const ulMatch = line.match(/^[-*]\s+(.*)/);
    if (ulMatch) {
      if (!inUl) { if (inOl) { out.push('</ol>'); inOl = false; } out.push('<ul>'); inUl = true; }
      out.push(`<li>${inline(ulMatch[1])}</li>`);
      continue;
    }

    // Blank line
    if (line.trim() === '') {
      closeList();
      out.push('');
      continue;
    }

    // Paragraph
    closeList();
    out.push(`<p>${inline(line)}</p>`);
  }

  closeList();
  closeTable();
  if (inCode) out.push('</code></pre>');

  return out.join('\n');
}

const body = renderMarkdown(md);

const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Site Access Management System — System Writeup</title>
  <style>
    /* ── Page setup ── */
    @page { size: A4; margin: 22mm 20mm 22mm 20mm; }
    @media print {
      body { font-size: 11pt; }
      h1 { page-break-before: avoid; }
      h2 { page-break-after: avoid; }
      table, pre { page-break-inside: avoid; }
      .no-print { display: none; }
    }

    /* ── Base ── */
    *, *::before, *::after { box-sizing: border-box; }
    body {
      font-family: 'Segoe UI', Arial, sans-serif;
      font-size: 13px;
      line-height: 1.7;
      color: #1a1a2e;
      max-width: 900px;
      margin: 0 auto;
      padding: 32px 40px 48px;
      background: #fff;
    }

    /* ── Cover heading ── */
    h1:first-of-type {
      font-size: 26px;
      font-weight: 700;
      color: #0d3b6e;
      border-bottom: 3px solid #0d3b6e;
      padding-bottom: 10px;
      margin-bottom: 6px;
    }

    /* ── Section headings ── */
    h2 {
      font-size: 17px;
      font-weight: 700;
      color: #0d3b6e;
      border-left: 4px solid #1a78c2;
      padding-left: 10px;
      margin-top: 36px;
      margin-bottom: 10px;
    }
    h3 {
      font-size: 14px;
      font-weight: 700;
      color: #1a3a5c;
      margin-top: 20px;
      margin-bottom: 6px;
    }
    h4 { font-size: 13px; font-weight: 700; color: #333; margin: 14px 0 4px; }

    /* ── Paragraphs & lists ── */
    p { margin: 6px 0 10px; }
    ul, ol { margin: 6px 0 10px 22px; padding: 0; }
    li { margin-bottom: 4px; }

    /* ── Tables ── */
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 14px 0 18px;
      font-size: 12px;
    }
    th {
      background: #0d3b6e;
      color: #fff;
      padding: 7px 10px;
      text-align: left;
      font-weight: 600;
    }
    td {
      padding: 6px 10px;
      border-bottom: 1px solid #dde4ef;
      vertical-align: top;
    }
    tr:nth-child(even) td { background: #f4f7fb; }

    /* ── Code ── */
    code {
      background: #eef2f7;
      border-radius: 3px;
      padding: 1px 5px;
      font-family: 'Consolas', 'Courier New', monospace;
      font-size: 11.5px;
      color: #c0392b;
    }
    pre {
      background: #1a1a2e;
      color: #cdd9e5;
      border-radius: 6px;
      padding: 14px 18px;
      overflow-x: auto;
      margin: 12px 0 18px;
      font-size: 11.5px;
      line-height: 1.6;
    }
    pre code {
      background: none;
      color: inherit;
      padding: 0;
      font-size: inherit;
    }

    /* ── Horizontal rule ── */
    hr {
      border: none;
      border-top: 1px solid #c8d6e8;
      margin: 28px 0;
    }

    /* ── Links ── */
    a { color: #1a78c2; text-decoration: none; }
    a:hover { text-decoration: underline; }

    /* ── Print button (screen only) ── */
    .print-btn {
      position: fixed;
      top: 18px;
      right: 22px;
      background: #0d3b6e;
      color: #fff;
      border: none;
      border-radius: 6px;
      padding: 9px 18px;
      font-size: 13px;
      cursor: pointer;
      box-shadow: 0 2px 8px rgba(0,0,0,.2);
      z-index: 999;
    }
    .print-btn:hover { background: #1a78c2; }
  </style>
</head>
<body>
  <button class="print-btn no-print" onclick="window.print()">&#128438; Save as PDF</button>
  ${body}
</body>
</html>`;

fs.writeFileSync(outPath, html, 'utf8');
console.log(`\n✔  Generated: SYSTEM_WRITEUP.html`);
console.log(`\n   Steps to save as PDF:`);
console.log(`   1. Open SYSTEM_WRITEUP.html in Chrome or Edge`);
console.log(`   2. Click the "Save as PDF" button (top-right), or press Ctrl+P`);
console.log(`   3. Set Destination to "Save as PDF"`);
console.log(`   4. Set Paper size: A4, Margins: Default`);
console.log(`   5. Enable "Background graphics" for coloured table headers`);
console.log(`   6. Click Save\n`);
