const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');

/**
 *
 * @param {string} baseUri
 * @param {object} projectData
 * @param {string} apiKey
 * @param {number} namespace
 * @return {Promise<void>}
 */
const importJob  = async (baseUri, projectData, apiKey, namespace) => {
  const formData = new FormData();
  formData.append('file', fs.createReadStream(`out/${projectData['path_with_namespace'].replace('/', '_')}.tar.gz`), {
    filename: 'project.tar.gz'
  });

  formData.append('path', `${projectData['path']}`);
  formData.append('namespace', namespace);
  try {
    const result = await axios.post(`${baseUri}/api/v4/projects/import?private_token=${apiKey}`,
      formData,
      { headers: { ...formData.getHeaders() } }
    );

    if (result.status > 299) {
      console.error(`The project ${projectData['path_with_namespace']} failed to import due to rate limiting! Writing to error log.`);
      await fs.promises.appendFile('out/errors.log', `${projectData['path_with_namespace']} : ${namespace}\n`);
      console.log('Awaiting 1 minute to reset rates.');
      await sleep(60 * 1000);
      console.log('Retrying.');
      return importJob(baseUri, projectData, apiKey, namespace);
    }

  } catch (e) {
    console.error(`The project ${projectData['path_with_namespace']} failed to import! Writing to error log.`);
    await fs.promises.appendFile('out/errors.log', `${projectData['path_with_namespace']} : ${namespace}\n`);
  }



  await fs.promises.unlink(`out/${projectData['path_with_namespace'].replace('/', '_')}.tar.gz`);
};

const sleep = (time) => {
  return new Promise((resolve, reject) => {
    setTimeout(resolve, time);
  });
};


module.exports = importJob;
