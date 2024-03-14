document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('cadastroForm');

    form.addEventListener('submit', (event) => {
        event.preventDefault(); // Evita que o formulário seja enviado antes do tratamento

        const formData = new FormData(form);

        fetch('/cadastrar-usuario', {
            method: 'POST',
            body: formData
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Erro ao cadastrar usuário');
            }
            return response.text();
        })
        .then(data => {
            alert(data); // Exibe a mensagem de retorno do servidor
            window.location.href = '/listar-usuarios'; // Redireciona para a página de listar usuários após o cadastro
        })
        .catch(error => {
            console.error('Erro:', error);
            alert('Erro ao cadastrar usuário. Por favor, tente novamente mais tarde.');
        });
    });
});
