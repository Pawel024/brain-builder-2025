/**
 * Get the value of a cookie
 * 
 * @param {string} name - The name of the cookie
 * 
 * @returns {string} The value of the cookie
 */
function getCookie(name) {
    var value = "; " + document.cookie;
    var parts = value.split("; " + name + "=");
    if (parts.length === 2) return parts.pop().split(";").shift();
  }

export default getCookie;