const XLSX = require('xlsx');

const exportToExcel = (data, sheetName = 'Dados', filename = 'export') => {
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
};

const exportToCsv = (data) => {
  if (!data.length) return '';
  const headers = Object.keys(data[0]).join(',');
  const rows = data.map(row =>
    Object.values(row).map(v => {
      if (v === null || v === undefined) return '';
      const str = String(v);
      return str.includes(',') || str.includes('"') || str.includes('\n')
        ? `"${str.replace(/"/g, '""')}"`
        : str;
    }).join(',')
  );
  return [headers, ...rows].join('\n');
};

const sendExcel = (res, data, filename = 'export', sheetName = 'Dados') => {
  const buffer = exportToExcel(data, sheetName, filename);
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}.xlsx"`);
  res.send(buffer);
};

const sendCsv = (res, data, filename = 'export') => {
  const csv = exportToCsv(data);
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}.csv"`);
  res.send('\uFEFF' + csv); // BOM for Excel UTF-8
};

module.exports = { exportToExcel, exportToCsv, sendExcel, sendCsv };
