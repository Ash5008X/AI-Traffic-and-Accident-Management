/**
 * LocationService.js
 * Single source of truth for all geographic coordinate retrieval, Haversine distance calculations,
 * operational coverage validations, and Relief Center location fetching from MongoDB.
 */

const ReliefCenterRepository = require('../repositories/ReliefCenterRepository');
const mongoose = require('mongoose');

const DEFAULT_COVERAGE_RADIUS_KM = 3;
const EARTH_RADIUS_KM = 6371;

class LocationService {
  static DEFAULT_COVERAGE_RADIUS_KM = DEFAULT_COVERAGE_RADIUS_KM;

  /**
   * Calculates Haversine distance between two sets of lat/lng coordinates (returns distance in km).
   */
  static calculateDistance(lat1, lon1, lat2, lon2) {
    if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) {
      return 0;
    }
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return EARTH_RADIUS_KM * c;
  }

  /**
   * Checks if a point is within a given radius (in km) of a center point.
   */
  static isWithinCoverage(centerLat, centerLng, pointLat, pointLng, radiusKm = DEFAULT_COVERAGE_RADIUS_KM) {
    const dist = this.calculateDistance(centerLat, centerLng, pointLat, pointLng);
    return dist <= radiusKm;
  }

  /**
   * Fetches the logged-in Relief Center's stored document and coordinates from MongoDB.
   * ReliefCenter.location in MongoDB is the sole source of truth for coordinates.
   */
  static async getReliefCenterCoords(reqUser) {
    let centerDoc = null;

    if (reqUser && reqUser.id) {
      centerDoc = await ReliefCenterRepository.findById(reqUser.id, { select: '-password', lean: true });
      if (!centerDoc && reqUser.email) {
        centerDoc = await ReliefCenterRepository.findOne({ email: reqUser.email }, { select: '-password', lean: true });
      }
    }

    if (!centerDoc) {
      centerDoc = await ReliefCenterRepository.findOne({}, { select: '-password', lean: true });
    }

    const lat = centerDoc?.location?.lat ?? centerDoc?.latitude ?? null;
    const lng = centerDoc?.location?.lng ?? centerDoc?.longitude ?? null;
    const coverageRadiusKm = centerDoc?.coverageRadiusKm ?? DEFAULT_COVERAGE_RADIUS_KM;

    return {
      centerDoc,
      lat,
      lng,
      coverageRadiusKm,
    };
  }

  /**
   * Builds MongoDB ownership filter for a Relief Center ID & User ID.
   */
  static buildCenterFilter(centerDoc, reqUser) {
    const ids = new Set();

    if (centerDoc && centerDoc._id) {
      ids.add(centerDoc._id.toString());
    }
    if (reqUser && reqUser.id) {
      ids.add(reqUser.id.toString());
    }

    const matchConditions = [];
    ids.forEach((idStr) => {
      try {
        const objId = new mongoose.Types.ObjectId(idStr);
        matchConditions.push({ reliefCenterId: objId });
        matchConditions.push({ assignedReliefCenterId: objId });
      } catch (e) {}
      matchConditions.push({ reliefCenterId: idStr });
      matchConditions.push({ assignedReliefCenterId: idStr });
    });

    matchConditions.push({ reliefCenterId: null });
    matchConditions.push({ assignedReliefCenterId: null });

    return { $or: matchConditions };
  }

  /**
   * Standardizes any location object or array into a clean { lat, lng, address } structure.
   */
  static normalizeCoordinates(location) {
    if (!location) return { lat: null, lng: null, address: '' };

    if (Array.isArray(location) && location.length >= 2) {
      return { lat: Number(location[1]), lng: Number(location[0]), address: '' };
    }

    const lat = location.lat ?? location.latitude ?? null;
    const lng = location.lng ?? location.longitude ?? null;
    const address = location.address || '';

    return {
      lat: lat != null ? Number(lat) : null,
      lng: lng != null ? Number(lng) : null,
      address,
    };
  }
}

module.exports = LocationService;
