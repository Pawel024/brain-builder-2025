/**
 * Validates if the provided string is a valid IPv4 address
 * 
 * @param {string} ip - The IP address to validate
 * 
 * @returns {boolean} True if the IP is valid, false otherwise
 */
export const isValidIPv4 = (ip) => {
  if (!ip) return false;
  
  const parts = ip.split('.');
  if (parts.length !== 4) return false;

  return parts.every(part => {
    const num = parseInt(part, 10);
    return num >= 0 && num <= 255 && part === num.toString();
  });
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
  if (!ip || !pattern) return false;
  
  const ipParts = ip.split('.');
  const patternParts = pattern.split('.');
  
  if (ipParts.length !== 4 || patternParts.length !== 4) return false;
  
  return ipParts.every((part, index) => {
    return patternParts[index] === '*' || patternParts[index] === part;
  });
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
  if (!isValidIPv4(ip)) return false;
  
  return excludeList.some(pattern => {
    return pattern === ip || matchesIPPattern(ip, pattern);
  });
};
