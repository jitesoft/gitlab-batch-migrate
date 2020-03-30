const axios = require('axios');

/**
 * Check if a project exist on a given gitlab instance.
 * @param {string} baseUrl URI to the instance.
 * @param {string} path    Project namespace path (including name).
 * @param {string} token   Private token for given instance.
 * @return {Promise<boolean>}
 */
module.exports = async (baseUrl, path, token) => {
  const result = await axios.get(`${baseUrl}/api/v4/projects/${encodeURIComponent(path)}?private_token=${token}`);
  return result.status === 200;
};
