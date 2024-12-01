import React, { useState } from "react";
import "./App.css";
import Traductor from "./Traductor";
import SummaryTool from "./SummaryTool";

function App() {
  const [selectedTool, setSelectedTool] = useState("translator");
  const [loading, setLoading] = useState(false); // Estado de carga global
  const [error, setError] = useState(""); // Estado de error global

  const startLoading = () => {
    setLoading(true);
    setError(""); // Limpiar errores al iniciar
  };

  const stopLoading = () => {
    setLoading(false);
  };

  const handleError = (errorMessage) => {
    setError(errorMessage);
    setLoading(false); // Detener carga cuando hay un error
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>LinguaFlow - Aprende idiomas con IA</h1>
        <nav>
          <button
            className={selectedTool === "translator" ? "active" : ""}
            onClick={() => setSelectedTool("translator")}
          >
            Traductor Inteligente
          </button>
          <button
            className={selectedTool === "summary" ? "active" : ""}
            onClick={() => setSelectedTool("summary")}
          >
            Resumidor Inteligente
          </button>
        </nav>
      </header>
      <main>
        {loading && <p>Cargando...</p>}
        {error && <p style={{ color: "red" }}>{error}</p>}

        {selectedTool === "translator" && (
          <Traductor
            startLoading={startLoading}
            stopLoading={stopLoading}
            handleError={handleError}
          />
        )}
        {selectedTool === "summary" && (
          <SummaryTool
            startLoading={startLoading}
            stopLoading={stopLoading}
            handleError={handleError}
            loading={loading}
          />
        )}
      </main>
      <footer>
        <p>© 2024 LinguaFlow. Potenciado por las APIs de Google y React.</p>
      </footer>
    </div>
  );
}

export default App;
