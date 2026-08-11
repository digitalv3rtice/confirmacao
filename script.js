/*
   CONFIGURAÇÃO DO SUPABASE
*/
const SUPABASE_URL = "https://enluhezbeitujlgmikxd.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVubHVoZXpiZWl0dWpsZ21pa3hkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY0MDcwOTYsImV4cCI6MjEwMTk4MzA5Nn0.pljANF4XcutK4z0-LaIoY_9YV_fhDX2dFgv7GISlkiE";

const SENHA_ADMIN = "123456";


// --- FUNÇÕES DO SUPABASE ---

function safeJsonParse(value) {
    if (!value) return [];
    try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
        return [];
    }
}

async function saveConfirmation(data) {
    const nome = String(data.mainName || '').trim();
    const quantidade = Number(data.qtyGuests) || 0;
    const acompanhantes = Array.isArray(data.guestNames) ? data.guestNames : [];

    if (!nome) {
        throw new Error('O nome é obrigatório.');
    }

    const response = await fetch(`${SUPABASE_URL}/rest/v1/confirmados`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`,
            'Prefer': 'return=representation'
        },
        body: JSON.stringify({
            nome,
            quantidade,
            acompanhantes: JSON.stringify(acompanhantes),
            created_at: new Date().toISOString()
        })
    });

    const bodyText = await response.text();
    let body = null;

    try {
        body = bodyText ? JSON.parse(bodyText) : null;
    } catch (error) {
        body = null;
    }

    if (!response.ok) {
        const message = body && body.message ? body.message : `Erro do Supabase (${response.status})`;
        const finalMessage = message.toLowerCase().includes('row level security') || message.toLowerCase().includes('policy') || message.toLowerCase().includes('permission')
            ? 'A inserção foi bloqueada pelo Supabase. Verifique a política RLS da tabela confirmados ou crie uma política de INSERT permitida para o público.'
            : message;
        throw new Error(finalMessage);
    }

    return true;
}

async function getConfirmations() {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/confirmados?order=created_at.desc`, {
        headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`
        }
    });
    return await response.json();
}

async function downloadCSV() {
    const confirmations = await getConfirmations();
    if (!confirmations || confirmations.length === 0) {
        alert('Nada para baixar.');
        return;
    }

    let csvContent = "data:text/csv;charset=utf-8,Data,Nome,Quantidade,Acompanhantes\n";

    confirmations.forEach(conf => {
        let date = new Date(conf.created_at).toLocaleDateString('pt-BR');
        const companionsList = safeJsonParse(conf.acompanhantes);
        let companions = companionsList.length > 0 ? companionsList.join(' / ') : '';
        let row = `${date},"${conf.nome}",${conf.quantidade},"${companions}"`;
        csvContent += row + "\n";
    });

    const link = document.createElement("a");
    link.href = encodeURI(csvContent);
    link.download = "confirmacoes.csv";
    link.click();
}

async function clearData() {
    if (!confirm('Apagar todos os dados?')) return;
    const confirmations = await getConfirmations();
    for (const conf of confirmations) {
        await fetch(`${SUPABASE_URL}/rest/v1/confirmados?id=eq.${conf.id}`, {
            method: 'DELETE',
            headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
        });
    }
    alert('Dados apagados!');
    location.reload();
}


// --- PÁGINA DE CONFIRMAÇÃO ---

function generateGuestFields() {
    const qtyInput = document.getElementById('qty');
    const container = document.getElementById('guestsContainer');
    if (!qtyInput || !container) return;

    container.innerHTML = '';
    for (let i = 1; i <= (parseInt(qtyInput.value) || 0); i++) {
        const input = document.createElement('input');
        input.type = 'text';
        input.placeholder = 'Nome do Acompanhante ' + i;
        input.className = 'guest-name';
        input.required = true;
        container.appendChild(input);
    }
}

// --- PÁGINA ADMIN ---

function loginAdmin() {
    const passwordInput = document.getElementById('adminPassword').value;

    if (passwordInput === SENHA_ADMIN) {
        localStorage.setItem('adminLogado', 'true');
        document.getElementById('loginScreen').style.display = 'none';
        document.getElementById('adminScreen').style.display = 'block';
        carregarLista();
    } else {
        alert('Senha incorreta!');
    }
}

async function carregarLista() {
    const listContainer = document.getElementById('listContainer');
    const confirmations = await getConfirmations();

    if (!confirmations || confirmations.length === 0) {
        listContainer.innerHTML = '<p>Nenhuma confirmação ainda.</p>';
        return;
    }

    let totalGente = 0;
    confirmations.forEach(c => totalGente += (1 + (c.quantidade || 0)));

    let html = `
        <div style="background:#f0f0f0; padding:15px; border-radius:5px; margin-bottom:20px;">
            <strong>Total:</strong> ${confirmations.length} | <strong>Pessoas:</strong> ${totalGente}
        </div>
        <table style="width:100%; border-collapse:collapse;">
            <tr style="background:#4CAF50; color:white;">
                <th>#</th><th>Data</th><th>Nome</th><th>+Qtd</th><th>Acompanhantes</th>
            </tr>
    `;

    confirmations.forEach((conf, index) => {
        let date = new Date(conf.created_at).toLocaleDateString('pt-BR');
        let companionsList = safeJsonParse(conf.acompanhantes);
        let companions = companionsList.length > 0 ? companionsList.join(', ') : '-';

        html += `<tr style="border-bottom:1px solid #ddd;">
            <td>${index + 1}</td>
            <td>${date}</td>
            <td><strong>${conf.nome}</strong></td>
            <td>${conf.quantidade}</td>
            <td>${companions}</td>
        </tr>`;
    });

    html += '</table>';
    listContainer.innerHTML = html;
}

// --- INICIALIZAÇÃO ---

document.addEventListener('DOMContentLoaded', function() {
    const confirmationForm = document.getElementById('confirmationForm');
    const adminLoginForm = document.getElementById('adminLoginForm');

    if (confirmationForm) {
        confirmationForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const mainName = document.getElementById('mainName').value;
            const qtyInput = document.getElementById('qty').value;
            let guestNames = [];
            document.querySelectorAll('.guest-name').forEach(input => {
                if (input.value.trim()) guestNames.push(input.value.trim());
            });

            try {
                const sucesso = await saveConfirmation({
                    mainName,
                    qtyGuests: parseInt(qtyInput) || 0,
                    guestNames
                });

                if (sucesso) {
                    alert('Confirmado com sucesso!');
                    confirmationForm.reset();
                    document.getElementById('guestsContainer').innerHTML = '';
                }
            } catch (error) {
                console.error(error);
                alert(error.message || 'Erro ao enviar.');
            }
        });
    }

    if (adminLoginForm) {
        if (localStorage.getItem('adminLogado') === 'true') {
            document.getElementById('loginScreen').style.display = 'none';
            document.getElementById('adminScreen').style.display = 'block';
            carregarLista();
        }

        adminLoginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            loginAdmin();
        });
    }
});