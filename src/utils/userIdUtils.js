import _ from 'lodash';

/**
 * Checks if a string is a valid UUID
 * Supports UUIDs with or without dashes
 * 
 * @param {string} stringToCheck - The string to validate
 * 
 * @returns {boolean} True if the string is a valid UUID, false otherwise
 */
export const isValidUUID = (stringToCheck) => {
  const regex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-4[0-9a-fA-F]{3}-[89ABab][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/;
  const isValid = regex.test(stringToCheck);
  console.debug(`UUID validation for ${stringToCheck}: ${isValid}`);
  return isValid;
};

/**
 * Checks if a user ID should be excluded based on the exclude list
 * Supports exact matches and pattern matching with wildcards
 * 
 * @param {string} userId - The user ID to check
 * @param {string[]} excludeList - The list of user IDs to exclude
 * 
 * @returns {boolean} True if the user ID should be excluded, false otherwise
 */
export const shouldExcludeUser = (userId, excludeList = []) => {
  console.debug(`Checking user exclusion for ID: ${userId}`);
  console.debug('Exclude list:', excludeList);

  if (!userId || !isValidUUID(userId)) {
    console.debug('Invalid UUID or empty userId, returning false');
    return false;
  }
  
  const shouldExclude = excludeList.some(pattern => {
    if (pattern === '*') {
      console.debug('Wildcard pattern found, excluding user');
      return true;
    }
    if (pattern.includes('*')) {
      const safePattern = _.escapeRegExp(pattern).replace(/\\\*/g, '.*');
      const regex = new RegExp('^' + safePattern + '$');
      const matches = regex.test(userId);
      console.debug(`Pattern ${pattern} converted to regex: ${regex}`);
      console.debug(`Pattern match result: ${matches}`);
      return matches;
    }
    const exactMatch = pattern === userId;
    console.debug(`Exact match check: ${exactMatch}`);
    return exactMatch;
  });

  console.debug(`Final exclusion result for ${userId}: ${shouldExclude}`);
  return shouldExclude;
};