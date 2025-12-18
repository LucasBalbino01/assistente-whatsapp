const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static('web/public'));

// ================= FUNÇÕES =================

function lerUsuarios() {
    if (!fs.existsSync('users.json')) {
        fs.writeFileSync(
            'users.json',
            JSON.stringify({ usuarios: [] }, null, 2)
        );
    }

    const dados = JSON.parse(fs.readFileSync('users.json', 'utf8'));
    if (!Array.isArray(dados.usuarios)) dados.usuarios = [];
    return dados;
}

function salvarUsuarios(dados) {
    fs.writeFileSync('users.json', JSON.stringify(dados, null, 2));
}

function lerDados() {
    if (!fs.existsSync('data.json')) {
        fs.writeFileSync(
            'data.json',
            JSON.stringify(
                { gastos: [], lembretes: [], cofrinhos: [] },
                null,
                2
            )
        );
    }

    let dados;
    try {
        dados = JSON.parse(fs.readFileSync('data.json', 'utf8'));
    } catch {
        dados = { gastos: [], lembretes: [], cofrinhos: [] };
    }

    if (!Array.isArray(dados.gastos)) dados.gastos = [];
    if (!Array.isArray(dados.lembretes)) dados.lembretes = [];
    if (!Array.isArray(dados.cofrinhos)) dados.cofrinhos = [];

    return dados;
}

function salvarDados(dados) {
    fs.writeFileSync('data.json', JSON.stringify(dados, null, 2));
}

// ================= ROTAS SITE =================

// Página inicial (venda)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'web/views/index.html'));
});

// Login
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'web/views/login.html'));
});

app.post('/login', (req, res) => {
    const { telefone, senha } = req.body;
    const dados = lerUsuarios();

    const usuario = dados.usuarios.find(
        u => u.telefone === telefone && u.senha === senha
    );

    if (!usuario) return res.send('Usuário ou senha inválidos');

    res.redirect('/dashboard/' + telefone);
});

// Cadastro
app.post('/registrar', (req, res) => {
    const { telefone, senha } = req.body;
    const dados = lerUsuarios();

    if (!telefone || !senha)
        return res.send('Preencha todos os campos');

    if (dados.usuarios.some(u => u.telefone === telefone))
        return res.send('Usuário já existe');

    dados.usuarios.push({ telefone, senha });
    salvarUsuarios(dados);

    res.redirect('/dashboard/' + telefone);
});

// Dashboard
app.get('/dashboard/:usuario', (req, res) => {
    res.sendFile(path.join(__dirname, 'web/views/dashboard.html'));
});

// ================= API GASTOS =================

app.get('/api/dados/:usuario', (req, res) => {
    const dados = lerDados();
    res.json({
        movimentos: dados.gastos.filter(
            g => g.usuario === req.params.usuario
        )
    });
});

app.post('/api/gasto/:usuario', (req, res) => {
    const dados = lerDados();

    dados.gastos.push({
        id: Date.now(),
        usuario: req.params.usuario,
        descricao: req.body.descricao,
        categoria: req.body.categoria,
        valor: Number(req.body.valor),
        data: new Date().toLocaleDateString('pt-BR')
    });

    salvarDados(dados);
    res.json({ ok: true });
});

app.put('/api/gasto/:id', (req, res) => {
    const dados = lerDados();
    const gasto = dados.gastos.find(
        g => g.id === Number(req.params.id)
    );

    if (!gasto) return res.status(404).json({ erro: 'Não encontrado' });

    gasto.descricao = req.body.descricao;
    gasto.categoria = req.body.categoria;
    gasto.valor = Number(req.body.valor);

    salvarDados(dados);
    res.json({ ok: true });
});

app.delete('/api/gasto/:id', (req, res) => {
    const dados = lerDados();
    dados.gastos = dados.gastos.filter(
        g => g.id !== Number(req.params.id)
    );
    salvarDados(dados);
    res.json({ ok: true });
});

// ================= API AGENDA =================

app.get('/api/lembretes/:usuario', (req, res) => {
    const dados = lerDados();
    res.json(
        dados.lembretes.filter(
            l => l.usuario === req.params.usuario
        )
    );
});

app.post('/api/lembrete/:usuario', (req, res) => {
    const dados = lerDados();

    dados.lembretes.push({
        id: Date.now(),
        usuario: req.params.usuario,
        texto: req.body.texto,
        data: req.body.data,
        hora: req.body.hora,
        avisado: false
    });

    salvarDados(dados);
    res.json({ ok: true });
});

app.delete('/api/lembrete/:id', (req, res) => {
    const dados = lerDados();
    dados.lembretes = dados.lembretes.filter(
        l => l.id !== Number(req.params.id)
    );
    salvarDados(dados);
    res.json({ ok: true });
});

// ================= API COFRINHO =================

app.get('/api/cofrinho/:usuario', (req, res) => {
    const dados = lerDados();
    res.json(
        dados.cofrinhos.filter(
            c => c.usuario === req.params.usuario
        )
    );
});

app.post('/api/cofrinho/:usuario', (req, res) => {
    const dados = lerDados();
    const { nome, total } = req.body;

    if (!nome || !total)
        return res.status(400).json({ erro: 'Dados inválidos' });

    dados.cofrinhos.push({
        id: Date.now(),
        usuario: req.params.usuario,
        nome,
        total: Number(total),
        guardado: 0
    });

    salvarDados(dados);
    res.json({ ok: true });
});

app.put('/api/cofrinho/:id', (req, res) => {
    const dados = lerDados();
    const cofrinho = dados.cofrinhos.find(
        c => c.id === Number(req.params.id)
    );

    if (!cofrinho)
        return res.status(404).json({ erro: 'Não encontrado' });

    cofrinho.guardado += Number(req.body.valor);
    salvarDados(dados);
    res.json({ ok: true });
});

app.delete('/api/cofrinho/:id', (req, res) => {
    const dados = lerDados();
    dados.cofrinhos = dados.cofrinhos.filter(
        c => c.id !== Number(req.params.id)
    );
    salvarDados(dados);
    res.json({ ok: true });
});

// ================= SERVIDOR =================

app.listen(PORT, () => {
    console.log(`🌐 Painel rodando em http://localhost:${PORT}`);
});
