let map;
let markers = L.markerClusterGroup();
const defaultLocation = [-23.5505, -46.6333];

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
const captureButton = document.getElementById('captureButton');
const switchCameraButton = document.getElementById('switchCameraButton');
const video = document.getElementById('camera');
const canvas = document.getElementById('canvas');

let fotoData = null;
let localizacao = null;
let stream = null;
let currentFacingMode = 'environment';

function initMap() {
    map = L.map('map').setView(defaultLocation, 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);
    map.addLayer(markers);
    btnAtualizar.addEventListener('click', carregarFotos);
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
    retryButton.addEventListener('click', carregarFotos);
}

async function carregarFotos() {
    try {
        loading.style.display = 'block';
        errorMessage.style.display = 'none';
        const response = await fetch('https://api-mural.onrender.com/photos');
        if (!response.ok) {
            throw new Error(`Erro HTTP: ${response.status}`);
        }
        const photos = await response.json();
        markers.clearLayers();
        if (photos.length === 0) {
            loading.style.display = 'none';
            errorText.textContent = 'Nenhuma foto encontrada. Seja o primeiro a postar!';
            errorMessage.style.display = 'block';
            return;
        }
        photos.forEach(photo => {
            const lat = photo.latitude;
            const lng = photo.longitude;
            if (lat && lng) {
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

async function iniciarCamera(facingMode = 'environment') {
    try {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
        }
        const constraints = {
            video: { 
                facingMode: facingMode,
                width: { ideal: 1280 },
                height: { ideal: 720 }
            }
        };
        stream = await navigator.mediaDevices.getUserMedia(constraints);
        video.srcObject = stream;
        currentFacingMode = facingMode;
    } catch (error) {
        console.error('Erro ao acessar a câmera:', error);
        mostrarStatus(statusError);
        statusError.textContent = 'Erro ao acessar a câmera. Verifique as permissões.';
    }
}

function capturarFoto() {
    if (!stream) return;
    const context = canvas.getContext('2d');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    fotoData = canvas.toDataURL('image/jpeg');
    preview.src = fotoData;
    preview.style.display = 'block';
    verificarEstadoBotoes();
}

function alternarCamera() {
    const newFacingMode = currentFacingMode === 'environment' ? 'user' : 'environment';
    iniciarCamera(newFacingMode);
}

function pararCamera() {
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
        stream = null;
    }
}

tabs.forEach(tab => {
    tab.addEventListener('click', () => {
        const tabId = tab.getAttribute('data-tab');
        tabs.forEach(t => t.classList.remove('active'));
        contents.forEach(c => c.classList.remove('active'));
        tab.classList.add('active');
        document.getElementById(`${tabId}-content`).classList.add('active');
        if (tabId === 'visualizar') {
            pararCamera();
            setTimeout(() => {
                map.invalidateSize();
                carregarFotos();
            }, 100);
        } else if (tabId === 'postar') {
            if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
                iniciarCamera();
            }
        }
    });
});

function mostrarStatus(elemento) {
    statusInfo.style.display = 'none';
    statusSuccess.style.display = 'none';
    statusError.style.display = 'none';
    elemento.style.display = 'block';
}

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

captureButton.addEventListener('click', capturarFoto);
switchCameraButton.addEventListener('click', alternarCamera);

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

function verificarEstadoBotoes() {
    btnPostar.disabled = !(fotoData && localizacao);
}

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

if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    document.querySelector('label[for="camera"]').textContent = 'Tirar foto com a câmera (não suportado neste navegador):';
    captureButton.disabled = true;
    switchCameraButton.disabled = true;
}

document.addEventListener('DOMContentLoaded', () => {
    initMap();
    carregarFotos();
});
