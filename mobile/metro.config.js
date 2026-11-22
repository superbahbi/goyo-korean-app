const path = require("node:path");
const { getDefaultConfig } = require("expo/metro-config");

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "..");

const config = getDefaultConfig(projectRoot);

// Watch the monorepo root so shared/ and client/src/lib/ hot-reload on iOS, Android, and Web.
config.watchFolders = [workspaceRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(workspaceRoot, "node_modules"),
];
config.resolver.extraNodeModules = {
  "@": path.resolve(workspaceRoot, "client", "src"),
  "@shared": path.resolve(workspaceRoot, "shared"),
};

module.exports = config;
