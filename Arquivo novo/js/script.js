// Variáveis globais
let map;
// Marcadores agora são um grupo de cluster
let markers = L.markerClusterGroup();
const defaultLocation = [-23.5505, -46.6333]; // São Paulo

// Elementos da interface
const tabs = document.querySelectorAll('.tab');
const contents = document.querySelectorAll('.content');
const inputFoto = document.getElementById('foto');
const preview = document.getElementById('preview');
const btnObterLocalizacao = document.getElementById('btnObterLocalizacao');
const btnPostar = document.getElementById('btnPostar');
const btnAtualizar = document.getElementById('btnAtualizar');
const btnCentralizar = document.getElementById('btnCentralizar');
const locationInfo = document.getElementById('locationInfo');
const statusInfo = document.getElementById('statusInfo');
const statusSuccess = document.getElementById('statusSuccess');
const statusError = document.getElementById('statusError');
const loading = document.getElementById('loading');
const errorMessage = document.getElementById('errorMessage');
const errorText = document.getElementById('errorText');
const retryButton = document.getElementById('retryButton');

// Variáveis para armazenar dados
let fotoData = null;
let localizacao = null;

// Inicializar o mapa
function initMap() {
    map = L.map('map').setView(defaultLocation, 13);
    
    // Adicionar camada do mapa
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);
    
    // Adicionar o grupo de clusters ao mapa
    map.addLayer(markers);
    
    // Adicionar evento para atualizar o mapa
    btnAtualizar.addEventListener('click', carregarFotos);
    
    // Adicionar evento para centralizar o mapa
    btnCentralizar.addEventListener('click', () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const userLocation = [
                        position.coords.latitude,
                        position.coords.longitude
                    ];
                    map.setView(userLocation, 13);
                },
                () => {
                    map.setView(defaultLocation, 13);
                }
            );
        } else {
            map.setView(defaultLocation, 13);
        }
    });
    
    // Adicionar evento para tentar novamente em caso de erro
    retryButton.addEventListener('click', carregarFotos);
}

// Carregar fotos da API
async function carregarFotos() {
    try {
        loading.style.display = 'block';
        errorMessage.style.display = 'none';
        
        const response = await fetch('https://api-mural.onrender.com/photos');
        
        if (!response.ok) {
            throw new Error(`Erro HTTP: ${response.status}`);
        }
        
        const photos = await response.json();
        
        // Limpar os marcadores do grupo
        markers.clearLayers();
        
        // Verificar se há fotos
        if (photos.length === 0) {
            loading.style.display = 'none';
            errorText.textContent = 'Nenhuma foto encontrada. Seja o primeiro a postar!';
            errorMessage.style.display = 'block';
            return;
        }
        
        // Adicionar marcadores para cada foto
        photos.forEach(photo => {
            // Verificar se a foto tem coordenadas
            const lat = photo.latitude;
            const lng = photo.longitude;
            
            if (lat && lng) {
                // Criar conteúdo do popup
                let popupContent = `<div class="photo-popup">`;
                const imageUrl = photo.image_url;
                
                if (imageUrl) {
                    popupContent += `<img src="${imageUrl}" alt="Foto postada" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">`;
                    popupContent += `<div style="width:250px;height:150px;background:#f0f0f0;display:none;align-items:center;justify-content:center;color:#777;">Imagem não disponível</div>`;
                } else {
                    popupContent += `<div style="width:250px;height:150px;background:#f0f0f0;display:flex;align-items:center;justify-content:center;color:#777;">Imagem não disponível</div>`;
                }
                
                if (photo.created_at) {
                    popupContent += `<p class="date"><i class="fas fa-calendar-alt"></i> ${new Date(photo.created_at).toLocaleString()}</p>`;
                }
                
                popupContent += `</div>`;
                
                // Adicionar marcador ao grupo de clusters, não diretamente ao mapa
                const marker = L.marker([lat, lng]).bindPopup(popupContent);
                markers.addLayer(marker);
            }
        });
        
        loading.style.display = 'none';
        
    } catch (error) {
        console.error('Erro ao carregar fotos:', error);
        loading.style.display = 'none';
        errorText.textContent = `Erro ao carregar as fotos: ${error.message}`;
        errorMessage.style.display = 'block';
    }
}

