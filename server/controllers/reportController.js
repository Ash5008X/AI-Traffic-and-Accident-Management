const Incident = require('../models/Incident');
const FieldUnit = require('../models/FieldUnit');
const { sendSuccess } = require('../utils/apiResponse');

const reportController = {
  async getReports(req, res, next) {
    try {
      const filter = {};
      if (req.query.from || req.query.to) {
        filter.createdAt = {};
        if (req.query.from) filter.createdAt.$gte = new Date(req.query.from);
        if (req.query.to) filter.createdAt.$lte = new Date(req.query.to);
      }
      if (req.query.severity) filter.severity = req.query.severity;
      if (req.query.status) filter.status = req.query.status;

      const incidents = await Incident.find(filter).sort({ createdAt: -1 });
      return sendSuccess(res, incidents);
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
    try {
      const incidents = await Incident.find(req.query || {}).sort({ createdAt: -1 });
      let content = 'NEXUSTRAFFIC INCIDENT REPORT\n';
      content += `Generated: ${new Date().toISOString()}\n\n`;

      incidents.forEach((inc) => {
        content += `${inc.incidentId} | ${inc.type} | ${inc.severity} | ${inc.status} | ${inc.createdAt}\n`;
        content += `  Location: ${inc.location?.address || 'N/A'}\n`;
        content += `  Description: ${inc.description || 'N/A'}\n\n`;
      });

      res.setHeader('Content-Type', 'text/plain');
      res.setHeader('Content-Disposition', 'attachment; filename=nexustraffic-report.txt');
      return res.send(content);
    } catch (err) {
      next(err);
    }
  },

  async exportCsv(req, res, next) {
    try {
      const incidents = await Incident.find(req.query || {}).sort({ createdAt: -1 });
      let csv = 'Incident ID,Type,Severity,Status,Location,Description,Created At,Resolved At\n';

      incidents.forEach((inc) => {
        const address = inc.location?.address || '';
        const desc = (inc.description || '').replace(/"/g, '""');
        csv += `"${inc.incidentId}","${inc.type}","${inc.severity}","${inc.status}","${address}","${desc}","${inc.createdAt}","${inc.resolvedAt || ''}"\n`;
      });

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=nexustraffic-report.csv');
      return res.send(csv);
    } catch (err) {
      next(err);
    }
  },
};

module.exports = reportController;
