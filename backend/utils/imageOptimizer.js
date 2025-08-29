const sharp = require('sharp');

exports.optimizeImage = async (buffer, options = {}) => {
  const {
    width = 800,
    height = 600,
    quality = 80,
    format = 'webp'
  } = options;

  return await sharp(buffer)
    .resize(width, height, { fit: 'inside', withoutEnlargement: true })
    .toFormat(format)
    .jpeg({ quality })
    .toBuffer();
};