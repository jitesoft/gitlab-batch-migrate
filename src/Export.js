const axios = require('axios');
const fs = require('fs');

/**
 *
 * @param baseUrl
 * @param projectData
 * @param apiKey
 * @param sudoName
 * @return {Promise<void>}
 */
const exportProject = async (baseUrl, projectData, apiKey, sudoName) => {
  let queryParams = `?private_token=${apiKey}`;

  if (sudoName) {
    queryParams += `&sudo=${sudoName}`;
  }

  const http = await axios.create({
    baseURL: baseUrl + `/api/v4/projects/${projectData.id}`
  });

  await http.post(`export${queryParams}`);
  await checkStatus(http, `export${queryParams}`);
  await download(http, `export/download${queryParams}`, projectData['path_with_namespace']);
};

const checkStatus = (http, uri) => {
  return new Promise((resolve, reject) => {
    const handle = setInterval(() => {
      http.get(uri).then(result => {
        if (result.data['export_status'] === 'finished') {
          clearInterval(handle);
          return resolve();
        }
      }).catch(reject);
    }, 2 * 1000);
  });
};

const download = async (http, uri, projectPath) => {
  const result = await http.get(uri, {
    responseType: 'stream'
  });
  const stream = fs.createWriteStream(`out/${projectPath.replace('/', '_')}.tar.gz`);
  await asyncWriteStream(result.data, stream);
  stream.close();
};

const asyncWriteStream = (readable, writable) => {
  return new Promise((resolve, reject) => {
      writable.on('finish', resolve);
      writable.on('error', reject);
      readable.pipe(writable);
    }
  );
};

module.exports = exportProject;
