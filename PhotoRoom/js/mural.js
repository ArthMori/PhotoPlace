const api_url = 'https://api-mural.onrender.com/Photos';
const mural = document.getElementById('photo-container');

async function carregarFotos() {
    try {
        mural.innerHTML = '<p class="loading">Carregando fotos...</p>';

        const response = await fetch(api_url);
        if (!response.ok) {
            throw new Error('Erro ao carregar as fotos');
        }

        const fotos = await response.json();
        displayFotos(fotos);
    } catch (error) {
        mural.innerHTML = `
            <div class="error">
                <p>Erro ao carregar as fotos: ${error.message}!</p>
                <button onclick="window.location.reload()">Voltar</button>
            </div>`;
    }
}

function displayFotos(fotos) {
    if (fotos.length === 0) {
        mural.innerHTML = '<p class="loading">Fotos não encontradas.</p>';
        return;
    }

    mural.innerHTML = fotos.map(foto => `
        <div class="photo-card">
            <a href="https://www.google.com/maps?q=${foto.latitude},${foto.longitude}" target="_blank">
                <img 
                    src="${foto.image_url}" 
                    alt="Foto em ${foto.latitude}, ${foto.longitude}." 
                    class="photo-img"
                    loading="lazy"
                >
            </a>
            <div class="photo-info">
                <div class="photo-location">
                    <img src="https://cdn-icons-png.flaticon.com/512/684/684908.png" 
                         alt="Pin de localização" 
                         class="pin-icon"
                    />
                    <span> ${foto.latitude.toFixed(4)}, ${foto.longitude.toFixed(4)}</span>
                    <small>${new Date(foto.created_at).toLocaleDateString()}</small>
                </div>
            </div>
        </div>
    `).join('');
}

document.addEventListener('DOMContentLoaded', carregarFotos);
