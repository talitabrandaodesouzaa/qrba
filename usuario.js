const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const UsuarioSchema = new mongoose.Schema({
    nome: String,
    cpf: String,
    email: { type: String, unique: true },
    senha: String,
    grupo: String,
    ativo: { type: Boolean, default: true }
});

module.exports = mongoose.model('Usuario', UsuarioSchema);
