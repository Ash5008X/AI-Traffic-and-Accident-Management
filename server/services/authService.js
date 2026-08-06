const UserRepository = require('../repositories/UserRepository');
const ReliefCenterRepository = require('../repositories/ReliefCenterRepository');
const MemberRepository = require('../repositories/MemberRepository');
const LocationService = require('./LocationService');

/**
 * Searches all three collections for a user by email via Repositories.
 * Priority: relief_centers -> users -> members
 * Returns { user, source } or null if not found.
 */
async function findUserAcrossCollections(email) {
  const normEmail = email.toLowerCase().trim();

  // 1. Check relief_centers collection
  const reliefAdmin = await ReliefCenterRepository.findOne({ email: normEmail }, { select: null, lean: false });
  if (reliefAdmin) return { user: reliefAdmin, source: 'relief_centers' };

  // 2. Check users collection
  const user = await UserRepository.findOne({ email: normEmail });
  if (user) return { user, source: 'users' };

  // 3. Check members collection
  const member = await MemberRepository.findOne({ email: normEmail });
  if (member) return { user: member, source: 'members' };

  return null;
}

/**
 * Finds a user by ID across all three collections via Repositories.
 * Uses the role from the JWT to check the primary collection first, then falls back.
 */
async function findUserByIdAcrossCollections(id, role) {
  if (role === 'user') {
    const u = await UserRepository.findById(id);
    if (u) return { user: u, source: 'users' };
  } else if (role === 'relief_admin') {
    const u = await ReliefCenterRepository.findById(id, { select: null, lean: false });
    if (u) return { user: u, source: 'relief_centers' };
  } else if (role === 'field_unit') {
    const u = await MemberRepository.findById(id);
    if (u) return { user: u, source: 'members' };
  }

  // Fallback search
  const user = await UserRepository.findById(id);
  if (user) return { user, source: 'users' };

  const reliefAdmin = await ReliefCenterRepository.findById(id, { select: null, lean: false });
  if (reliefAdmin) return { user: reliefAdmin, source: 'relief_centers' };

  const member = await MemberRepository.findById(id);
  if (member) return { user: member, source: 'members' };

  return null;
}

/**
 * Auto-assigns a newly registered field unit member to all Relief Admins within a 5km radius via Repositories.
 */
async function assignFieldUnitToNearestAdmin(memberId, location) {
  if (!location || location.lat == null || location.lng == null) return;
  const admins = await ReliefCenterRepository.find({ role: 'relief_admin' }, { select: null, lean: true });

  for (const admin of admins) {
    if (admin.location && admin.location.lat != null && admin.location.lng != null) {
      const dist = LocationService.calculateDistance(location.lat, location.lng, admin.location.lat, admin.location.lng);
      if (dist <= 5) {
        await ReliefCenterRepository.findByIdAndUpdate(
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
