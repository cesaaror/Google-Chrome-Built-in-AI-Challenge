import React, { useState } from "react";
import axios from "axios";

function SummaryTool({ startLoading, stopLoading, handleError, loading }) {
  const [file, setFile] = useState(null);
  const [summaryDownloadLink, setSummaryDownloadLink] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [inputText, setInputText] = useState(""); // Almacenar texto ingresado
  const [paragraphs, setParagraphs] = useState(1); // Número de párrafos del resumen
  const [manualSummary, setManualSummary] = useState(""); // Resumen generado manualmente

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    setFile(selectedFile);
    setErrorMessage("");

    if (selectedFile) {
      const allowedMimes = ["application/pdf", "image/jpeg", "image/png", "image/tiff"];
      if (!allowedMimes.includes(selectedFile.type)) {
        setErrorMessage("Solo se permiten archivos PDF, JPG, PNG y TIFF.");
        handleError("Solo se permiten archivos PDF, JPG, PNG y TIFF.");
        setFile(null);
      } else if (selectedFile.size > 20 * 1024 * 1024) {
        setErrorMessage("El archivo excede el tamaño máximo de 20 MB.");
        handleError("El archivo excede el tamaño máximo de 20 MB.");
        setFile(null);
      }
    }
  };

  const handleSubmitFile = async (event) => {
    event.preventDefault();

    if (!file) {
      setErrorMessage("Por favor, selecciona un archivo.");
      handleError("Por favor, selecciona un archivo.");
      return;
    }

    const formData = new FormData();
    formData.append("document", file);

    startLoading();

    try {
      const response = await axios.post("http://localhost:5000/process-document", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (response.data.summaryDownloadLink) {
        setSummaryDownloadLink(response.data.summaryDownloadLink);
      } else {
        setErrorMessage("No se pudo generar el resumen. Intenta nuevamente.");
        handleError("No se pudo generar el resumen. Intenta nuevamente.");
      }
    } catch (error) {
      console.error("Error al procesar el documento:", error);
      handleError("Error al procesar el documento. Intenta nuevamente.");
    }

    stopLoading();
  };

  const handleTextSummary = async (event) => {
    event.preventDefault();

    if (!inputText.trim()) {
      setErrorMessage("Por favor, introduce un texto para resumir.");
      return;
    }

    startLoading();

    try {
      const response = await axios.post("http://localhost:5000/process-text", {
        text: inputText,
        paragraphs,
      });

      if (response.data.summary) {
        setManualSummary(response.data.summary);
      } else {
        setErrorMessage("No se pudo generar el resumen del texto.");
        handleError("No se pudo generar el resumen del texto.");
      }
    } catch (error) {
      console.error("Error al procesar el texto:", error);
      handleError("Error al procesar el texto. Intenta nuevamente.");
    }

    stopLoading();
  };

  return (
    <div style={{ textAlign: "center", padding: "20px" }}>
      <h1>Resumidor de Documentos y Textos</h1>

      {/* Formulario de carga de archivo */}
      <form onSubmit={handleSubmitFile}>
        <input
          type="file"
          onChange={handleFileChange}
          accept=".pdf, image/jpeg, image/png, image/tiff"
        />
        <button type="submit" disabled={loading}>
          {loading ? "Procesando..." : "Subir y resumir"}
        </button>
      </form>

      {/* Entrada para texto manual */}
      <form onSubmit={handleTextSummary} style={{ marginTop: "20px" }}>
        <textarea
          rows="5"
          cols="50"
          placeholder="Pega tu texto aquí para resumir"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
        />
        <br />
        <label>
          Número de párrafos o líneas:
          <input
            type="number"
            min="1"
            value={paragraphs}
            onChange={(e) => setParagraphs(e.target.value)}
            style={{ marginLeft: "10px", width: "50px" }}
          />
        </label>
        <br />
        <button type="submit" disabled={loading}>
          {loading ? "Resumiendo..." : "Resumir texto"}
        </button>
      </form>

      {/* Mensajes de error */}
      {errorMessage && (
        <div style={{ marginTop: "20px", color: "red" }}>
          <p>{errorMessage}</p>
        </div>
      )}

      {/* Mostrar enlace de descarga del archivo resumido */}
      {summaryDownloadLink && (
        <div style={{ marginTop: "20px" }}>
          <h2>Resumen del Documento</h2>
          <p>Haz clic en el siguiente enlace para descargar el resumen:</p>
          <a href={summaryDownloadLink} target="_blank" rel="noopener noreferrer">
            Descargar resumen
          </a>
        </div>
      )}

      {/* Mostrar resumen generado manualmente */}
      {manualSummary && (
        <div style={{ marginTop: "20px" }}>
          <h2>Resumen del Texto</h2>
          <p>{manualSummary}</p>
        </div>
      )}
    </div>
  );
}

export default SummaryTool;