// Alternar entre abas
tabs.forEach(tab => {
    tab.addEventListener('click', () => {
        const tabId = tab.getAttribute('data-tab');
        
        tabs.forEach(t => t.classList.remove('active'));
        contents.forEach(c => c.classList.remove('active'));
        
        tab.classList.add('active');
        document.getElementById(`${tabId}-content`).classList.add('active');
        
        if (tabId === 'visualizar') {
            setTimeout(() => {
                map.invalidateSize();
                carregarFotos();
            }, 100);
        }
    });
});

// Mostrar status
function mostrarStatus(elemento) {
    statusInfo.style.display = 'none';
    statusSuccess.style.display = 'none';
    statusError.style.display = 'none';
    elemento.style.display = 'block';
}

// Preview da imagem
inputFoto.addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(event) {
            preview.src = event.target.result;
            preview.style.display = 'block';
            fotoData = event.target.result;
            verificarEstadoBotoes();
        };
        reader.readAsDataURL(file);
    }
});

// Obter localização
btnObterLocalizacao.addEventListener('click', function() {
    mostrarStatus(statusInfo);
    statusInfo.textContent = 'Obtendo localização...';
    
    if (!navigator.geolocation) {
        statusInfo.textContent = 'Geolocalização não é suportada pelo seu navegador';
        return;
    }
    
    navigator.geolocation.getCurrentPosition(
        function(position) {
            localizacao = {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude
            };
            
            locationInfo.innerHTML = `<i class="fas fa-map-marker-alt"></i> Localização obtida: ${localizacao.latitude.toFixed(6)}, ${localizacao.longitude.toFixed(6)}`;
            mostrarStatus(statusInfo);
            statusInfo.textContent = 'Localização obtida com sucesso!';
            verificarEstadoBotoes();
        },
        function(error) {
            let mensagemErro;
            switch(error.code) {
                case error.PERMISSION_DENIED:
                    mensagemErro = "Permissão de localização negada.";
                    break;
                case error.POSITION_UNAVAILABLE:
                    mensagemErro = "Informações de localização indisponíveis.";
                    break;
                case error.TIMEOUT:
                    mensagemErro = "Tempo limite para obter localização excedido.";
                    break;
                default:
                    mensagemErro = "Erro desconhecido ao obter localização.";
            }
            
            locationInfo.textContent = mensagemErro;
            mostrarStatus(statusError);
            statusError.textContent = mensagemErro;
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
});

// Verificar se pode habilitar o botão de postar
function verificarEstadoBotoes() {
    btnPostar.disabled = !(fotoData && localizacao);
}

// Postar foto
btnPostar.addEventListener('click', async function() {
    mostrarStatus(statusInfo);
    statusInfo.textContent = 'Enviando foto...';
    
    try {
        const response = await fetch(fotoData);
        const blob = await response.blob();
        
        const formData = new FormData();
        formData.append('image', blob, 'foto.jpg');
        formData.append('latitude', localizacao.latitude);
        formData.append('longitude', localizacao.longitude);
        
        const apiResponse = await fetch('https://api-mural.onrender.com/photo', {
            method: 'POST',
            body: formData
        });
        
        if (apiResponse.ok) {
            mostrarStatus(statusSuccess);
            inputFoto.value = '';
            preview.style.display = 'none';
            fotoData = null;
            btnPostar.disabled = true;
            
            setTimeout(() => {
                if (document.getElementById('visualizar-content').classList.contains('active')) {
                    carregarFotos();
                }
            }, 1500);
        } else {
            throw new Error('Erro na API: ' + apiResponse.status);
        }
    } catch (error) {
        console.error('Erro ao postar foto:', error);
        mostrarStatus(statusError);
        statusError.textContent = 'Erro ao enviar foto. Tente novamente.';
    }
});

// Verificar suporte a câmera
if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    document.querySelector('label[for="foto"]').textContent = 'Selecionar foto (câmera não suportada):';
}

// Inicializar a aplicação quando a página estiver pronta
document.addEventListener('DOMContentLoaded', () => {
    initMap();
    carregarFotos();
});