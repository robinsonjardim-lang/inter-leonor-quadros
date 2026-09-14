const API_URL = "https://script.google.com/macros/s/AKfycbyHkbq7BGAGnaTewctDAGDkD5OZZykpXt-v-a22a-vUP63EkVcJm5FLfizNffxPwUNdIg/exec";

// Elementos do DOM
const formCadastro = document.getElementById('form-cadastro');
const tabelaAlunos = document.getElementById('tabela-alunos');
const cardsMvpContainer = document.getElementById('cards-mvp');

let atletas = [];

// Carrega os dados assim que a página abre
document.addEventListener('DOMContentLoaded', carregarDadosPlanilha);

// 1. Função para carregar dados da planilha
async function carregarDadosPlanilha() {
    try {
        const response = await fetch(API_URL);
        atletas = await response.json();
        renderizarTabela();
        renderizarMVP();
    } catch (error) {
        console.error("Erro ao carregar dados:", error);
    }
}

// 2. Renderiza a tabela de inscritos
function renderizarTabela() {
    if (!tabelaAlunos) return;
    tabelaAlunos.innerHTML = '';
    
    if (atletas.length === 0) {
        tabelaAlunos.innerHTML = `<tr><td colspan="4" style="text-align:center;">Nenhum atleta cadastrado.</td></tr>`;
        return;
    }

    atletas.forEach((atleta) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${atleta.nome || '-'}</td>
            <td>${atleta.turma || '-'}</td>
            <td>${atleta.modalidade || '-'}</td>
            <td>Registrado</td>
        `;
        tabelaAlunos.appendChild(tr);
    });
}

// 3. Renderiza os cards do MVP
function renderizarMVP() {
    if (!cardsMvpContainer) return;
    cardsMvpContainer.innerHTML = '';

    if (atletas.length === 0) {
        cardsMvpContainer.innerHTML = `<p class="section-subtitle">Nenhum atleta cadastrado para votação.</p>`;
        return;
    }

    // Verifica se o usuário já votou neste dispositivo/navegador
    const jaVotou = localStorage.getItem('interclasse_ja_votou');

    atletas.forEach((atleta) => {
        const card = document.createElement('div');
        card.classList.add('mvp-card');

        // Se já votou, desabilita o botão do card
        const botaoHTML = jaVotou 
            ? `<button disabled class="btn-votar-mvp btn-votado" style="opacity: 0.6; cursor: not-allowed; background-color: #64748b !important;">
                ✓ Voto Registrado
               </button>`
            : `<button onclick="votarMVP('${atleta.id}')" class="btn-votar-mvp">
                ⭐ Votar no MVP
               </button>`;

        card.innerHTML = `
            <div class="card-content">
                <h3>${atleta.nome}</h3>
                <p><strong>Turma:</strong> ${atleta.turma}</p>
                <p><strong>Modalidade:</strong> ${atleta.modalidade}</p>
                ${botaoHTML}
                <span id="votos-${atleta.id}" class="votos-mvp">
                    Votos: ${atleta.votos || 0}
                </span>
            </div>
        `;

        cardsMvpContainer.appendChild(card);
    });
}

// 4. Envio do Formulário de Cadastro
if (formCadastro) {
    formCadastro.addEventListener('submit', async function(e) {
        e.preventDefault();

        const btnSubmit = formCadastro.querySelector('.btn-submit');
        const nome = document.getElementById('nome').value.trim();
        const turma = document.getElementById('turma').value.trim();
        const modalidade = document.getElementById('modalidade').value;

        if (!nome || !turma) {
            alert("Preencha todos os campos!");
            return;
        }

        btnSubmit.disabled = true;
        btnSubmit.textContent = "Cadastrando...";

        const payload = new URLSearchParams();
        payload.append('action', 'cadastrar');
        payload.append('nome', nome);
        payload.append('turma', turma);
        payload.append('modalidade', modalidade);

        try {
            await fetch(API_URL, {
                method: 'POST',
                mode: 'no-cors',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: payload
            });

            alert("Cadastro enviado com sucesso!");
            formCadastro.reset();
            
            setTimeout(carregarDadosPlanilha, 1000);

        } catch (error) {
            console.error("Erro ao enviar cadastro:", error);
            alert("Erro ao cadastrar. Tente novamente.");
        } finally {
            btnSubmit.disabled = false;
            btnSubmit.textContent = "Finalizar Inscrição";
        }
    });
}

// 5. Votação MVP com trava de 1 voto por dispositivo/navegador
window.votarMVP = async function(id) {
    // Trava de segurança no JS
    if (localStorage.getItem('interclasse_ja_votou')) {
        alert("Você já computou seu voto no MVP!");
        return;
    }

    const payload = new URLSearchParams();
    payload.append('action', 'votar');
    payload.append('id', id);

    try {
        await fetch(API_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: payload
        });

        // Salva a confirmação do voto no navegador
        localStorage.setItem('interclasse_ja_votou', 'true');

        alert("Seu voto foi registrado com sucesso!");
        
        // Recarrega a lista para desabilitar os botões de votação
        setTimeout(carregarDadosPlanilha, 1000);
    } catch (error) {
        console.error("Erro ao votar:", error);
        alert("Erro ao registrar seu voto. Tente novamente.");
    }
};
