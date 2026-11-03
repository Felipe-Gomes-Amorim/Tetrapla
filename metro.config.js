const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Escritos dos Pais (assets/fathers/*.md) entram no bundle como assets
config.resolver.assetExts.push('md');

module.exports = config;
