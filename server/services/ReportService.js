const IncidentRepository = require('../repositories/IncidentRepository');
const ZoneService = require('./ZoneService');

/**
 * ReportService
 * Responsible for building incident report filters, fetching filtered incident datasets via IncidentRepository,
 * and generating downloadable CSV, PDF, and Excel export payloads.
 */
class ReportService {
  /**
   * Builds a unified MongoDB filter object based on query parameters.
   */
  static buildIncidentFilter(queryParams = {}, reqUser = null) {
    const conditions = [];

    // 1. Date Range Filtering
    if (queryParams.from || queryParams.to) {
      const dateFilter = {};
      if (queryParams.from) {
        const fromDate = new Date(queryParams.from);
        if (!isNaN(fromDate.getTime())) {
          fromDate.setHours(0, 0, 0, 0);
          dateFilter.$gte = fromDate;
        }
      }
      if (queryParams.to) {
        const toDate = new Date(queryParams.to);
        if (!isNaN(toDate.getTime())) {
          toDate.setHours(23, 59, 59, 999);
          dateFilter.$lte = toDate;
        }
      }
      if (Object.keys(dateFilter).length > 0) {
        conditions.push({ createdAt: dateFilter });
      }
    }

    // 2. Zone Filtering
    if (queryParams.zone && queryParams.zone !== 'All Zones' && queryParams.zone !== 'All') {
      const normalizedZone = ZoneService.normalizeZone(queryParams.zone);
      conditions.push({
        $or: [
          { zone: normalizedZone },
          { assignedZone: normalizedZone },
          { zone: queryParams.zone },
          { assignedZone: queryParams.zone },
        ],
      });
    }

    // 3. Severity Filtering
    if (queryParams.severity && queryParams.severity !== 'All') {
      conditions.push({ severity: queryParams.severity.toLowerCase() });
    }

    // 4. Status Filtering
    if (queryParams.status && queryParams.status !== 'All') {
      const normStatus = queryParams.status.toLowerCase().replace(/\s+/g, '_');
      conditions.push({ status: normStatus });
    }

    if (conditions.length === 0) return {};
    if (conditions.length === 1) return conditions[0];
    return { $and: conditions };
  }

  /**
   * Fetches filtered incidents from IncidentRepository with populated relationships.
   */
  static async getFilteredIncidents(queryParams = {}, reqUser = null) {
    const filter = this.buildIncidentFilter(queryParams, reqUser);
    const incidents = await IncidentRepository.find(filter, { populate: true, lean: true });
    return incidents.map((inc) => ({
      ...inc,
      zone: ZoneService.resolveZone(inc),
      assignedZone: ZoneService.resolveZone(inc),
    }));
  }

