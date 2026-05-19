import fs from 'fs';
import https from 'https';

const download = (url: string, path: string) => {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode !== 200) {
        reject(new Error(`Failed to download: ${res.statusCode}`));
        return;
      }
      const fileStream = fs.createWriteStream(path);
      res.pipe(fileStream);
      fileStream.on('finish', () => {
        fileStream.close();
        resolve(true);
      });
    }).on('error', reject);
  });
};

async function main() {
  try {
    await download('https://storage.googleapis.com/mpx-node/prompt_images/e83b4822-777e-4054-9988-293b4550ecec.jpg', 'public/logo-light.jpg');
    console.log('Logo light downloaded');
    await download('https://storage.googleapis.com/mpx-node/prompt_images/cf847d0f-488f-4ba7-b7d6-3d61b365ab37.jpg', 'public/logo-dark.jpg');
    console.log('Logo dark downloaded');
  } catch (error) {
    console.error(error);
  }
}

main();
