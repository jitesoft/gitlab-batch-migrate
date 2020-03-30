const axios = require('axios');
const fs = require('fs');
let createdGroups = null;
axios.defaults.validateStatus = () => true;

module.exports = async (baseUri, groupPath, root, token) => {
  if (!createdGroups) {
    console.log('Loading namespace cache if it exist.');
    try {
      const data = await fs.promises.readFile('out/ns-cache.json');
      createdGroups = JSON.parse(data);
    } catch (e) {
      console.log('Cache does not exist.');
      createdGroups = {};
    }
  }

  baseUri += '/api/v4';
  // Check if we have full path stored.
  if (createdGroups[`${root}/${groupPath}`] !== undefined) {
    return createdGroups[`${root}/${groupPath}`];
  }
  // Else check if we have the root.
  if (!createdGroups[root]) {
    // Create root.
    let res = await axios.get(`${baseUri}/groups/${root}?private_token=${token}`);
    if (res.status !== 200) {
      throw new Error('Could not find root group.');
    }
    createdGroups[root] = res.data.id;
  }
  // Root should now exist as id in the storage.


  // Get all parts of the full path.
  const split = `${groupPath}`.split('/');
  // Set current path to root.
  let currentPath = root;
  for (let i = 0; i < split.length; i++) {
    let parent = createdGroups[currentPath];
    // Parent will be root or a subgroup.

    const reqData = {
      path: split[i],
      name: split[i],
      parent_id: parent
    };

    // Create the new group!
    let res = await axios.post(`${baseUri}/groups?private_token=${token}`, reqData);

    // If the group already exist, we need to fetch the id.
    // Else the ID will already be in the response.
    currentPath += '/' + split[i];
    if (res.status === 400) {
      res = await axios.get(`${baseUri}/groups/${encodeURIComponent(currentPath)}?private_token=${token}`);
    }

    // Set ID to the group.
    createdGroups[currentPath] = res.data.id;
  }
  console.log('Saving to cache.');
  await fs.promises.writeFile('out/ns-cache.json', JSON.stringify(createdGroups));
  return createdGroups[currentPath];
};


