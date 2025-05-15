import React, { useState } from "react";
import axios from "axios"; // Para fazer requisições HTTP

const FileUpload = () => {
  const [file, setFile] = useState(null);

  // Função para lidar com a seleção do ficheiro
  const handleFileChange = (event) => {
    setFile(event.target.files[0]);
  };

  // Função para enviar o ficheiro
  const handleFileUpload = async () => {
    if (!file) {
      alert("Selecione um ficheiro primeiro!");
      return;
    }

    const formData = new FormData();
    formData.append("file", file); // Adiciona o ficheiro ao FormData

    try {
      const response = await axios.post("http://127.0.0.1:5000/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data", // Necessário para enviar ficheiros
        },
      });
      alert("Ficheiro enviado com sucesso!");
      console.log("Resposta do servidor:", response.data);
    } catch (error) {
      console.error("Erro ao enviar o ficheiro:", error);
      alert("Ocorreu um erro ao enviar o ficheiro!");
    }
  };

  return (
    <div>
      <h1>Carregar Ficheiro</h1>
      <input type="file" onChange={handleFileChange} />
      <button onClick={handleFileUpload}>Enviar</button>
    </div>
  );
};

export default FileUpload;
