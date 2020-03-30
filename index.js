const exportJob = require('./src/Export');
const importJob = require('./src/Import');
const fetchAll = require('./src/FetchAll');
const createSubgroup = require('./src/Subgroup');
const checkProject = require('./src/CheckProject');
const config = require('./config');

console.log('Starting batch job of export, import and creation of subgroups. This will take time...');

Promise.resolve()
  // Fetch all the projects that are supposed to be moved.
  .then(async () => {
    const result = await fetchAll(config.from.url, config.from.key, config.from.sudo);
    console.log(`Found a total of ${result.length} projects to migrate.`);
    return result;
  })
  // Find all unique namespaces.
  .then((data) => {
    console.log('Finding namespaces.');
    let unique = {};
    // path_with_namespace from the simple format contains the namespace
    // and the name of the project itself. So here we need fix names so that
    // they don't contain the namespace data.
    for (let i = 0; i < data.length; i++) {
      const full = data[i]['path_with_namespace'];
      let namespace = full.substring(0, full.length - (data[i]['path'].length + 1));
      unique[namespace] = true;
    }
    unique = Object.keys(unique);
    console.log(unique.length + ' namespaces to validate or create.');
    return {
      data: data,
      namespaces: unique
    }
  })
  // Create any namespaces that does not exist.
  // If they do exist and the cache doesnt have it, a query to the api will be made to make
  // sure that the ID exist.
  .then(async ({namespaces, data}) => {
    console.log('Creating namespaces.');
    const namespaceMap = {};

    let currentChunk = namespaces.splice(0, 30);
    // Chunk up the array in 30's so that we can add a sleep on rate limiting.
    while (currentChunk.length > 0) {
      for (let i = 0; i < currentChunk.length; i++) {
        const result = await createSubgroup(config.to.url, currentChunk[i], config.to.namespace, config.to.key);
        console.log(`Namespace ${config.to.namespace}/${currentChunk[i]} has id ${result}`);
        // ID mapped to the namespace name to allow usage of it later on.
        namespaceMap[currentChunk[i]] = result;
        await sleep(500);
      }

      // Rate limit control!
      console.log('Sleeping 5 seconds...');
      await sleep(5000);

      currentChunk = namespaces.splice(0, 30);
    }

    console.log('Done. All namespaces set up completed.');
    return { data: data, namespaces: namespaceMap };
  })
  .then(async ({namespaces, data}) => {
    console.log('Import/export of projects starting...');
    // Each project will be exported and imported one at a time, if it does not already exist.
    // In case it exist, we do nothing!
    const count = data.length;
    for (let index = 0; index < count; index++) {
      const project = data[index];
      // To not do too much work, we check if the project exist on
      // the new remote.
      const exist = await checkProject(
        config.to.url,
        `${config.to.namespace}/${project['path_with_namespace']}`,
        config.to.key
      );

      const projectName = `${config.to.namespace}/${project['path_with_namespace']}`;
      if (exist) {
        console.log(`Project ${projectName} exists. Skipping.`);
        continue;
      }

      const fullPath = project['path_with_namespace'];
      // The `path` variable contains the name, while _with.. contains the parent namespace.
      // In this case, the name and the slash before it have to go!
      // Export and fetch file!
      await exportJob(config.from.url, project, config.from.key, config.from.sudo);
      console.log(`Project ${projectName} exported from ${config.from.url}.`);
      // By now, we have the whole project file stored in the out directory.
      // So import on the new server...
      // The createSubgroup should hit the cache.
      const namespace = await createSubgroup(config.to.url, fullPath.substring(0, fullPath.length - (project['path'].length + 1)), config.to.namespace, config.to.key);
      console.log(`Inserting ${projectName} into ${namespace}`);
      await importJob(config.to.url, project, config.to.key, namespace);
      console.log(`Project ${projectName} imported to ${config.to.url}`);
      await sleep(2000); // Sleep 2 seconds for rate limit!
    }

    console.log('All projects imported.');
  })
  .catch(console.error);


const sleep = (time) => {
  return new Promise((resolve, reject) => {
    setTimeout(resolve, time);
  });
};
