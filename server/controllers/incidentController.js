const Incident = require('../models/Incident');
const ReliefCenter = require('../models/ReliefCenter');
const Team = require('../models/Team');
const FieldUnit = require('../models/FieldUnit');
const Alert = require('../models/Alert');
const Message = require('../models/Message');
const User = require('../models/User');
const { haversineKm, classifyZone, filterAndAnnotate } = require('../utils/geoUtils');
const { sendSuccess, sendError } = require('../utils/apiResponse');
const { emitToAll, emitToRole, emitToUser, emitToIncident } = require('../services/socketService');

const incidentController = {
  async create(req, res, next) {
    try {
      const { title, type, severity, location, description, resources } = req.body;

      if (!location || location.lat == null || location.lng == null) {
        return sendError(res, 'Live location (lat, lng) is required to submit a report.', 400);
      }

      const incidentData = {
        title: title || `${type} at ${location.address || 'Reported Location'}`,
        type,
        severity: severity || 'medium',
        location,
        description: description || '',
        resources: resources || [],
        reportedBy: req.user ? req.user.id : null,
      };

      // Find nearest Relief Center based on reported location
      const centers = await ReliefCenter.find({});
      let nearest = null;
      let minDistance = Infinity;

      for (const center of centers) {
        if (center.location && center.location.lat != null) {
          const dist = haversineKm(
            center.location.lat,
            center.location.lng,
            location.lat,
            location.lng
          );
          if (dist < minDistance) {
            minDistance = dist;
            nearest = center;
          }
        }
      }

      if (nearest) {
        incidentData.reliefCenterId = nearest._id;
        incidentData.zone = classifyZone(
          nearest.location.lat,
          nearest.location.lng,
          location.lat,
          location.lng
        );
      }

      const incident = await Incident.create(incidentData);
      emitToAll('incident:new', incident);
      console.log(`[Incident] New report saved: ${incident.incidentId} (${incident.zone})`);

      return sendSuccess(res, incident, 201);
    } catch (err) {
      next(err);
    }
  },

  async getAll(req, res, next) {
    try {
      const filter = {};
      if (req.query.status) filter.status = req.query.status;
      if (req.query.severity) filter.severity = req.query.severity;
      if (req.query.reportedBy === 'me' && req.user) {
        filter.reportedBy = req.user.id;
      } else if (req.query.reportedBy && req.query.reportedBy !== 'me') {
        filter.reportedBy = req.query.reportedBy;
      }

      const incidents = await Incident.find(filter)
        .sort({ createdAt: -1 })
        .populate('reliefCenterId', 'name location')
        .populate('reportedBy', 'name email')
        .lean();

      return sendSuccess(res, incidents);
    } catch (err) {
      next(err);
    }
  },

  async getById(req, res, next) {
    try {
      let incident = null;
      if (req.params.id.startsWith('NX-')) {
        incident = await Incident.findOne({ incidentId: req.params.id });
      } else {
        incident = await Incident.findById(req.params.id);
      }

      if (!incident) {
        return sendError(res, 'Incident not found', 404);
      }

      return sendSuccess(res, incident);
    } catch (err) {
      next(err);
    }
  },

  async updateStatus(req, res, next) {
    try {
      const { status } = req.body;
      let incident = await Incident.findById(req.params.id);
      if (!incident) {
        return sendError(res, 'Incident not found', 404);
      }

      // Handle DISPATCHED / EN ROUTE
      if (status === 'en_route' || status === 'dispatched') {
        let zone = incident.zone;
        let reliefCenterId = incident.reliefCenterId;

        if (!zone || !reliefCenterId) {
          const centers = await ReliefCenter.find({});
          let nearest = null;
          let minDistance = Infinity;

          if (incident.location && incident.location.lat != null) {
            for (const center of centers) {
              if (center.location) {
                const dist = haversineKm(
                  center.location.lat,
                  center.location.lng,
                  incident.location.lat,
                  incident.location.lng
                );
                if (dist < minDistance) {
                  minDistance = dist;
                  nearest = center;
                }
              }
            }
          }

          if (nearest) {
            reliefCenterId = nearest._id;
            zone = classifyZone(
              nearest.location.lat,
              nearest.location.lng,
              incident.location.lat,
              incident.location.lng
            );
          }
        }

        if (zone && reliefCenterId) {
          const team = await Team.findOne({ zone, status: 'ACTIVE' });
          if (team) {
            incident.assignedTeamId = team._id;
            incident.reliefCenterId = reliefCenterId;
            incident.zone = zone;
            await FieldUnit.updateMany(
              { agentId: { $in: team.members } },
              {
                $set: { status: 'en_route', currentIncident: incident._id },
                $inc: { missionsToday: 1 },
              }
            );
          }
        }
      }

      // Handle RESOLVED
      if (status === 'resolved') {
        incident.resolvedAt = new Date();

        // 1. Notify Admin
        if (req.user && req.user.role !== 'relief_admin' && incident.reliefCenterId) {
          const adminAlert = await Alert.create({
            type: 'all_clear',
            message: `[Field Unit] Incident has been resolved by field team (ID: ${incident.incidentId})`,
            severity: 'success',
            broadcastBy: req.user.id,
            targetUser: incident.reliefCenterId.toString(),
            incidentId: incident._id.toString(),
          });
          emitToUser(incident.reliefCenterId, 'alert:personal', adminAlert);
        }

        // 2. Notify Reporter
        if (incident.reportedBy) {
          const userAlert = await Alert.create({
            type: 'all_clear',
            message: `Your request has been resolved (ID: ${incident.incidentId})`,
            severity: 'success',
            broadcastBy: req.user ? req.user.id : null,
            targetUser: incident.reportedBy.toString(),
            incidentId: incident._id.toString(),
          });
          emitToUser(incident.reportedBy, 'alert:personal', userAlert);
        }

        // Clear team/unit assignments
        if (incident.assignedTeamId) {
          const team = await Team.findById(incident.assignedTeamId);
          if (team && team.members) {
            await FieldUnit.updateMany(
              { agentId: { $in: team.members } },
              { $set: { status: 'available', currentIncident: null } }
            );
          }
        } else if (incident.assignedUnit) {
          await FieldUnit.findByIdAndUpdate(incident.assignedUnit, {
            $set: { status: 'available', currentIncident: null },
          });
        }
      }

      incident.status = status;
      await incident.save();

      emitToAll('incident:updated', incident);
      return sendSuccess(res, incident);
    } catch (err) {
      next(err);
    }
  },

  async accept(req, res, next) {
    try {
      const { unitId, reliefCenterId } = req.body;
      const incident = await Incident.findById(req.params.id);
      if (!incident) {
        return sendError(res, 'Incident not found', 404);
      }

      incident.status = 'dispatched';
      if (reliefCenterId) incident.reliefCenterId = reliefCenterId;
      if (unitId) {
        let unit = await FieldUnit.findOne({ unitId });
        if (!unit && unitId.length === 24) {
          unit = await FieldUnit.findById(unitId);
        }
        if (unit) {
          incident.assignedUnit = unit._id;
          await FieldUnit.findByIdAndUpdate(unit._id, {
            $set: { status: 'en_route', currentIncident: incident._id },
            $inc: { missionsToday: 1 },
          });
          emitToAll('unit:statusChanged', { unitId: unit.unitId, status: 'en_route' });
        }
      }

      await incident.save();
      emitToAll('incident:updated', incident);
      return sendSuccess(res, incident);
    } catch (err) {
      next(err);
    }
  },

  async dismiss(req, res, next) {
    try {
      const incident = await Incident.findByIdAndUpdate(
        req.params.id,
        { $set: { status: 'dismissed' } },
        { new: true }
      );
      if (!incident) {
        return sendError(res, 'Incident not found', 404);
      }
      emitToAll('incident:updated', incident);
      return sendSuccess(res, incident);
    } catch (err) {
      next(err);
    }
  },

  async addChat(req, res, next) {
    try {
      const { message, senderRole, senderId } = req.body;
      const incident = await Incident.findById(req.params.id);
      if (!incident) {
        return sendError(res, 'Incident not found', 404);
      }

      const chatItem = {
        message,
        senderRole: senderRole || (req.user ? req.user.role : 'user'),
        senderId: senderId || (req.user ? req.user.id : null),
        senderName: req.user ? req.user.name : 'Reporter',
        timestamp: new Date(),
      };

      incident.chat.push(chatItem);
      await incident.save();

      // Also persist to Message collection
      await Message.create({
        incidentId: req.params.id,
        content: message,
        senderRole: chatItem.senderRole,
        senderName: chatItem.senderName,
        senderId: chatItem.senderId,
      });

      emitToIncident(req.params.id, 'chat:message', {
        incidentId: req.params.id,
        ...chatItem,
      });

      return sendSuccess(res, incident);
    } catch (err) {
      next(err);
    }
  },

  async addAction(req, res, next) {
    try {
      const incident = await Incident.findById(req.params.id);
      if (!incident) {
        return sendError(res, 'Incident not found', 404);
      }

      const actionItem = {
        type: req.body.type || 'update',
        performedBy: req.user ? req.user.id : null,
        details: req.body.details || '',
        timestamp: new Date(),
      };

      incident.actions.push(actionItem);
      await incident.save();

      emitToAll('incident:updated', incident);
      return sendSuccess(res, incident);
    } catch (err) {
      next(err);
    }
  },

  async backupRequest(req, res, next) {
    try {
      const incident = await Incident.findById(req.params.id);
      if (!incident) {
        return sendError(res, 'Incident not found', 404);
      }

      incident.actions.push({
        type: 'backup_request',
        performedBy: req.user ? req.user.id : null,
        details: req.body.details || 'Backup requested by field unit',
        timestamp: new Date(),
      });
      await incident.save();

      if (incident.reliefCenterId) {
        const alert = await Alert.create({
          type: 'hazard',
          message: `[Field Unit] Backup required at the site (ID: ${incident.incidentId})`,
          severity: 'high',
          broadcastBy: req.user ? req.user.id : null,
          targetUser: incident.reliefCenterId.toString(),
          incidentId: incident._id.toString(),
        });
        emitToUser(incident.reliefCenterId, 'alert:personal', alert);
      }

      emitToAll('incident:updated', incident);
      return sendSuccess(res, { success: true, message: 'Backup request sent' });
    } catch (err) {
      next(err);
    }
  },

  async nearby(req, res, next) {
    try {
      const { lat, lng, radius } = req.query;
      const centerLat = parseFloat(lat) || 19.076;
      const centerLng = parseFloat(lng) || 72.8777;
      const radiusKm = parseFloat(radius) || 15;

      const incidents = await Incident.find({
        status: { $nin: ['resolved', 'dismissed'] },
      }).lean();

      const nearby = filterAndAnnotate(incidents, centerLat, centerLng, radiusKm);
      return sendSuccess(res, nearby);
    } catch (err) {
      next(err);
    }
  },

  async getStats(req, res, next) {
    try {
      const total = await Incident.countDocuments({});
      const active = await Incident.countDocuments({ status: { $nin: ['resolved', 'dismissed'] } });
      const resolved = await Incident.countDocuments({ status: 'resolved' });
      const critical = await Incident.countDocuments({
        status: { $nin: ['resolved', 'dismissed'] },
        severity: 'critical',
      });

      return sendSuccess(res, { total, active, resolved, critical });
    } catch (err) {
      next(err);
    }
  },

  async getHeatmap(req, res, next) {
    try {
      const incidents = await Incident.find({
        status: { $nin: ['resolved', 'dismissed'] },
      }).lean();

      const heatmap = incidents.map((inc) => ({
        lat: inc.location.lat,
        lng: inc.location.lng,
        weight: inc.severity === 'critical' ? 1.0 : inc.severity === 'high' ? 0.7 : 0.4,
      }));

      return sendSuccess(res, heatmap);
    } catch (err) {
      next(err);
    }
  },

  async requestAssignment(req, res, next) {
    try {
      const incident = await Incident.findById(req.params.id);
      if (!incident) {
        return sendError(res, 'Incident not found', 404);
      }
      incident.actions.push({
        type: 'assignment_request',
        performedBy: req.user ? req.user.id : null,
        details: 'Field unit requested assignment',
        timestamp: new Date(),
      });
      await incident.save();

      emitToAll('incident:updated', incident);
      return sendSuccess(res, { success: true });
    } catch (err) {
      next(err);
    }
  },

  async dashboardStats(req, res, next) {
    try {
      let adminUser;
      if (req.user.role === 'relief_admin') {
        adminUser = await ReliefCenter.findById(req.user.id);
      } else {
        adminUser = await User.findById(req.user.id);
      }

      if (!adminUser || !adminUser.location || adminUser.location.lat === undefined) {
        return res.status(400).json({
          error: 'Admin location not set',
          needsLocation: true,
          centerLat: 19.076,
          centerLng: 72.8777,
        });
      }

      const centerLat = adminUser.location.lat;
      const centerLng = adminUser.location.lng;
      const RADIUS_KM = 15;

      const allIncidents = await Incident.find({}).lean();
      const nearby = filterAndAnnotate(allIncidents, centerLat, centerLng, RADIUS_KM);

      const activeIncidents = nearby.filter(
        (inc) => !['resolved', 'dismissed'].includes(inc.status)
      );

      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const resolvedToday = nearby.filter(
        (inc) => inc.status === 'resolved' && inc.resolvedAt && new Date(inc.resolvedAt) >= todayStart
      );

      let avgResponseMinutes = null;
      if (resolvedToday.length > 0) {
        const totalMs = resolvedToday.reduce((sum, inc) => {
          return sum + (new Date(inc.resolvedAt) - new Date(inc.createdAt));
        }, 0);
        avgResponseMinutes = Math.round(totalMs / resolvedToday.length / 60000);
      }

      const zoneBreakdown = { A: 0, B: 0, C: 0, D: 0, E: 0, F: 0 };
      for (const inc of activeIncidents) {
        // Handle both 'A'-'F' and 'SECTOR-N' etc.
        const firstLetter = inc.zone ? inc.zone.charAt(0).toUpperCase() : 'A';
        if (zoneBreakdown[firstLetter] !== undefined) {
          zoneBreakdown[firstLetter]++;
        } else {
          zoneBreakdown.A++;
        }
      }

      const fieldUnits = await FieldUnit.find({})
        .populate('agentId', 'name email phone specialization')
        .lean();

      return sendSuccess(res, {
        centerLat,
        centerLng,
        radiusKm: RADIUS_KM,
        activeCount: activeIncidents.length,
        resolvedTodayCount: resolvedToday.length,
        avgResponseMinutes,
        activeIncidents,
        zoneBreakdown,
        fieldUnits,
      });
    } catch (err) {
      next(err);
    }
  },
};

module.exports = incidentController;
