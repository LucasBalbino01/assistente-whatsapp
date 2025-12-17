const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static('web/public'));

// ---------- FUNÇÕES ----------
function lerUsuarios() {
    if (!fs.existsSync('users.json')) {
        fs.writeFileSync('users.json', JSON.stringify({ usuarios: [] }, null, 2));
    }
    return JSON.parse(fs.readFileSync('users.json'));
}

function salvarUsuarios(dados) {
    fs.writeFileSync('users.json', JSON.stringify(dados, null, 2));
}

function lerDados() {
    if (!fs.existsSync('data.json')) {
        fs.writeFileSync('data.json', JSON.stringify({ gastos: [], lembretes: [] }, null, 2));
    }
    return JSON.parse(fs.readFileSync('data.json'));
}

// ---------- ROTAS ----------
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'web/views/login.html'));
});

// LOGIN
app.post('/registrar', (req, res) => {
    const { telefone, senha } = req.body;
    const dados = lerUsuarios();

    if (dados.usuarios.some(u => u.telefone === telefone)) {
        return res.send('Usuário já existe');
    }

    dados.usuarios.push({ telefone, senha });
    salvarUsuarios(dados);

    res.redirect('/dashboard/' + telefone);
});

// CADASTRO
app.post('/registrar', (req, res) => {
    const { telefone, senha } = req.body;
    const dados = lerUsuarios();

    if (dados.usuarios.some(u => u.telefone === telefone)) {
        return res.send('Usuário já existe');
    }

    dados.usuarios.push({ telefone, senha });
    salvarUsuarios(dados);

    res.redirect('/dashboard/' + telefone);
});

// DASHBOARD
app.get('/dashboard/:usuario', (req, res) => {
    res.sendFile(path.join(__dirname, 'web/views/dashboard.html'));
});

// API
app.get('/api/dados/:usuario', (req, res) => {
    const dados = lerDados();
    const usuario = req.params.usuario;

    res.json({
        movimentos: dados.gastos.filter(g => g.usuario === usuario),
        lembretes: dados.lembretes.filter(l => l.usuario === usuario)
    });
});

app.listen(PORT, () => {
    console.log(`🌐 Painel rodando em http://localhost:${PORT}`);
});
