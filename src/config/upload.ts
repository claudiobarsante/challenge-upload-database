import multer from 'multer';
import path from 'path';
import crypto from 'crypto'; //para gerar hashs, cryptografias...

//__dirname se refere ao diretório em q o arquivo upload.ts está
//e para chegar até a pasta tmp, tem q subir 2 níveis -> '..','..'

const tmpFolder = path.resolve(__dirname, '..', '..', 'tmp');

export default {
  directory: tmpFolder,
  storage: multer.diskStorage({
    destination: tmpFolder,
    filename(request, file, callback) {
      const fileHash = crypto.randomBytes(10).toString('hex'); //vai gerar 10bytes de texto aleatório e depois converter para string hexadecimal
      const fileName = `${fileHash}-${file.originalname}`;
      return callback(null, fileName);
    },
  }),
};
