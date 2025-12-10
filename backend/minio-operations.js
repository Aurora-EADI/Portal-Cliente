const Minio = require('minio');

// Configurar o cliente MinIO
const minioClient = new Minio.Client({
  endPoint: 'localhost',
  port: 9000,
  useSSL: false,
  accessKey: 'minioadmin',
  secretKey: 'minioadmin'
});

// Testar conexão listando buckets
async function testarConexao() {
  try {
    const buckets = await minioClient.listBuckets();
    console.log('✅ Conexão bem-sucedida!');
    console.log('Buckets disponíveis:', buckets);
  } catch (err) {
    console.error('❌ Erro na conexão:', err);
  }
}

// Exemplo de upload de arquivo
async function uploadArquivo() {
  try {
    const bucketName = 'documents';
    const fileName = 'teste.txt';
    const filePath = './teste.txt';
    
    await minioClient.fPutObject(bucketName, fileName, filePath);
    console.log('✅ Arquivo enviado com sucesso!');
  } catch (err) {
    console.error('❌ Erro no upload:', err);
  }
}

// Exemplo de download de arquivo
async function downloadArquivo() {
  try {
    const bucketName = 'documents';
    const fileName = 'teste.txt';
    const downloadPath = './download-teste.txt';
    
    await minioClient.fGetObject(bucketName, fileName, downloadPath);
    console.log('✅ Arquivo baixado com sucesso!');
  } catch (err) {
    console.error('❌ Erro no download:', err);
  }
}

// Executar testes
testarConexao();