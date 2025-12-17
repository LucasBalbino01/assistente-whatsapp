const { Client } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const fs = require('fs');
const cron = require('node-cron');

const client = new Client({
    puppeteer: { headless: true }
});

// ---------- CONEXÃO ----------
client.on('qr', qr => {
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log('🤖 Bot conectado!');
    iniciarAgendador();
});

// ---------- BANCO ----------
function lerDados() {
    if (!fs.existsSync('data.json')) {
        fs.writeFileSync(
            'data.json',
            JSON.stringify({ usuarios: {}, lembretes: [] }, null, 2)
        );
    }
    return JSON.parse(fs.readFileSync('data.json', 'utf8'));
}

function salvarDados(dados) {
    fs.writeFileSync('data.json', JSON.stringify(dados, null, 2));
}

// ---------- INTERPRETAÇÃO FINANCEIRA ----------
function interpretarFinanceiro(texto) {
    const valorMatch = texto.match(/\d+([.,]\d+)?/);
    if (!valorMatch) return null;

    const valor = Number(valorMatch[0].replace(',', '.'));

    // GANHO
    if (texto.match(/recebi|ganhei|salário|salario/)) {
        return {
            tipo: 'ganho',
            valor,
            categoria: null,
            descricao: texto
        };
    }

    // DESPESA
    if (texto.match(/gastei|paguei|comprei/)) {
        let categoria = 'nao essencial';
        if (texto.includes('essencial')) categoria = 'essencial';

        return {
            tipo: 'despesa',
            valor,
            categoria,
            descricao: texto
        };
    }

    return null;
}

// ---------- LEMBRETE ----------
function interpretarLembrete(texto) {
    if (!texto.match(/amanhã|hoje|\d{1,2}:\d{2}/)) return null;

    let data = new Date();

    if (texto.includes('amanhã')) {
        data.setDate(data.getDate() + 1);
    }

    const horaMatch = texto.match(/(\d{1,2}):(\d{2})/);
    if (horaMatch) {
        data.setHours(horaMatch[1]);
        data.setMinutes(horaMatch[2]);
    } else {
        data.setHours(9);
        data.setMinutes(0);
    }

    return { texto, dataHora: data };
}

// ---------- AGENDADOR ----------
function iniciarAgendador() {
    cron.schedule('* * * * *', () => {
        const dados = lerDados();
        const agora = new Date();

        dados.lembretes.forEach(l => {
            if (!l.enviado && new Date(l.dataHora) <= agora) {
                client.sendMessage(l.usuario, `⏰ Lembrete: ${l.texto}`);
                l.enviado = true;
                salvarDados(dados);
            }
        });
    });
}

// ---------- MENSAGENS ----------
client.on('message', msg => {
    const texto = msg.body.toLowerCase();
    const usuario = msg.from;
    const dados = lerDados();

    // Criar usuário se não existir
    if (!dados.usuarios[usuario]) {
        dados.usuarios[usuario] = { movimentos: [] };
    }

    // FINANCEIRO
    const financeiro = interpretarFinanceiro(texto);
    if (financeiro) {
        dados.usuarios[usuario].movimentos.push({
            ...financeiro,
            data: new Date().toLocaleString()
        });
        salvarDados(dados);

        msg.reply(
            financeiro.tipo === 'ganho'
                ? `💰 Ganho registrado: R$ ${financeiro.valor}`
                : `💸 Despesa registrada: R$ ${financeiro.valor} (${financeiro.categoria})`
        );
        return;
    }

    // LEMBRETE
    const lembrete = interpretarLembrete(texto);
    if (lembrete) {
        dados.lembretes.push({
            texto: lembrete.texto,
            dataHora: lembrete.dataHora,
            usuario,
            enviado: false
        });
        salvarDados(dados);
        msg.reply('⏰ Lembrete salvo! Vou te avisar 👍');
        return;
    }

    msg.reply('🤖 Não entendi ainda, mas estou aprendendo 😊');
});

client.initialize();