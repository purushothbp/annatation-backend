const fs = require('fs/promises');
const path = require('path');

const projectRoot = path.join(__dirname, '..');
const srcDir = path.join(projectRoot, 'src');
const distDir = path.join(projectRoot, 'dist');
const envExample = path.join(projectRoot, '.env.example');

const copyDir = async (from, to) => {
  const entries = await fs.readdir(from, { withFileTypes: true });
  await fs.mkdir(to, { recursive: true });

  for (const entry of entries) {
    const srcPath = path.join(from, entry.name);
    const destPath = path.join(to, entry.name);

    if (entry.isDirectory()) {
      await copyDir(srcPath, destPath);
    } else if (entry.isFile()) {
      await fs.copyFile(srcPath, destPath);
    }
  }
};

const writeDeployPackageJson = async () => {
  const pkg = require(path.join(projectRoot, 'package.json'));

  const deployPackageJson = {
    name: pkg.name,
    version: pkg.version,
    description: pkg.description,
    type: pkg.type,
    main: 'index.js',
    scripts: {
      start: 'node index.js'
    },
    dependencies: pkg.dependencies
  };

  const formatted = `${JSON.stringify(deployPackageJson, null, 2)}\n`;
  await fs.writeFile(path.join(distDir, 'package.json'), formatted, 'utf8');
};

const copyEnvExample = async () => {
  try {
    await fs.copyFile(envExample, path.join(distDir, '.env.example'));
  } catch (error) {
    if (error.code !== 'ENOENT') {
      throw error;
    }
  }
};

const build = async () => {
  await fs.rm(distDir, { recursive: true, force: true });
  await copyDir(srcDir, distDir);
  await writeDeployPackageJson();
  await copyEnvExample();
};

build()
  .then(() => {
    console.log('Build completed. Deployment assets are in the dist/ directory.');
  })
  .catch((error) => {
    console.error('Build failed:', error);
    process.exit(1);
  });

