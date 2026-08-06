const Incident = require('../models/Incident');
const FieldUnit = require('../models/FieldUnit');
const ReportService = require('../services/ReportService');
const { sendSuccess } = require('../utils/apiResponse');

const reportController = {
  async getReports(req, res, next) {
    try {
      const incidents = await ReportService.getFilteredIncidents(req.query, req.user);
      return sendSuccess(res, incidents);
    } catch (err) {
      next(err);
    }
  },

  async downloadReport(req, res, next) {
    try {
      const { from, to, zone, severity, status, format = 'csv' } = req.query;
      const incidents = await ReportService.getFilteredIncidents(req.query, req.user);

      const activeFilters = [];
      if (from) activeFilters.push(`From: ${from}`);
      if (to) activeFilters.push(`To: ${to}`);
      if (zone && zone !== 'All Zones') activeFilters.push(`Zone: ${zone}`);
      if (severity && severity !== 'All') activeFilters.push(`Severity: ${severity}`);
      if (status && status !== 'All') activeFilters.push(`Status: ${status}`);

      const meta = {
        generatedAt: new Date().toISOString(),
        filtersSummary: activeFilters.length > 0 ? activeFilters.join(', ') : 'All Incidents',
      };

      const dateStr = new Date().toISOString().split('T')[0];
      const fmt = (format || 'csv').toLowerCase();

      if (fmt === 'pdf') {
        const pdfBuffer = ReportService.exportPDF(incidents, meta);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="incident-report-${dateStr}.pdf"`);
        return res.send(pdfBuffer);
      } else if (fmt === 'xlsx' || fmt === 'excel') {
        const xlsxBuffer = await ReportService.exportExcel(incidents, meta);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="incident-report-${dateStr}.xlsx"`);
        return res.send(xlsxBuffer);
      } else {
        const csvData = ReportService.exportCSV(incidents, meta);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="incident-report-${dateStr}.csv"`);
        return res.send(csvData);
      }
    } catch (err) {
      next(err);
    }
  },

  async getTeamReport(req, res, next) {
    try {
      const units = await FieldUnit.find({}).populate('agentId', 'name email');
      const report = units.map((u) => ({
        unitId: u.unitId,
        status: u.status,
        missionsToday: u.missionsToday,
        currentIncident: u.currentIncident,
        agentName: u.agentId ? u.agentId.name : 'Unassigned',
      }));
      return sendSuccess(res, report);
    } catch (err) {
      next(err);
    }
  },

  async getTimeline(req, res, next) {
    try {
      const incidents = await Incident.find({});
      const timeline = {};

      incidents.forEach((inc) => {
        const hour = new Date(inc.createdAt).getHours();
        const key = `${hour}:00`;
        if (!timeline[key]) {
          timeline[key] = { time: key, count: 0, critical: 0, high: 0, medium: 0, low: 0 };
        }
        timeline[key].count++;
        if (inc.severity && timeline[key][inc.severity] !== undefined) {
          timeline[key][inc.severity]++;
        }
      });

      const sorted = Object.values(timeline).sort(
        (a, b) => parseInt(a.time, 10) - parseInt(b.time, 10)
      );
      return sendSuccess(res, sorted);
    } catch (err) {
      next(err);
    }
  },

  async exportPdf(req, res, next) {
    return this.downloadReport({ ...req, query: { ...req.query, format: 'pdf' } }, res, next);
  },

  async exportCsv(req, res, next) {
    return this.downloadReport({ ...req, query: { ...req.query, format: 'csv' } }, res, next);
  },
};

module.exports = reportController;
