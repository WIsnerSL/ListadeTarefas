import React, { useState, useEffect } from 'react';
import axios from 'axios';

function App() {
  const [tarefas, setTarefas] = useState([]);
  const [novaTarefa, setNovaTarefa] = useState({ nome: '', custo: '', data_limite: '' });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editandoTarefa, setEditandoTarefa] = useState(null);

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

  const handleOpenModal = (tarefa = null) => {
    if (tarefa) {
      setNovaTarefa({ ...tarefa });
      setEditandoTarefa(tarefa.id);
    } else {
      setNovaTarefa({ nome: '', custo: '', data_limite: '' });
      setEditandoTarefa(null);
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditandoTarefa(null);
  };

  const handleAddOrEditTarefa = async () => {
    if (!novaTarefa.nome || novaTarefa.custo === '' || !novaTarefa.data_limite) {
      alert("Por favor, preencha todos os campos.");
      return;
    }

    const tarefaData = {
      nome: novaTarefa.nome,
      custo: parseFloat(novaTarefa.custo) || 0, // Converte para número ou usa 0
      data_limite: novaTarefa.data_limite,
    };

    try {
      if (editandoTarefa) {
        await axios.put(`http://localhost:3000/api/tarefas/${editandoTarefa}`, tarefaData);
        console.log("Tarefa editada com sucesso!");
      } else {
        await axios.post('http://localhost:3000/api/tarefas', tarefaData);
        console.log("Tarefa criada com sucesso!");
      }
      fetchTarefas();
      handleCloseModal();
    } catch (error) {
      console.error('Erro ao adicionar/editar tarefa:', error);
      if (error.response) {
        console.log("Erro de resposta do servidor:", error.response.data);
      }
    }
  };

  const handleDeleteTarefa = async (id) => {
    try {
      await axios.delete(`http://localhost:3000/api/tarefas/${id}`);
      fetchTarefas();
      console.log("Tarefa excluída com sucesso!");
    } catch (error) {
      console.error('Erro ao excluir tarefa:', error);
    }
  };

  return (
    <div style={{ textAlign: 'center', padding: '20px', backgroundColor: '#1d1d1d', height: '100vh', color: '#ffffff' }}>
      <h1 style={{ color: '#ffffff' }}>Tarefas</h1>
      <button
        onClick={() => handleOpenModal()}
        style={{
          padding: '10px 20px',
          fontSize: '16px',
          borderRadius: '5px',
          border: 'none',
          backgroundColor: '#007bff',
          color: '#ffffff',
          cursor: 'pointer',
          marginBottom: '20px'
        }}
      >
        Add Tarefa
      </button>

      {isModalOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
          backgroundColor: 'rgba(0, 0, 0, 0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center'
        }}>
          <div style={{
            backgroundColor: '#ffffff', padding: '20px', borderRadius: '5px', width: '300px', color: '#000000'
          }}>
            <h2>{editandoTarefa ? "Editar Tarefa" : "Nova Tarefa"}</h2>
            <input
              type="text"
              placeholder="Nome da tarefa"
              value={novaTarefa.nome}
              onChange={(e) => setNovaTarefa({ ...novaTarefa, nome: e.target.value })}
              style={{ padding: '10px', width: '100%', marginBottom: '10px' }}
            />
            <input
              type="number"
              placeholder="Custo"
              value={novaTarefa.custo}
              onChange={(e) => setNovaTarefa({ ...novaTarefa, custo: e.target.value })}
              style={{ padding: '10px', width: '100%', marginBottom: '10px' }}
            />
            <input
              type="date"
              placeholder="Data Limite"
              value={novaTarefa.data_limite}
              onChange={(e) => setNovaTarefa({ ...novaTarefa, data_limite: e.target.value })}
              style={{ padding: '10px', width: '100%', marginBottom: '10px' }}
            />
            <button onClick={handleAddOrEditTarefa} style={{
              padding: '10px 20px', marginRight: '10px', backgroundColor: '#007bff', color: '#ffffff', border: 'none', cursor: 'pointer'
            }}>
              Salvar
            </button>
            <button onClick={handleCloseModal} style={{
              padding: '10px 20px', backgroundColor: '#ff4d4d', color: '#ffffff', border: 'none', cursor: 'pointer'
            }}>
              Cancelar
            </button>
          </div>
        </div>
      )}

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
            <p><strong>Custo:</strong> R${Number(tarefa.custo).toFixed(2)}</p>
            <p><strong>Data Limite:</strong> {new Date(tarefa.data_limite).toLocaleDateString()}</p>
            <button onClick={() => handleOpenModal(tarefa)} style={{
              marginRight: '10px', padding: '5px 10px', backgroundColor: '#007bff', color: '#ffffff', border: 'none', cursor: 'pointer'
            }}>
              Editar
            </button>
            <button onClick={() => handleDeleteTarefa(tarefa.id)} style={{
              padding: '5px 10px', backgroundColor: '#ff4d4d', color: '#ffffff', border: 'none', cursor: 'pointer'
            }}>
              Excluir
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
