/*
   CONFIGURAÇÃO
   Mude a senha abaixo para a que você quiser usar:
*/
const ADMIN_PASSWORD = "minhasenha123";


// --- VERIFICAR QUAL PÁGINA ESTÁ ---

const confirmationForm = document.getElementById('confirmationForm');
const adminLoginForm = document.getElementById('adminLoginForm');


// --- PÁGINA DE CONFIRMAÇÃO (index.html) ---

if (confirmationForm) {

    confirmationForm.addEventListener('submit', function(e) {
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
            id: Date.now(),
            date: new Date().toLocaleDateString('pt-BR'),
            mainName: mainName,
            qtyGuests: parseInt(qtyInput) || 0,
            guestNames: guestNames
        };

        // Salvar no LocalStorage
        let confirmations = JSON.parse(localStorage.getItem('confirmations')) || [];
        confirmations.push(confirmationData);
        localStorage.setItem('confirmations', JSON.stringify(confirmations));

        alert('Confirmação enviada com sucesso! Obrigado.');

        // Limpar formulário
        confirmationForm.reset();
        document.getElementById('guestsContainer').innerHTML = '';
    });
}


// --- PÁGINA ADMIN (admin.html) ---

if (adminLoginForm) {

    // Verificar se já está logado
    if (localStorage.getItem('adminLogado') === 'true') {
        document.getElementById('loginScreen').style.display = 'none';
        document.getElementById('adminScreen').style.display = 'block';
        carregarLista();
    }

    // Fazer login
    adminLoginForm.addEventListener('submit', function(e) {
        e.preventDefault();

        const passwordInput = document.getElementById('adminPassword').value;

        if (passwordInput === ADMIN_PASSWORD) {
            localStorage.setItem('adminLogado', 'true');
            document.getElementById('loginScreen').style.display = 'none';
            document.getElementById('adminScreen').style.display = 'block';
            carregarLista();
        } else {
            alert('Senha incorreta! Tente novamente.');
            document.getElementById('adminPassword').value = '';
        }
    });

    function carregarLista() {
        const listContainer = document.getElementById('listContainer');
        const confirmations = JSON.parse(localStorage.getItem('confirmations')) || [];

        if (confirmations.length === 0) {
            listContainer.innerHTML = '<p style="padding:20px;">Nenhuma confirmação encontrada.</p>';
            return;
        }

        // Calcular total de pessoas - CORRIGIDO
        let totalGente = 0;
        confirmations.forEach(c => {
            totalGente += (1 + (parseInt(c.qtyGuests) || 0));
        });

        let html = `
            <div style="background:#f0f0f0; padding:15px; border-radius:5px; margin-bottom:20px; text-align:left;">
                <strong>Total de Pessoas:</strong> ${totalGente}
            </div>
            <table style="width:100%; border-collapse:collapse;">
                <thead>
                    <tr style="background:#4CAF50; color:white;">
                        <th style="padding:10px; text-align:left;">#</th>
                        <th style="padding:10px; text-align:left;">Data</th>
                        <th style="padding:10px; text-align:left;">Convidado</th>
                        <th style="padding:10px; text-align:left;">+ Qtd</th>
                        <th style="padding:10px; text-align:left;">Acompanhantes</th>
                    </tr>
                </thead>
                <tbody>
        `;

        confirmations.forEach((conf, index) => {
            let companions = conf.guestNames.length > 0 ? conf.guestNames.join(', ') : '-';

            html += `<tr style="border-bottom:1px solid #ddd;">
                <td style="padding:10px;">${index + 1}</td>
                <td style="padding:10px;">${conf.date}</td>
                <td style="padding:10px;"><strong>${conf.mainName}</strong></td>
                <td style="padding:10px;">${conf.qtyGuests}</td>
                <td style="padding:10px;">${companions}</td>
            </tr>`;
        });

        html += '</tbody></table>';
        listContainer.innerHTML = html;
    }

    // Função para baixar Planilha
    window.downloadCSV = function() {
        const confirmations = JSON.parse(localStorage.getItem('confirmations')) || [];
        if (confirmations.length === 0) {
            alert('Nada para baixar.');
            return;
        }

        let csvContent = "data:text/csv;charset=utf-8,Data,Convidado,Quantidade,Acompanhantes\n";

        confirmations.forEach(conf => {
            let row = `${conf.date},"${conf.mainName}",${conf.qtyGuests},"${conf.guestNames.join(' / ')}"`;
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

    // Função para limpar dados
    window.clearData = function() {
        if (confirm('Tem certeza que deseja APAGAR todos os dados? Esta ação não pode ser desfeita.')) {
            localStorage.removeItem('confirmations');
            localStorage.removeItem('adminLogado');
            alert('Dados apagados!');
            window.location.reload();
        }
    }
}


// --- GERAR CAMPOS DE ACOMPANHANTES ---

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