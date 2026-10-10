import { Jimp } from 'jimp';

async function makeRoundFavicon() {
  const image = await Jimp.read('public/profile.jpg');
  
  // Make it square
  const size = Math.min(image.bitmap.width, image.bitmap.height);
  image.cover(size, size);
  
  // Create circular mask
  const circleMask = new Jimp(size, size, 0x00000000);
  circleMask.scan(0, 0, size, size, function(x, y) {
    const radius = size / 2;
    const distance = Math.sqrt(Math.pow(x - radius, 2) + Math.pow(y - radius, 2));
    if (distance <= radius) {
      this.setPixelColor(0xFFFFFFFF, x, y);
    }
  });

  // Apply mask
  image.mask(circleMask, 0, 0);

  // Resize to favicon size
  image.resize(128, 128);

  // Save as PNG
  await image.writeAsync('public/profile-round.png');
  console.log("Favicon created successfully");
}

makeRoundFavicon().catch(console.error);
