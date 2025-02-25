/**
 * Validates if the provided string is a valid IPv4 address
 * 
 * @param {string} ip - The IP address to validate
 * 
 * @returns {boolean} True if the IP is valid, false otherwise
 */
export const isValidIPv4 = (ip) => {
  console.debug(`Validating IP: ${ip}`);
  
  if (!ip) {
    console.debug('IP is empty or undefined');
    return false;
  }
  
  const parts = ip.split('.');
  if (parts.length !== 4) {
    console.debug(`IP has ${parts.length} parts, expected 4`);
    return false;
  }

  const isValid = parts.every(part => {
    const num = parseInt(part, 10);
    const valid = num >= 0 && num <= 255 && part === num.toString();
    if (!valid) {
      console.debug(`Invalid IP part: ${part}`);
    }
    return valid;
  });

  console.debug(`IP validation result: ${isValid}`);
  return isValid;
};


/**
 * Checks if an IP matches a pattern with wildcards
 * Supports patterns like "192.168.*.*" or "10.0.1.*"
 * 
 * @param {string} ip - The IP address to check
 * @param {string} pattern - The pattern to match
 * 
 * @returns {boolean} True if the IP matches the pattern, false otherwise
 */
export const matchesIPPattern = (ip, pattern) => {
  console.debug(`Checking IP ${ip} against pattern ${pattern}`);
  
  if (!ip || !pattern) {
    console.debug('IP or pattern is empty');
    return false;
  }
  
  const ipParts = ip.split('.');
  const patternParts = pattern.split('.');
  
  if (ipParts.length !== 4 || patternParts.length !== 4) {
    console.debug(`Invalid parts count - IP: ${ipParts.length}, Pattern: ${patternParts.length}`);
    return false;
  }
  
  const matches = ipParts.every((part, index) => {
    const matches = patternParts[index] === '*' || patternParts[index] === part;
    console.debug(`Comparing part ${index}: ${part} with ${patternParts[index]} = ${matches}`);
    return matches;
  });

  console.debug(`Pattern match result: ${matches}`);
  return matches;
};


/**
 * Checks if an IP should be excluded based on the exclude list
 * 
 * @param {string} ip - The IP address to check
 * @param {string[]} excludeList - The list of IPs to exclude
 * 
 * @returns {boolean} True if the IP should be excluded, false otherwise
 */
export const shouldExcludeIP = (ip, excludeList = []) => {
  console.debug(`Checking IP exclusion for: ${ip}`);
  console.debug('Exclude list:', excludeList);

  if (!isValidIPv4(ip)) {
    console.debug('Invalid IP, returning false');
    return false;
  }
  
  const shouldExclude = excludeList.some(pattern => {
    const matches = pattern === ip || matchesIPPattern(ip, pattern);
    console.debug(`Checking against pattern ${pattern}: ${matches}`);
    return matches;
  });

  console.debug(`Final IP exclusion result: ${shouldExclude}`);
  return shouldExclude;
};
