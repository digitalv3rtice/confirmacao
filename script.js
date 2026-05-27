/*

   CONFIGURAÇÃO - Cole as URLs do Supabase aqui:
*/
const SUPABASE_URL = "https://tilbjlzybyfuylyyonbh.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRpbGJqbHp5YnlmdXlseXlvbmJoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk5MDgxMDYsImV4cCI6MjA5NTQ4NDEwNn0.8JFBScIJcRV8iKvI4OqGz0xtsSgTlzqNIo_AfckHGSw\n";



// --- FUNÇÕES DO SUPABASE ---

async function saveConfirmation(data) {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/confirmados`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`
        },
        body: JSON.stringify({
            nome: data.mainName,
            quantidade: data.qtyGuests,
            acompanhantes: data.guestNames,
            created_at: new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })
        })
    });
    return response.ok;
}

async function getConfirmations() {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/confirmados?order=created_at.desc`, {
        headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`
        }
    });
    const data = await response.json();
    return data;
}

async function downloadCSV() {
    const confirmations = await getConfirmations();
    if (confirmations.length === 0) {
        alert('Nada para baixar.');
        return;
    }

    // Cabeçalho em português
    let csvContent = "data:text/csv;charset=utf-8,Data,Nome,Quantidade,Acompanhantes\n";

    confirmations.forEach(conf => {
        // Formata a data para brasileiro
        let dateObj = new Date(conf.created_at);
        let date = dateObj.toLocaleDateString('pt-BR');
        let companions = conf.acompanhantes ? conf.acompanhantes.join(' / ') : '';
        let row = `${date},"${conf.nome}",${conf.quantidade},"${companions}"`;
        csvContent += row + "\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "confirmacoes.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

async function clearData() {
    if (!confirm('Tem certeza que deseja apagar todos os dados?')) return;

    const confirmations = await getConfirmations();

    for (const conf of confirmations) {
        await fetch(`${SUPABASE_URL}/rest/v1/confirmados?id=eq.${conf.id}`, {
            method: 'DELETE',
            headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`
            }
        });
    }

    alert('Dados apagados!');
    window.location.reload();
}


// --- PÁGINA DE CONFIRMAÇÃO ---

function generateGuestFields() {
    const qtyInput = document.getElementById('qty');
    const container = document.getElementById('guestsContainer');

    if (!qtyInput || !container) return;

    const qty = parseInt(qtyInput.value) || 0;
    container.innerHTML = '';

    for (let i = 1; i <= qty; i++) {
        const input = document.createElement('input');
        input.type = 'text';
        input.placeholder = 'Nome do Acompanhante ' + i;
        input.className = 'guest-name';
        input.required = true;
        container.appendChild(input);
    }
}

const confirmationForm = document.getElementById('confirmationForm');

if (confirmationForm) {
    confirmationForm.addEventListener('submit', async function(e) {
        e.preventDefault();

        const mainName = document.getElementById('mainName').value;
        const qtyInput = document.getElementById('qty').value;
        const guestInputs = document.querySelectorAll('.guest-name');
        let guestNames = [];

        guestInputs.forEach(input => {
            if (input.value.trim() !== "") {
                guestNames.push(input.value);
            }
        });

        const confirmationData = {
            mainName: mainName,
            qtyGuests: parseInt(qtyInput) || 0,
            guestNames: guestNames
        };

        const sucesso = await saveConfirmation(confirmationData);

        if (sucesso) {
            alert('Confirmação enviada com sucesso! Obrigado.');
            confirmationForm.reset();
            document.getElementById('guestsContainer').innerHTML = '';
        } else {
            alert('Erro ao enviar. Tente novamente.');
        }
    });
}


// --- PÁGINA ADMIN ---

const adminLoginForm = document.getElementById('adminLoginForm');

if (adminLoginForm) {

    if (localStorage.getItem('adminLogado') === 'true') {
        document.getElementById('loginScreen').style.display = 'none';
        document.getElementById('adminScreen').style.display = 'block';
        carregarLista();
    }

    adminLoginForm.addEventListener('submit', function(e) {
        e.preventDefault();

        const passwordInput = document.getElementById('adminPassword').value;
        const ADMIN_PASSWORD = "123456"; // Mude aqui sua senha

        if (passwordInput === ADMIN_PASSWORD) {
            localStorage.setItem('adminLogado', 'true');
            document.getElementById('loginScreen').style.display = 'none';
            document.getElementById('adminScreen').style.display = 'block';
            carregarLista();
        } else {
            alert('Senha incorreta!');
            document.getElementById('adminPassword').value = '';
        }
    });

    async function carregarLista() {
        const listContainer = document.getElementById('listContainer');
        const confirmations = await getConfirmations();

        if (confirmations.length === 0) {
            listContainer.innerHTML = '<p style="padding:20px;">Nenhuma confirmação ainda.</p>';
            return;
        }

        let totalGente = 0;
        confirmations.forEach(c => {
            totalGente += (1 + (c.quantidade || 0));
        });

        let html = `
            <div style="background:#f0f0f0; padding:15px; border-radius:5px; margin-bottom:20px; text-align:left;">
                <strong>Total de Confirmados:</strong> ${confirmations.length}<br>
                <strong>Total de Pessoas:</strong> ${totalGente}
            </div>
            <table style="width:100%; border-collapse:collapse;">
                <thead>
                    <tr style="background:#4CAF50; color:white;">
                        <th style="padding:10px;">#</th>
                        <th style="padding:10px;">Data</th>
                        <th style="padding:10px;">Convidado</th>
                        <th style="padding:10px;">+ Qtd</th>
                        <th style="padding:10px;">Acompanhantes</th>
                    </tr>
                </thead>
                <tbody>
        `;

        confirmations.forEach((conf, index) => {
            // Data no formato brasileiro
            let dateObj = new Date(conf.created_at);
            let date = dateObj.toLocaleDateString('pt-BR');
            let companions = conf.acompanhantes && conf.acompanhantes.length > 0
                ? conf.acompanhantes.join(', ')
                : '-';

            html += `<tr style="border-bottom:1px solid #ddd;">
                <td style="padding:10px;">${index + 1}</td>
                <td style="padding:10px;">${date}</td>
                <td style="padding:10px;"><strong>${conf.nome}</strong></td>
                <td style="padding:10px;">${conf.quantidade}</td>
                <td style="padding:10px;">${companions}</td>
            </tr>`;
        });

        html += '</tbody></table>';
        listContainer.innerHTML = html;
    }
}