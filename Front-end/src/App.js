import React, { useState, useEffect } from 'react';
import axios from 'axios';

function App() {
  const [tarefas, setTarefas] = useState([]);
  const [novaTarefa, setNovaTarefa] = useState('');

  useEffect(() => {
    fetchTarefas();
  }, []);

  const fetchTarefas = async () => {
    try {
      const response = await axios.get('http://localhost:3000/api/tarefas');
      setTarefas(response.data);
    } catch (error) {
      console.error('Erro ao buscar tarefas:', error);
    }
  };

  const handleAddTarefa = async () => {
    if (novaTarefa.trim() === '') return;

    try {
      await axios.post('http://localhost:3000/api/tarefas', {
        nome: novaTarefa,
        custo: 0,
        data_limite: new Date().toISOString().split('T')[0]
      });
      setNovaTarefa('');
      fetchTarefas();
    } catch (error) {
      console.error('Erro ao adicionar tarefa:', error);
    }
  };

  return (
    <div style={{ textAlign: 'center', padding: '20px', backgroundColor: '#1d1d1d', height: '100vh', color: '#ffffff' }}>
      <h1 style={{ color: '#ffffff' }}>Tarefas</h1>
      <div style={{ marginBottom: '20px' }}>
        <input
          type="text"
          placeholder="Digite o nome da tarefa..."
          value={novaTarefa}
          onChange={(e) => setNovaTarefa(e.target.value)}
          style={{
            padding: '10px',
            fontSize: '16px',
            borderRadius: '5px',
            border: 'none',
            marginRight: '10px',
            width: '250px'
          }}
        />
        <button
          onClick={handleAddTarefa}
          style={{
            padding: '10px 20px',
            fontSize: '16px',
            borderRadius: '5px',
            border: 'none',
            backgroundColor: '#007bff',
            color: '#ffffff',
            cursor: 'pointer'
          }}
        >
          Add
        </button>
      </div>
      <div style={{ maxWidth: '300px', margin: '0 auto' }}>
        {tarefas.map((tarefa) => (
          <div
            key={tarefa.id}
            style={{
              backgroundColor: '#3a3a3a',
              padding: '15px',
              borderRadius: '5px',
              marginBottom: '10px',
              color: '#ffffff',
              textAlign: 'left'
            }}
          >
            <h3>{tarefa.nome}</h3>
            <p><strong>Custo:</strong> R${
              typeof tarefa.custo === 'number' ? tarefa.custo.toFixed(2) : '0.00'
            }</p>
            <p><strong>Data Limite:</strong> {new Date(tarefa.data_limite).toLocaleDateString()}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
