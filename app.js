const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const path = require('path');

const app = express();

// Configuração do body-parser e da pasta de arquivos estáticos
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Configuração da sessão
app.use(session({ secret: 'sua_chave_secreta', resave: true, saveUninitialized: true }));

// Conexão com o banco de dados MongoDB
mongoose.connect('mongodb://localhost:27017/backoffice_db', { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => {
        console.log('Conexão com o MongoDB estabelecida com sucesso.');
    })
    .catch((error) => {
        console.error('Erro ao conectar com o MongoDB:', error);
        process.exit(1); // Encerra o aplicativo em caso de falha na conexão com o banco de dados
    });

// Suprimindo o aviso de depreciação sobre strictQuery
mongoose.set('strictQuery', false);

const db = mongoose.connection;

// Manipuladores de erro para o banco de dados MongoDB
db.on('error', (error) => {
    console.error('Erro de conexão com o MongoDB:', error);
});
db.once('open', () => {
    console.log('Conexão estabelecida com o MongoDB.');
});

// Definição do esquema de usuário
const UsuarioSchema = new mongoose.Schema({
    nome: String,
    cpf: String,
    email: { type: String, unique: true },
    senha: String,
    grupo: String,
    ativo: { type: Boolean, default: true }
});

// Modelo de usuário
const UsuarioModel = mongoose.model('Usuario', UsuarioSchema);

// Função de verificação de autenticação
const verificarAutenticacao = (req, res, next) => {
    if (req.session.usuario) {
        next();
    } else {
        res.redirect('/login.html');
    }
};

// Rota para o formulário de login
app.post('/login', async (req, res) => {
    const { email, senha } = req.body;

    try {
        const usuario = await UsuarioModel.findOne({ email: email }).exec();
        if (!usuario || !bcrypt.compareSync(senha, usuario.senha)) {
            res.status(401).send('Email ou senha incorretos.');
        } else {
            req.session.usuario = usuario;
            if (usuario.grupo === 'admin') {
                res.redirect('/admin-dashboard.html');
            } else if (usuario.grupo === 'estoquista') {
                res.redirect('/estoquista-dashboard.html');
            } else {
                res.status(403).send('Acesso negado.');
            }
        }
    } catch (error) {
        console.error('Erro ao buscar usuário:', error);
        res.status(500).send('Erro interno do servidor.');
    }
});

// Rota para o painel de administração
app.get('/admin-dashboard.html', verificarAutenticacao, (req, res) => {
    const usuario = req.session.usuario;
    if (usuario.grupo === 'admin') {
        res.sendFile(path.join(__dirname, '/views/admin-dashboard.html'));
    } else {
        res.status(403).send('Acesso negado.');
    }
});

// Rota para o painel do estoquista
app.get('/estoquista-dashboard.html', verificarAutenticacao, (req, res) => {
    const usuario = req.session.usuario;
    if (usuario.grupo === 'estoquista') {
        res.sendFile(path.join(__dirname, '/views/estoquista-dashboard.html'));
    } else {
        res.status(403).send('Acesso negado.');
    }
});

// Rota para a página inicial
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '/views/index.html'));
});

// Rota para o formulário de cadastro de usuário
app.get('/cadastrar-usuario.html', verificarAutenticacao, (req, res) => {
    res.sendFile(path.join(__dirname, '/views/cadastrar-usuario.html'));
});

// Rota para o formulário de alteração de usuário
app.get('/alterar-usuario/:id.html', verificarAutenticacao, (req, res) => {
    const userId = req.params.id;
    // Lógica para buscar o usuário pelo ID e enviar os dados para o formulário de alteração
});

// Rota para inativar um usuário
app.post('/inativar-usuario/:id', verificarAutenticacao, (req, res) => {
    const userId = req.params.id;
    // Lógica para alterar o status do usuário para inativo no banco de dados
});

// Rota para reativar um usuário
app.post('/reativar-usuario/:id', verificarAutenticacao, (req, res) => {
    const userId = req.params.id;
    // Lógica para alterar o status do usuário para ativo no banco de dados
});

// Rota para listar usuários
app.get('/lista-usuarios.html', verificarAutenticacao, (req, res) => {
    UsuarioModel.find({}, (err, usuarios) => {
        if (err) {
            console.error('Erro ao buscar usuários:', err);
            res.status(500).send('Erro interno do servidor.');
        } else {
            res.sendFile(path.join(__dirname, '/views/listar-usuarios.html'));
        }
    });
});

// Rota para cadastrar um usuário
app.post('/cadastrar-usuario', verificarAutenticacao, async (req, res) => {
    const { nome, cpf, email, senha, confirmarSenha, grupo } = req.body;

    // Verificar se as senhas coincidem
    if (senha !== confirmarSenha) {
        return res.status(400).send('As senhas não coincidem.');
    }

    try {
        const usuarioExistente = await UsuarioModel.findOne({ email: email }).exec();
        if (usuarioExistente) {
            return res.status(400).send('Este email já está cadastrado.');
        }

        // Criptografar a senha
        const hashedPassword = bcrypt.hashSync(senha, 10);

        // Criar um novo usuário
        const novoUsuario = new UsuarioModel({
            nome: nome,
            cpf: cpf,
            email: email,
            senha: hashedPassword,
            grupo: grupo
        });

        // Salvar o novo usuário no banco de dados
        await novoUsuario.save();
        res.status(201).send('Usuário cadastrado com sucesso.');
    } catch (error) {
        console.error('Erro ao cadastrar usuário:', error);
        res.status(500).send('Erro interno do servidor.');
    }
});

// Inicialização do servidor na porta 3000
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor iniciado na porta ${PORT}`);
});