  /**
   * Generates CSV report string.
   */
  static exportCSV(incidents, meta = {}) {
    const headers = ['Incident ID', 'Type', 'Severity', 'Zone', 'Status', 'Reported At', 'Description', 'Relief Center'];
    let csv = headers.map((h) => `"${h}"`).join(',') + '\n';

    incidents.forEach((inc) => {
      const id = inc.incidentId || inc._id || '';
      const type = inc.type || inc.title || '';
      const severity = (inc.severity || 'normal').toUpperCase();
      const zone = inc.zone || 'Zone A';
      const status = (inc.status || 'pending').toUpperCase();
      const reportedAt = inc.createdAt ? new Date(inc.createdAt).toISOString() : '';
      const description = (inc.description || '').replace(/"/g, '""');
      const reliefCenterName = inc.reliefCenterId?.name || inc.assignedReliefCenterId?.name || 'Central Command';

      const row = [id, type, severity, zone, status, reportedAt, description, reliefCenterName];
      csv += row.map((val) => `"${String(val).replace(/"/g, '""')}"`).join(',') + '\n';
    });

    return csv;
  }

  /**
   * Generates a real Excel .xlsx workbook Buffer using ExcelJS.
   */
  static async exportExcel(incidents, meta = {}) {
    const ExcelJS = require('exceljs');
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Incident Reports');

    const headers = [
      'Incident ID',
      'Type',
      'Severity',
      'Zone',
      'Status',
      'Reported At',
      'Description',
      'Relief Center',
    ];

    // Add Header Row
    const headerRow = worksheet.addRow(headers);

    // Format Header Row: Bold text, white font, orange background, center alignment
    headerRow.eachCell((cell) => {
      cell.font = { name: 'Calibri', bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFF97316' },
      };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
    });

    // Add Data Rows
    incidents.forEach((inc) => {
      const id = inc.incidentId || inc._id || '';
      const type = inc.type || inc.title || '';
      const severity = (inc.severity || 'normal').toUpperCase();
      const zone = inc.zone || 'Zone A';
      const status = (inc.status || 'pending').toUpperCase();
      const reportedAt = inc.createdAt ? new Date(inc.createdAt).toISOString() : '';
      const description = inc.description || '';
      const reliefCenterName = inc.reliefCenterId?.name || inc.assignedReliefCenterId?.name || 'Central Command';

      worksheet.addRow([id, type, severity, zone, status, reportedAt, description, reliefCenterName]);
    });

    // Auto-size columns based on maximum content length
    worksheet.columns.forEach((column) => {
      let maxLen = 10;
      column.eachCell({ includeEmpty: true }, (cell) => {
        const valStr = cell.value ? String(cell.value) : '';
        if (valStr.length > maxLen) {
          maxLen = Math.min(valStr.length, 50);
        }
      });
      column.width = maxLen + 4;
    });

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  /**
   * Generates a valid PDF 1.4 document Buffer.
   */
  static exportPDF(incidents, meta = {}) {
    const title = 'NEXUSTRAFFIC INCIDENT REPORT';
    const genDate = meta.generatedAt || new Date().toISOString();
    const filtersSummary = meta.filtersSummary || 'All Incidents';
    const totalRecords = incidents.length;

    let textLines = [];
    textLines.push(title);
    textLines.push(`Generated: ${genDate}`);
    textLines.push(`Applied Filters: ${filtersSummary}`);
    textLines.push(`Total Records: ${totalRecords}`);
    textLines.push('----------------------------------------------------------------------------------');
    textLines.push('INCIDENT ID     TYPE                 SEVERITY   ZONE     STATUS      REPORTED AT');
    textLines.push('----------------------------------------------------------------------------------');

    incidents.forEach((inc) => {
      const id = String(inc.incidentId || inc._id || '').slice(0, 14).padEnd(15, ' ');
      const type = String(inc.type || inc.title || '').slice(0, 18).padEnd(20, ' ');
      const sev = String(inc.severity || 'normal').toUpperCase().slice(0, 9).padEnd(10, ' ');
      const zone = String(inc.zone || 'Zone A').slice(0, 7).padEnd(8, ' ');
      const status = String(inc.status || 'pending').toUpperCase().slice(0, 10).padEnd(11, ' ');
      const dateStr = inc.createdAt ? new Date(inc.createdAt).toISOString().split('T')[0] : '';
      textLines.push(`${id}${type}${sev}${zone}${status}${dateStr}`);
    });

    const streamContent = textLines
      .map((line, idx) => {
        const y = 750 - idx * 14;
        const escaped = line.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
        return `BT /F1 9 Tf 50 ${y} Td (${escaped}) Tj ET`;
      })
      .join('\n');

    const pdfStream = `3 0 obj\n<</Length ${Buffer.byteLength(streamContent)}>>\nstream\n${streamContent}\nendstream\nendobj\n`;
    const pdfCatalog = `1 0 obj\n<</Type /Catalog /Pages 2 0 R>>\nendobj\n`;
    const pdfPages = `2 0 obj\n<</Type /Pages /Kids [4 0 R] /Count 1>>\nendobj\n`;
    const pdfPage = `4 0 obj\n<</Type /Page /Parent 2 0 R /Resources <</Font <</F1 5 0 R>>>> /MediaBox [0 0 612 792] /Contents 3 0 R>>\nendobj\n`;
    const pdfFont = `5 0 obj\n<</Type /Font /Subtype /Type1 /BaseFont /Courier>>\nendobj\n`;

    const body = `%PDF-1.4\n${pdfCatalog}${pdfPages}${pdfStream}${pdfPage}${pdfFont}`;

    const catalogOffset = body.indexOf('1 0 obj');
    const pagesOffset = body.indexOf('2 0 obj');
    const streamOffset = body.indexOf('3 0 obj');
    const pageOffset = body.indexOf('4 0 obj');
    const fontOffset = body.indexOf('5 0 obj');
    const xrefOffset = body.length;

    const xref =
      `xref\n0 6\n0000000000 65535 f \n` +
      `${String(catalogOffset).padStart(10, '0')} 00000 n \n` +
      `${String(pagesOffset).padStart(10, '0')} 00000 n \n` +
      `${String(streamOffset).padStart(10, '0')} 00000 n \n` +
      `${String(pageOffset).padStart(10, '0')} 00000 n \n` +
      `${String(fontOffset).padStart(10, '0')} 00000 n \n`;

    const trailer = `trailer\n<</Size 6 /Root 1 0 R>>\nstartxref\n${xrefOffset}\n%%EOF`;

    return Buffer.from(body + xref + trailer, 'utf-8');
  }
}

module.exports = ReportService;
