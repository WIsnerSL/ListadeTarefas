const { Pool } = require('pg');
const express = require('express');
const cors = require('cors'); // Importa o CORS

const app = express();

app.use(cors()); // Habilita o CORS para todas as rotas
app.use(express.json()); // Para ler JSON no corpo das requisições
console.log("Iniciando o servidor...");

const PORT = process.env.PORT || 3000;

// Configuração da conexão com o PostgreSQL
const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'postgres',
    password: '272003',
    port: 5432,
});

// Rota para listar todas as tarefas, ordenadas por "ordem_apresentacao"
app.get('/api/tarefas', async (req, res) => {
    try {
        const result = await pool.query('SELECT id, nome, custo, data_limite FROM tarefas ORDER BY ordem_apresentacao');
        res.status(200).json(result.rows);
    } catch (error) {
        console.error('Erro ao listar tarefas:', error);
        res.status(500).json({ message: 'Erro ao listar tarefas', error: error.message });
    }
});

// Rota para excluir uma tarefa pelo ID
app.delete('/api/tarefas/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query('DELETE FROM tarefas WHERE id = $1', [id]);
        res.status(200).json({ message: 'Tarefa excluída com sucesso!' });
    } catch (error) {
        console.error('Erro ao excluir tarefa:', error);
        res.status(500).json({ message: 'Erro ao excluir tarefa', error: error.message });
    }
});

// Rota para editar uma tarefa pelo ID
app.put('/api/tarefas/:id', async (req, res) => {
    const { id } = req.params;
    const { nome, custo, data_limite } = req.body;

    try {
        // Verificar se o nome já existe (exceto para a tarefa atual)
        const nameCheck = await pool.query(
            'SELECT 1 FROM tarefas WHERE nome = $1 AND id != $2',
            [nome, id]
        );

        if (nameCheck.rows.length > 0) {
            return res.status(400).json({ message: 'O nome da tarefa já existe.' });
        }

        // Atualizar a tarefa
        await pool.query(
            'UPDATE tarefas SET nome = $1, custo = $2, data_limite = $3 WHERE id = $4',
            [nome, custo, data_limite, id]
        );

        res.status(200).json({ message: 'Tarefa atualizada com sucesso!' });
    } catch (error) {
        console.error('Erro ao editar tarefa:', error);
        res.status(500).json({ message: 'Erro ao editar tarefa', error: error.message });
    }
});

// Rota para incluir uma nova tarefa
app.post('/api/tarefas', async (req, res) => {
    const { nome, custo, data_limite } = req.body;

    try {
        // Verificar se o nome já existe
        const nameCheck = await pool.query(
            'SELECT 1 FROM tarefas WHERE nome = $1',
            [nome]
        );

        if (nameCheck.rows.length > 0) {
            return res.status(400).json({ message: 'O nome da tarefa já existe.' });
        }

        // Obter a maior ordem de apresentação e incrementar para o novo registro
        const ordemResult = await pool.query('SELECT COALESCE(MAX(ordem_apresentacao), 0) + 1 AS nova_ordem FROM tarefas');
        const ordem_apresentacao = ordemResult.rows[0].nova_ordem;

        // Inserir a nova tarefa
        await pool.query(
            'INSERT INTO tarefas (nome, custo, data_limite, ordem_apresentacao) VALUES ($1, $2, $3, $4)',
            [nome, custo, data_limite, ordem_apresentacao]
        );

        res.status(201).json({ message: 'Tarefa criada com sucesso!' });
    } catch (error) {
        console.error('Erro ao criar tarefa:', error);
        res.status(500).json({ message: 'Erro ao criar tarefa', error: error.message });
    }
});

// Inicia o servidor e exibe a mensagem
app.listen(PORT, (err) => {
    if (err) {
        console.error("Erro ao iniciar o servidor:", err);
    } else {
        console.log(`Servidor rodando em http://localhost:${PORT}`);
    }
});

/***   */