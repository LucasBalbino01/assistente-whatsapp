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
        fs.writeFileSync(
            'users.json',
            JSON.stringify({ usuarios: [] }, null, 2)
        );
    }
    return JSON.parse(fs.readFileSync('users.json'));
}

function salvarUsuarios(dados) {
    fs.writeFileSync('users.json', JSON.stringify(dados, null, 2));
}

function lerDados() {
    if (!fs.existsSync('data.json')) {
        fs.writeFileSync(
            'data.json',
            JSON.stringify({ gastos: [], lembretes: [] }, null, 2)
        );
    }

    const dados = JSON.parse(fs.readFileSync('data.json'));

    // 🔒 GARANTE QUE SEMPRE EXISTAM ARRAYS
    if (!Array.isArray(dados.gastos)) dados.gastos = [];
    if (!Array.isArray(dados.lembretes)) dados.lembretes = [];

    return dados;
}

// ---------- ROTAS ----------

// LOGIN (TELA)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'web/views/login.html'));
});

// LOGIN (AÇÃO)
app.post('/login', (req, res) => {
    const { telefone, senha } = req.body;
    const dados = lerUsuarios();

    const usuario = dados.usuarios.find(
        u => u.telefone === telefone && u.senha === senha
    );

    if (!usuario) {
        return res.send('Usuário ou senha inválidos');
    }

    res.redirect('/dashboard/' + telefone);
});

// CADASTRO
app.post('/registrar', (req, res) => {
    const { telefone, senha } = req.body;
    const dados = lerUsuarios();

    if (!telefone || !senha) {
        return res.send('Preencha todos os campos');
    }

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

// API — DADOS DO USUÁRIO
app.get('/api/dados/:usuario', (req, res) => {
    const dados = lerDados();
    const usuario = req.params.usuario;

    res.json({
        movimentos: dados.gastos.filter(g => g.usuario === usuario),
        lembretes: dados.lembretes.filter(l => l.usuario === usuario)
    });
});

// SERVIDOR
app.listen(PORT, () => {
    console.log(`🌐 Painel rodando em http://localhost:${PORT}`);
});
