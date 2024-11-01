import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { FaEdit, FaTrash, FaArrowUp, FaArrowDown } from 'react-icons/fa';

function App() {
  const [tarefas, setTarefas] = useState([]);
  const [novaTarefa, setNovaTarefa] = useState({ nome: '', custo: '', data_limite: '' });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editandoTarefa, setEditandoTarefa] = useState(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [tarefaToDelete, setTarefaToDelete] = useState(null);

  useEffect(() => {
    fetchTarefas();
  }, []);

  const fetchTarefas = async () => {
    try {
      const response = await axios.get('http://52.67.17.6:3000/api/tarefas');
      const sortedTasks = response.data.sort((a, b) => a.ordem_apresentacao - b.ordem_apresentacao);
      setTarefas(sortedTasks);
    } catch (error) {
      console.error('Erro ao buscar tarefas:', error.response ? error.response.data : error.message);
    }
  };

  const handleOpenModal = (tarefa = null) => {
    if (tarefa) {
      setNovaTarefa({
        ...tarefa,
        data_limite: tarefa.data_limite ? new Date(tarefa.data_limite).toISOString().split('T')[0] : ''
      });
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
      custo: parseFloat(novaTarefa.custo) || 0,
      data_limite: novaTarefa.data_limite,
      ordem_apresentacao: editandoTarefa ? novaTarefa.ordem_apresentacao : tarefas.length + 1,
    };

    try {
      if (editandoTarefa) {
        await axios.put(`http://52.67.17.6:3000/api/tarefas/${editandoTarefa}`, tarefaData);
        console.log("Tarefa editada com sucesso!");
      } else {
        await axios.post('http://52.67.17.6:3000/api/tarefas', tarefaData);
        console.log("Tarefa criada com sucesso!");
      }
      fetchTarefas();
      handleCloseModal();
    } catch (error) {
      console.error('Erro ao adicionar/editar tarefa:', error.response ? error.response.data : error.message);
    }
  };

  const handleDeleteTarefa = (tarefa) => {
    setTarefaToDelete(tarefa);
    setIsDeleteConfirmOpen(true);
  };

  const confirmDeleteTarefa = async () => {
    try {
      await axios.delete(`http://52.67.17.6:3000/api/tarefas/${tarefaToDelete.id}`);
      fetchTarefas();
      console.log("Tarefa excluída com sucesso!");
      setIsDeleteConfirmOpen(false);
      setTarefaToDelete(null);
    } catch (error) {
      console.error('Erro ao excluir tarefa:', error.response ? error.response.data : error.message);
    }
  };

  const cancelDeleteTarefa = () => {
    setIsDeleteConfirmOpen(false);
    setTarefaToDelete(null);
  };

  const handleDragEnd = async (result) => {
    if (!result.destination) return;

    const reorderedTarefas = Array.from(tarefas);
    const [movedTask] = reorderedTarefas.splice(result.source.index, 1);
    reorderedTarefas.splice(result.destination.index, 0, movedTask);

    const updatedTasks = reorderedTarefas.map((tarefa, index) => ({
      id: tarefa.id,
      ordem_apresentacao: index + 1,
    }));
    setTarefas(reorderedTarefas);

    try {
      await axios.put('http://52.67.17.6:3000/api/tarefas/atualizar-ordem', updatedTasks);
      console.log('Ordem das tarefas atualizada com sucesso!');
    } catch (error) {
      console.error('Erro ao atualizar a ordem das tarefas:', error.response ? error.response.data : error.message);
    }
  };

  const moveTaskUp = async (index) => {
    if (index <= 0) return;
    const reorderedTarefas = Array.from(tarefas);
    const [task] = reorderedTarefas.splice(index, 1);
    reorderedTarefas.splice(index - 1, 0, task);

    await updateTaskOrder(reorderedTarefas);
  };

  const moveTaskDown = async (index) => {
    if (index >= tarefas.length - 1) return;
    const reorderedTarefas = Array.from(tarefas);
    const [task] = reorderedTarefas.splice(index, 1);
    reorderedTarefas.splice(index + 1, 0, task);

    await updateTaskOrder(reorderedTarefas);
  };

  const updateTaskOrder = async (reorderedTarefas) => {
    const updatedTasks = reorderedTarefas.map((tarefa, index) => ({
      id: tarefa.id,
      ordem_apresentacao: index + 1,
    }));
    setTarefas(reorderedTarefas);

    try {
      await axios.put('http://52.67.17.6:3000/api/tarefas/atualizar-ordem', updatedTasks);
      console.log('Ordem das tarefas atualizada com sucesso!');
    } catch (error) {
      console.error('Erro ao atualizar a ordem das tarefas:', error.response ? error.response.data : error.message);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: '#1d1d1d', color: '#ffffff' }}>
      <div style={{ flex: 1, padding: '20px', textAlign: 'center' }}>
        <h1 style={{ color: '#ffffff' }}>Tarefas</h1>

        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="tarefas">
            {(provided) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '10px',
                }}
              >
                {tarefas.map((tarefa, index) => (
                  <Draggable key={tarefa.id} draggableId={tarefa.id.toString()} index={index}>
                    {(provided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        style={{
                          backgroundColor: '#3a3a3a',
                          padding: '15px',
                          borderRadius: '5px',
                          width: '80%',
                          maxWidth: '400px',
                          color: '#ffffff',
                          textAlign: 'left',
                          border: tarefa.custo >= 1000 ? '2px solid red' : 'none',
                          position: 'relative',
                          ...provided.draggableProps.style,
                        }}
                      >
                        {/* Botões Subir e Descer no canto superior direito */}
                        <div style={{ position: 'absolute', top: '10px', right: '10px', display: 'flex', gap: '5px' }}>
                          <button onClick={() => moveTaskUp(index)} disabled={index === 0} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#ffffff' }}>
                            <FaArrowUp />
                          </button>
                          <button onClick={() => moveTaskDown(index)} disabled={index === tarefas.length - 1} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#ffffff' }}>
                            <FaArrowDown />
                          </button>
                        </div>

                        <h3>{tarefa.nome}</h3>
                        <p><strong>Custo:</strong> R${Number(tarefa.custo).toFixed(2)}</p>
                        <p><strong>Data Limite:</strong> {new Date(tarefa.data_limite).toLocaleDateString()}</p>

                        {/* Botões Editar e Excluir alinhados à direita */}
                        <div style={{
                          position: 'absolute',
                          bottom: '10px',
                          right: '10px',
                          display: 'flex',
                          gap: '10px'
                        }}>
                          <button onClick={() => handleOpenModal(tarefa)} style={{
                            padding: '5px 10px', backgroundColor: '#007bff', color: '#ffffff', border: 'none', cursor: 'pointer', borderRadius: '5px'
                          }}>
                            <FaEdit /> Editar
                          </button>
                          <button onClick={() => handleDeleteTarefa(tarefa)} style={{
                            padding: '5px 10px', backgroundColor: '#ff4d4d', color: '#ffffff', border: 'none', cursor: 'pointer', borderRadius: '5px'
                          }}>
                            <FaTrash /> Excluir
                          </button>
                        </div>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </div>

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
          width: '100%',
          maxWidth: '200px',
          alignSelf: 'center',
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
            backgroundColor: '#ffffff', padding: '20px', borderRadius: '5px', width: '280px', color: '#000000'
          }}>
            <h2>{editandoTarefa ? "Editar Tarefa" : "Nova Tarefa"}</h2>
            <input
              type="text"
              placeholder="Nome da tarefa"
              value={novaTarefa.nome}
              onChange={(e) => setNovaTarefa({ ...novaTarefa, nome: e.target.value })}
              style={{
                padding: '10px',
                width: '90%', 
                marginBottom: '10px',
                borderRadius: '5px',
                border: '1px solid #ccc',
              }}
            />
            <input
              type="number"
              placeholder="Custo"
              value={novaTarefa.custo}
              onChange={(e) => setNovaTarefa({ ...novaTarefa, custo: e.target.value })}
              style={{
                padding: '10px',
                width: '90%', 
                marginBottom: '10px',
                borderRadius: '5px',
                border: '1px solid #ccc',
              }}
            />
            <input
              type="date"
              placeholder="Data Limite"
              value={novaTarefa.data_limite}
              onChange={(e) => setNovaTarefa({ ...novaTarefa, data_limite: e.target.value })}
              style={{
                padding: '10px',
                width: '90%', 
                marginBottom: '20px',
                borderRadius: '5px',
                border: '1px solid #ccc',
              }}
            />
            <button onClick={handleAddOrEditTarefa} style={{
              padding: '10px 20px', marginRight: '10px', backgroundColor: '#007bff', color: '#ffffff', border: 'none', cursor: 'pointer', borderRadius: '5px'
            }}>
              Salvar
            </button>
            <button onClick={handleCloseModal} style={{
              padding: '10px 20px', backgroundColor: '#ff4d4d', color: '#ffffff', border: 'none', cursor: 'pointer', borderRadius: '5px'
            }}>
              Cancelar
            </button>
          </div>
        </div>
      )}

      {isDeleteConfirmOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
          backgroundColor: 'rgba(0, 0, 0, 0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center'
        }}>
          <div style={{
            backgroundColor: '#ffffff', padding: '20px', borderRadius: '5px', width: '280px', color: '#000000', textAlign: 'center'
          }}>
            <h2>Confirmar Exclusão</h2>
            <p>Tem certeza de que deseja excluir esta tarefa?</p>
            <button onClick={confirmDeleteTarefa} style={{
              padding: '10px 20px', marginRight: '10px', backgroundColor: '#ff4d4d', color: '#ffffff', border: 'none', cursor: 'pointer', borderRadius: '5px'
            }}>
              Sim
            </button>
            <button onClick={cancelDeleteTarefa} style={{
              padding: '10px 20px', backgroundColor: '#007bff', color: '#ffffff', border: 'none', cursor: 'pointer', borderRadius: '5px'
            }}>
              Não
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
