const axios = require('axios');

/**
 * Fetch all projects from gitlab instance.
 *
 * @param {string} baseUrl Gitlab instance base uri.
 * @param {string} token   Private token.
 * @param {string} [sudo]  Sudo name if any.
 * @return {Promise<[]>}
 */
module.exports = async (baseUrl, token, sudo) => {
  const all = [];

  let page = 1;
  let result = [];
  let queryString = `private_token=${token}&simple=true&per_page=100`;
  if (sudo) {
    queryString += `&sudo=${sudo}`;
  }

  do {
    result = await axios.get(
      `${baseUrl}/api/v4/projects?${queryString}&page=${page}`
    );
    if (result.status !== 200) {
      throw new Error('Something went wrong while fetching projects: ' + result.status);
    }
    page++;
    all.push(...result.data);
  } while (result.data.length > 0);

  return all;
};
