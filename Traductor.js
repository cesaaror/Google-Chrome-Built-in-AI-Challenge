import React, { useState, useEffect } from "react";
import axios from "axios";

const Traductor = () => {
  const [inputText, setInputText] = useState("");
  const [translatedText, setTranslatedText] = useState("");
  const [targetLanguage, setTargetLanguage] = useState("es");
  const [languages, setLanguages] = useState([]); // Lista de idiomas disponibles
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const API_KEY = process.env.REACT_APP_TRANSLATE_API_KEY;

  const quickTranslateLanguages = [
    { code: "en", name: "Inglés" },
    { code: "de", name: "Alemán" },
    { code: "fr", name: "Francés" },
    { code: "ja", name: "Japonés" },
    { code: "zh", name: "Chino" },
  ];

  useEffect(() => {
    const fetchLanguages = async () => {
      try {
        const response = await axios.get(
          "https://translation.googleapis.com/language/translate/v2/languages",
          {
            params: {
              key: API_KEY,
              target: "en", // Idioma de los nombres de los idiomas
            },
          }
        );

        const languageList = response.data.data.languages;
        setLanguages(languageList);
      } catch (error) {
        console.error("Error al obtener idiomas:", error);
        setError("No se pudo cargar la lista de idiomas.");
      }
    };
    fetchLanguages(); // Llamar a la función
  }, [API_KEY]); // API_KEY como dependencia si puede cambiar

  const handleTranslate = async (languageCode = targetLanguage) => {
    if (!inputText.trim()) {
      setError("Por favor, introduce texto para traducir.");
      return;
    }

    setLoading(true);
    setError("");
    setTranslatedText("");

    try {
      const response = await axios.post(
        "https://translation.googleapis.com/language/translate/v2",
        null,
        {
          params: {
            q: inputText,
            target: languageCode,
            format: "text",
            key: API_KEY,
          },
        }
      );

      setTranslatedText(response.data.data.translations[0].translatedText);
    } catch (err) {
      setError(
        err.response
          ? `Error al traducir: ${err.response.data.error.message}`
          : "Ocurrió un error inesperado."
      );
      console.error("Error al traducir:", err.response ? err.response.data : err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2>Traductor Inteligente</h2>
      <textarea
        placeholder="Escribe algo para traducir..."
        value={inputText}
        onChange={(e) => setInputText(e.target.value)}
        rows="6"
        cols="50"
        style={{
          width: "100%",
          marginBottom: "15px",
          padding: "10px",
          borderRadius: "10px",
          border: "1px solid #ccc",
          boxShadow: "0 2px 5px rgba(0, 0, 0, 0.1)",
          resize: "vertical",
          transition: "border-color 0.3s ease, box-shadow 0.3s ease",
        }}
      />
      <div className="translation-buttons" style={{ marginBottom: "15px" }}>
        {quickTranslateLanguages.map((lang) => (
          <button
            key={lang.code}
            onClick={() => handleTranslate(lang.code)}
            disabled={loading}
            style={{
              backgroundColor: "#0078d4",
              color: "white",
              border: "2px solid transparent",
              padding: "10px 15px",
              margin: "5px",
              borderRadius: "30px",
              cursor: "pointer",
              fontSize: "1rem",
              boxShadow: "0 2px 5px rgba(0, 0, 0, 0.2)",
              transition: "all 0.3s ease-in-out",
            }}
            onMouseOver={(e) => {
              e.target.style.backgroundColor = "#005a9e";
              e.target.style.transform = "scale(1.1)";
            }}
            onMouseOut={(e) => {
              e.target.style.backgroundColor = "#0078d4";
              e.target.style.transform = "scale(1)";
            }}
            onMouseDown={(e) => {
              e.target.style.backgroundColor = "#004080";
            }}
            onMouseUp={(e) => {
              e.target.style.backgroundColor = "#005a9e";
            }}
          >
            {loading && targetLanguage === lang.code
              ? "Traduciendo..."
              : `Traducir a ${lang.name}`}
          </button>
        ))}
      </div>
      <div>
        <label htmlFor="languageSelect">Selecciona el idioma:</label>
        <select
          id="languageSelect"
          value={targetLanguage}
          onChange={(e) => setTargetLanguage(e.target.value)}
          style={{
            marginLeft: "10px",
            padding: "10px",
            borderRadius: "5px",
            border: "1px solid #ccc",
          }}
        >
          {languages.map((lang) => (
            <option key={lang.language} value={lang.language}>
              {lang.name || lang.language}
            </option>
          ))}
        </select>
        <button
          onClick={() => handleTranslate(targetLanguage)}
          disabled={loading}
          style={{
            marginLeft: "10px",
            padding: "10px 15px",
            backgroundColor: "#28a745",
            color: "#fff",
            border: "none",
            borderRadius: "25px",
            cursor: "pointer",
            boxShadow: "0 2px 5px rgba(0, 0, 0, 0.2)",
            transition: "all 0.3s ease",
          }}
          onMouseOver={(e) => {
            e.target.style.backgroundColor = "#218838";
            e.target.style.transform = "scale(1.05)";
          }}
          onMouseOut={(e) => {
            e.target.style.backgroundColor = "#28a745";
            e.target.style.transform = "scale(1)";
          }}
          onMouseDown={(e) => {
            e.target.style.backgroundColor = "#1e7e34";
          }}
          onMouseUp={(e) => {
            e.target.style.backgroundColor = "#218838";
          }}
        >
          {loading ? "Traduciendo..." : "Traducir"}
        </button>
      </div>
      {error && <p style={{ color: "red", marginTop: "10px" }}>{error}</p>}
      {translatedText && (
        <div style={{ marginTop: "20px" }}>
          <h3>Traducción:</h3>
          <p
            style={{
              padding: "10px",
              backgroundColor: "#f8f9fa",
              border: "1px solid #ccc",
              borderRadius: "5px",
              boxShadow: "0 2px 5px rgba(0, 0, 0, 0.1)",
            }}
          >
            {translatedText}
          </p>
        </div>
      )}
    </div>
  );
  
};

export default Traductor;
