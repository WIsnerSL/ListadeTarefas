const { Pool } = require('pg');
const express = require('express');
const cors = require('cors');

const app = express();

// Configuração do CORS
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true
}));

app.options('*', cors());
app.use(express.json());
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

// Função para checar se um valor é um número inteiro válido
const isValidInteger = (value) => Number.isInteger(value);

// Endpoint para listar todas as tarefas
app.get('/api/tarefas', async (req, res) => {
    try {
        const result = await pool.query('SELECT id, nome, custo, data_limite, ordem_apresentacao FROM tarefas ORDER BY ordem_apresentacao');
        res.status(200).json(result.rows);
    } catch (error) {
        console.error('Erro ao listar tarefas:', error);
        res.status(500).json({ message: 'Erro ao listar tarefas', error: error.message });
    }
});

// Endpoint para criar uma nova tarefa
app.post('/api/tarefas', async (req, res) => {
    const { nome, custo, data_limite } = req.body;

    if (!nome || isNaN(custo) || !data_limite) {
        return res.status(400).json({ message: 'Nome, custo e data_limite são obrigatórios e devem ser válidos.' });
    }

    try {
        // Verifica se o nome já existe
        const nameCheck = await pool.query('SELECT 1 FROM tarefas WHERE nome = $1', [nome]);
        if (nameCheck.rows.length > 0) {
            return res.status(400).json({ message: 'O nome da tarefa já existe.' });
        }

        // Define a ordem de apresentação como a última
        const ordemResult = await pool.query('SELECT COALESCE(MAX(ordem_apresentacao), 0) + 1 AS nova_ordem FROM tarefas');
        const ordem_apresentacao = ordemResult.rows[0].nova_ordem;

        await pool.query(
            'INSERT INTO tarefas (nome, custo, data_limite, ordem_apresentacao) VALUES ($1, $2, $3, $4)', 
            [nome, parseFloat(custo), data_limite, ordem_apresentacao]
        );

        res.status(201).json({ message: 'Tarefa criada com sucesso!' });
    } catch (error) {
        console.error('Erro ao criar tarefa:', error);
        res.status(500).json({ message: 'Erro ao criar tarefa', error: error.message });
    }
});



// Endpoint para excluir uma tarefa pelo ID
app.delete('/api/tarefas/:id', async (req, res) => {
    const { id } = req.params;

    if (!isValidInteger(Number(id))) {
        return res.status(400).json({ message: 'ID inválido.' });
    }

    try {
        await pool.query('DELETE FROM tarefas WHERE id = $1', [id]);
        res.status(200).json({ message: 'Tarefa excluída com sucesso!' });
    } catch (error) {
        console.error('Erro ao excluir tarefa:', error);
        res.status(500).json({ message: 'Erro ao excluir tarefa', error: error.message });
    }
});

// Endpoint para atualizar a ordem de apresentação de várias tarefas
app.put('/api/tarefas/atualizar-ordem', async (req, res) => {
    const tarefasOrdem = req.body;

    try {
        // Inicia a transação com isolamento SERIALIZABLE
        await pool.query('BEGIN ISOLATION LEVEL SERIALIZABLE');

        for (const tarefa of tarefasOrdem) {
            // Converte para inteiros explicitamente e valida apenas os campos relevantes
            const id = parseInt(tarefa.id, 10);
            const ordem_apresentacao = parseInt(tarefa.ordem_apresentacao, 10);

            if (isNaN(id) || isNaN(ordem_apresentacao)) {
                await pool.query('ROLLBACK');
                return res.status(400).json({ message: 'ID e ordem_apresentacao são obrigatórios e devem ser válidos.' });
            }

            await pool.query(
                'UPDATE tarefas SET ordem_apresentacao = $1 WHERE id = $2',
                [ordem_apresentacao, id]
            );
        }

        // Confirma a transação
        await pool.query('COMMIT');
        res.status(200).json({ message: 'Ordem das tarefas atualizada com sucesso!' });
    } catch (error) {
        await pool.query('ROLLBACK');
        console.error('Erro ao atualizar a ordem das tarefas:', error);
        res.status(500).json({ message: 'Erro ao atualizar a ordem das tarefas', error: error.message });
    }
});

// Endpoint para editar uma tarefa existente
app.put('/api/tarefas/:id', async (req, res) => {
    const { id } = req.params;
    const { nome, custo, data_limite } = req.body;

    // Verifica se todos os campos necessários estão presentes
    if (!nome || custo === undefined || !data_limite) {
        return res.status(400).json({ message: 'Nome, custo e data_limite são obrigatórios.' });
    }

    try {
        // Atualiza a tarefa no banco de dados
        const result = await pool.query(
            'UPDATE tarefas SET nome = $1, custo = $2, data_limite = $3 WHERE id = $4 RETURNING *',
            [nome, parseFloat(custo), data_limite, id]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Tarefa não encontrada.' });
        }

        res.status(200).json({ message: 'Tarefa atualizada com sucesso!', tarefa: result.rows[0] });
    } catch (error) {
        console.error('Erro ao editar tarefa:', error);
        res.status(500).json({ message: 'Erro ao editar tarefa', error: error.message });
    }
});


// Inicia o servidor
app.listen(PORT, (err) => {
    if (err) {
        console.error("Erro ao iniciar o servidor:", err);
    } else {
        console.log(`Servidor rodando em http://localhost:${PORT}`);
    }
})//** */