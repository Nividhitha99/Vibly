/**
 * Check if user profile has all mandatory fields filled
 * @param {object} user - User object from API
 * @returns {boolean} - True if profile is complete
 */
export function isProfileComplete(user) {
  if (!user) return false;

  // Mandatory fields:
  // 1. Name
  // 2. Age (or birthday from which age can be calculated)
  // 3. Gender
  // 4. Location (city or location/region)
  // 5. Birthday (for age calculation)
  
  const hasName = user.name && user.name.trim() !== "";
  const hasAge = user.age !== undefined && user.age !== null && user.age > 0;
  const hasBirthday = user.birthday && user.birthday.trim() !== "";
  const hasGender = user.gender && user.gender.trim() !== "";
  const hasLocation = (user.city && user.city.trim() !== "") || 
                      (user.location && user.location.trim() !== "") ||
                      (user.region && user.region.trim() !== "");

  // Profile is complete if all mandatory fields are present
  return hasName && (hasAge || hasBirthday) && hasGender && hasLocation;
}

/**
 * Get missing mandatory fields
 * @param {object} user - User object from API
 * @returns {array} - Array of missing field names
 */
export function getMissingFields(user) {
  if (!user) return ["name", "age", "gender", "location"];

  const missing = [];
  
  if (!user.name || user.name.trim() === "") {
    missing.push("name");
  }
  
  if ((!user.age || user.age <= 0) && (!user.birthday || user.birthday.trim() === "")) {
    missing.push("age");
  }
  
  if (!user.gender || user.gender.trim() === "") {
    missing.push("gender");
  }
  
  if (!user.city && !user.location && !user.region) {
    missing.push("location");
  }

  return missing;
}

