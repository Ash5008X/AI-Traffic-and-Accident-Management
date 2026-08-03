const User = require('../models/User');
const ReliefCenter = require('../models/ReliefCenter');
const Member = require('../models/Member');
const { haversineKm } = require('../utils/geoUtils');

/**
 * Searches all three collections for a user by email.
 * Priority: relief_centers -> users -> members
 * Returns { user, source } or null if not found.
 */
async function findUserAcrossCollections(email) {
  const normEmail = email.toLowerCase().trim();

  // 1. Check relief_centers collection
  const reliefAdmin = await ReliefCenter.findOne({ email: normEmail });
  if (reliefAdmin) return { user: reliefAdmin, source: 'relief_centers' };

  // 2. Check users collection
  const user = await User.findOne({ email: normEmail });
  if (user) return { user, source: 'users' };

  // 3. Check members collection
  const member = await Member.findOne({ email: normEmail });
  if (member) return { user: member, source: 'members' };

  return null;
}

/**
 * Finds a user by ID across all three collections.
 * Uses the role from the JWT to check the primary collection first, then falls back.
 */
async function findUserByIdAcrossCollections(id, role) {
  if (role === 'user') {
    const u = await User.findById(id);
    if (u) return { user: u, source: 'users' };
  } else if (role === 'relief_admin') {
    const u = await ReliefCenter.findById(id);
    if (u) return { user: u, source: 'relief_centers' };
  } else if (role === 'field_unit') {
    const u = await Member.findById(id);
    if (u) return { user: u, source: 'members' };
  }

  // Fallback search
  const user = await User.findById(id);
  if (user) return { user, source: 'users' };

  const reliefAdmin = await ReliefCenter.findById(id);
  if (reliefAdmin) return { user: reliefAdmin, source: 'relief_centers' };

  const member = await Member.findById(id);
  if (member) return { user: member, source: 'members' };

  return null;
}

/**
 * Auto-assigns a newly registered field unit member to all Relief Admins within a 5km radius.
 */
async function assignFieldUnitToNearestAdmin(memberId, location) {
  if (!location || location.lat == null || location.lng == null) return;
  const admins = await ReliefCenter.find({ role: 'relief_admin' });

  for (const admin of admins) {
    if (admin.location && admin.location.lat != null && admin.location.lng != null) {
      const dist = haversineKm(location.lat, location.lng, admin.location.lat, admin.location.lng);
      if (dist <= 5) {
        await ReliefCenter.findByIdAndUpdate(
          admin._id,
          { $addToSet: { unassignedMembers: memberId } },
          { new: true }
        );
        console.log(`[Auto-Assign] Member ${memberId} added to Admin ${admin.name} (Distance: ${dist} km)`);
      }
    }
  }
}

module.exports = {
  findUserAcrossCollections,
  findUserByIdAcrossCollections,
  assignFieldUnitToNearestAdmin,
};
