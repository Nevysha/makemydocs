import fs from 'fs-extra';
import {glob} from 'glob';
import path from "node:path";
import {simpleGit} from 'simple-git'
import chalk from "chalk";

const log = console.log;

const readDir = async (_path, opt) => {

    _path = path.resolve(_path);

    return new Promise((resolve, reject) => {
        fs.readdir(_path, opt, (err, files) => {
            if (err) {
                reject(err);
            }
            resolve(files);
        });
    });
}

async function loadConfig() {
    let config = {};
    try {
        return (await import('../makemydocs.config.js')).default;
    } catch (err) {
        console.error("Error loading makemydocs.config.js")
        throw err;
    }
}

function getRepoNameFromUrl(repo) {
    const repoName = repo.url.split('/').pop().replace('.git', '');
    return repoName;
}

function applyNameMapping(mapping, fileName) {
    if (typeof mapping === 'object') {
        if (mapping[fileName]) {
            fileName = mapping[fileName];
        }
    } else if (typeof mapping === 'function') {
        fileName = mapping(fileName);
    }
    return fileName;
}

const main = async () => {

    //load the makemydocs.config.ts
    let config = await loadConfig();

    //ensure that directory '.makemydocs' exists
    await fs.ensureDir('.makemydocs/docs');

    log(chalk.blue.bold(`Found ${config.repositories.length} repositories to clone`));
    log('')

    for (const repo of config.repositories) {

        log(chalk.blue(`Working on ${repo.url}`));

        //check if token is needed
        if (repo.needsToken) {
            //load makemydocs.env.json
            let env = {};
            try {
                env = await fs.readJSON('makemydocs.env.json');

                //check if token is present
                if (!env.token) {
                    console.error(`A token is needed for ${repo.url} but makemydocs.env.json is missing`);
                    throw new Error('Token is missing');
                }

                //update the repo.url with the token
                repo.urlWithToken = repo.url.replace('https://', `https://${env.token}@`);
            }
            catch (err) {
                console.error(`A token is needed for ${repo.url} but makemydocs.env.json is missing`);
                throw err;
            }
        }

        const repoName = repo.url.split('/').pop().replace('.git', '');
        //check if the repo is already cloned. If it is, update it
        if (await fs.pathExists(`.makemydocs/docs/${repoName}`)) {
            log(chalk.blue(`Updating ${repo.url}`));
            const git = simpleGit(`.makemydocs/docs/${repoName}`);
            try {
                await git.pull();
            }
            catch (err) {
                console.error(`Error updating ${repo.url}`);
                throw err;
            }
            continue;
        }
        else {
            const git = simpleGit();
            try {
                log(chalk.blue(`Cloning ${repo.url}`));
                await git.clone(repo.urlWithToken || repo.url, `.makemydocs/docs/${repoName}`);
            }
            catch (err) {
                console.error(`Error cloning ${repo.url}`);
                throw err;
            }
        }
    }

    log('')
    log(chalk.green(`All repositories cloned or updated successfully`));

    //crawl the repositories and create a map of all .md with their paths
    let mdFiles = [];
    for (const repo of config.repositories) {
        const repoName = getRepoNameFromUrl(repo);
        const repoPath = `.makemydocs/docs/${repoName}`;
        const files = await readDir(repoPath, {recursive: true});
        for (let file of files) {
            if (file.endsWith('.md')) {
                file = path.normalize(file);

                //ensure that path are not OS specific
                file = file.replace(/\\/g, '/');

                let fileName = path.basename(file);

                //check if the repo has a name mapping
                if (repo.nameMapping) {
                    for (const mapping of repo.nameMapping) {
                        fileName = applyNameMapping(mapping, fileName);
                    }
                }

                //check if there is a global name mapping
                if (config.nameMapping) {
                    for (const mapping of config.nameMapping) {
                        fileName = applyNameMapping(mapping, fileName);
                    }
                }

                //if fileName is README.md, replace it with the parent directory name
                if (fileName === 'README.md') {
                    let parentDir = path.basename(path.dirname(file));

                    if (parentDir !== '.') {
                        fileName = parentDir;
                    }
                }

                const fileObj = {
                    path: path.resolve(repoPath, file),
                    name: fileName.replace('.md', ''),
                    repository: repoName
                }


                repo.categories = repo.categories || [{name: '__NONE__'}];
                //check if the file is in a category
                for (const category of repo.categories) {
                    if (fs.realpathSync(fileObj.path).replaceAll('\\','/').includes(category.path)) {

                        fileObj.category = category.name;
                    }
                    else {
                        fileObj.category = '__NONE__';
                    }
                }

                mdFiles.push(fileObj);
            }
        }
    }

    log(chalk.green(`Found ${Object.keys(mdFiles).length} .md files`));
    log(mdFiles);

    //write the map to .makemydocs/files-map.json
    await fs.writeJSON('.makemydocs/files-map.json', mdFiles);

    //create index.md
    let indexMd = `# Welcome to MakeMyDocs\n\n`;
    indexMd += `This is a site generated by MakeMyDocs\n\n`;
    indexMd += `## Repositories\n\n`;
    for (const repo of config.repositories) {
        indexMd += `- [${repo.url}](${repo.url})\n`;
    }
    await fs.writeFile('.makemydocs/docs/index.md', indexMd);


    await generateMkdocsYml();
}

const generateMkdocsYml = async () => {

    let config = await loadConfig();

    //load files-map.json
    let mdFiles = [];
    try {
        mdFiles = await fs.readJSON('.makemydocs/files-map.json');
    }
    catch (err) {
        console.error("Error loading files-map.json");
        throw err;
    }

    //map mdFiles by repository and category
    // {
    //     "repo1": {
    //         "category1": [
    //             {
    //                 files...
    //             },
    //             rest of files...
    //         ],
    //         "category2": [
    // ...

    let mdFilesByRepo = {};
    for (let repo of config.repositories) {
        const repoName = getRepoNameFromUrl(repo);
        mdFilesByRepo[repoName] = {};

        for (let file of mdFiles) {
            if (file.repository === repoName) {
                if (!mdFilesByRepo[repoName][file.category]) {
                    mdFilesByRepo[repoName][file.category] = [];
                }
                mdFilesByRepo[repoName][file.category].push(file);
            }
        }
    }



    //create mkdocs.yml
    let mkdocsYml = `site_name: ${config.siteName}\n`;
    mkdocsYml += `site_description: This is a site generated by MakeMyDocs\n`;
    mkdocsYml += `theme: readthedocs\n`;
    mkdocsYml += `nav:\n`;
    mkdocsYml += `  - Home: index.md\n`;

    for (const repo in mdFilesByRepo) {
        mkdocsYml += `  - ${repo}:\n`;
        for (const category in mdFilesByRepo[repo]) {

            const categoryIsNone = category === '__NONE__';
            if (!categoryIsNone) {
                mkdocsYml += `    - ${category}:\n`;
            }
            for (const file of mdFilesByRepo[repo][category]) {
                let _path = file.path;
                //path are absolute. We want them to be relative and to remove the .makemydocs/docs/<repo-name> from the path
                _path = path.relative('.makemydocs/docs', _path);

                const tabs = ' '.repeat(categoryIsNone ? 4 : 6);
                mkdocsYml += `${tabs}- ${file.name}: ${_path}\n`;
            }
        }
    }

    await fs.writeFile('.makemydocs/mkdocs.yml', mkdocsYml);
}

(() => main())();