// Importa las librerías necesarias
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');
const { Storage } = require('@google-cloud/storage');
const { DocumentProcessorServiceClient } = require('@google-cloud/documentai');
const { PDFDocument } = require('pdf-lib');
require('dotenv').config(); // Cargar variables de entorno

// Verifica y muestra la ruta de las credenciales de Google Cloud
console.log('Ruta de las credenciales:', process.env.GOOGLE_APPLICATION_CREDENTIALS);

// Inicializa los clientes de Google Cloud
const storage = new Storage();
const client = new DocumentProcessorServiceClient();

// Inicializa Express
const app = express();

// Middleware para habilitar CORS
app.use(cors());

// Configuración de Multer para manejar la carga de archivos
const upload = multer({
  dest: 'uploads/', // Directorio local temporal
  limits: { fileSize: 20 * 1024 * 1024 }, // Límite de tamaño de archivo: 20 MB
  fileFilter: (_req, file, cb) => {
    const allowedMimes = ['application/pdf', 'image/jpeg', 'image/png', 'image/tiff'];
    if (!allowedMimes.includes(file.mimetype)) {
      return cb(new Error('Solo se permiten archivos PDF, JPG, PNG, TIFF'));
    }
    cb(null, true);
  },
});

// Configuración de buckets de Cloud Storage
const bucketName = ''; // Bucket para carga de documentos
const summaryBucketName = ''; // Bucket para resúmenes

// Ruta base para verificar el estado del servidor
app.get('/', (_req, res) => {
  res.send('Servidor funcionando correctamente');
});

// Función para dividir un PDF en partes
async function splitPDF(filePath, maxPages = 15) {
  const pdfBytes = fs.readFileSync(filePath); // Leer el PDF original
  const originalPdf = await PDFDocument.load(pdfBytes); // Cargar el PDF
  const totalPages = originalPdf.getPageCount(); // Número total de páginas

  const chunks = []; // Para almacenar las rutas de los nuevos PDFs

  for (let i = 0; i < totalPages; i += maxPages) {
    const newPdf = await PDFDocument.create(); // Crear un nuevo documento PDF
    const pageIndices = Array.from({ length: Math.min(maxPages, totalPages - i) }, (_, j) => i + j); // Índices de páginas actuales

    // Copiar páginas desde el documento original
    const pages = await newPdf.copyPages(originalPdf, pageIndices);
    pages.forEach((page) => newPdf.addPage(page)); // Añadir las páginas copiadas al nuevo PDF

    // Guardar el nuevo PDF
    const newPdfBytes = await newPdf.save();
    const newFilePath = filePath.replace('.pdf', `-part${Math.floor(i / maxPages) + 1}.pdf`);
    fs.writeFileSync(newFilePath, newPdfBytes);

    chunks.push(newFilePath); // Añadir la ruta del nuevo archivo al array de resultados
  }

  return chunks; // Devolver las rutas de los PDFs divididos
}

// Ruta para procesar documentos
app.post('/process-document', upload.single('document'), async (req, res) => {
  try {
    // Verifica si se subió un archivo
    if (!req.file) {
      return res.status(400).json({ error: 'No se ha subido ningún archivo.' });
    }

    const { path: filePath, originalname: fileName, size } = req.file;

    // Verifica el tamaño del archivo
    if (size > 20 * 1024 * 1024) {
      fs.unlinkSync(filePath); // Limpieza de archivo
      return res.status(400).json({ error: 'El archivo excede el tamaño máximo de 20 MB' });
    }

    console.log('Archivo recibido:', fileName, filePath);

    // Divide el PDF si excede el límite de páginas
    const pdfChunks = await splitPDF(filePath);

    // Sube cada parte dividida a Cloud Storage
    for (const chunkPath of pdfChunks) {
      const chunkName = chunkPath.split('/').pop();
      await storage.bucket(bucketName).upload(chunkPath, { destination: chunkName });
      console.log(`Archivo dividido subido: ${chunkName}`);
    }

    // Sube el archivo original a Cloud Storage
    await storage.bucket(bucketName).upload(filePath, { destination: fileName });
    console.log(`Archivo original subido a ${bucketName}/${fileName}`);

    // Configuración para procesar con Document AI
    const projectId = '';
    const location = '';
    const processorId = '';

    const request = {
      name: client.processorPath(projectId, location, processorId),
      rawDocument: {
        content: fs.readFileSync(filePath).toString('base64'),
        mimeType: req.file.mimetype,
      },
    };

    // Procesa el documento con Document AI
    const [response] = await client.processDocument(request);
    const summaryContent = response.document.text || 'No se pudo extraer texto del documento.';

    // Guarda el resumen en un archivo
    const summaryFileName = `${fileName.replace('.pdf', '-summary.txt')}`;
    const summaryFilePath = `./${summaryFileName}`;
    fs.writeFileSync(summaryFilePath, summaryContent);

    // Sube el resumen a Cloud Storage
    await storage.bucket(summaryBucketName).upload(summaryFilePath, { destination: summaryFileName });
    console.log(`Resumen subido a ${summaryBucketName}/${summaryFileName}`);

    // Hacer el archivo de resumen público
    await storage.bucket(summaryBucketName).file(summaryFileName).makePublic();
    console.log(`Resumen ahora es público: ${summaryFileName}`);

    const summaryDownloadLink = `https://storage.googleapis.com/${summaryBucketName}/${summaryFileName}`;

    // Limpieza de archivos locales
    fs.unlinkSync(filePath);
    fs.unlinkSync(summaryFilePath);

    res.json({
      message: 'Documento procesado correctamente',
      summaryDownloadLink,
    });
  } catch (error) {
    console.error('Error al procesar el documento:', error);
    res.status(500).json({
      error: 'Hubo un error al procesar el documento',
      details: error.message,
    });
  }
});

// Inicia el servidor
app.listen(5000, () => {
  console.log('Servidor corriendo en http://localhost:5000');
});
