document.addEventListener('DOMContentLoaded', function() {
    // Elementos del DOM
    const qrContent = document.getElementById('qr-content');
    const qrColor = document.getElementById('qr-color');
    const bgColor = document.getElementById('bg-color');
    const logoUpload = document.getElementById('logo-upload');
    const logoPreview = document.getElementById('logo-preview');
    const logoPreviewContainer = document.getElementById('logo-preview-container');
    const removeLogoBtn = document.getElementById('remove-logo');
    const generateBtn = document.getElementById('generate-btn');
    const qrResult = document.getElementById('qr-result');
    const downloadPng = document.getElementById('download-png');
    const downloadSvg = document.getElementById('download-svg');
    const newQrBtn = document.getElementById('new-qr');
    const inputSection = document.querySelector('.input-section');
    const resultSection = document.querySelector('.result-section');
    const uploadArea = document.getElementById('upload-area');
    
    let logoFile = null;
    
    // Event listeners
    logoUpload.addEventListener('change', handleLogoUpload);
    removeLogoBtn.addEventListener('click', removeLogo);
    generateBtn.addEventListener('click', generateQR);
    downloadPng.addEventListener('click', () => downloadQR('png'));
    downloadSvg.addEventListener('click', () => downloadQR('svg'));
    newQrBtn.addEventListener('click', resetGenerator);
    
    // Drag and drop para el logo
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.style.borderColor = 'var(--primary-light)';
        uploadArea.style.backgroundColor = 'rgba(67, 97, 238, 0.1)';
    });
    
    uploadArea.addEventListener('dragleave', () => {
        uploadArea.style.borderColor = 'var(--glass-border)';
        uploadArea.style.backgroundColor = 'rgba(0, 0, 0, 0.1)';
    });
    
    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.style.borderColor = 'var(--glass-border)';
        uploadArea.style.backgroundColor = 'rgba(0, 0, 0, 0.1)';
        
        if (e.dataTransfer.files.length) {
            logoUpload.files = e.dataTransfer.files;
            handleLogoUpload({ target: logoUpload });
        }
    });
    
    // Manejar la subida del logo
    function handleLogoUpload(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        if (!file.type.match('image.*')) {
            alert('Por favor, sube un archivo de imagen válido.');
            return;
        }
        
        // Verificar tamaño máximo (2MB)
        if (file.size > 2 * 1024 * 1024) {
            alert('El archivo es demasiado grande. Máximo 2MB permitidos.');
            return;
        }
        
        logoFile = file;
        
        const reader = new FileReader();
        reader.onload = function(event) {
            logoPreview.src = event.target.result;
            logoPreviewContainer.classList.remove('hidden');
        };
        reader.readAsDataURL(file);
    }
    
    // Eliminar el logo
    function removeLogo() {
        logoFile = null;
        logoPreview.src = '#';
        logoPreviewContainer.classList.add('hidden');
        logoUpload.value = '';
    }
    
    // Generar el código QR
    function generateQR() {
        const content = qrContent.value.trim();
        if (!content) {
            showAlert('Por favor, introduce un texto o URL para generar el QR.');
            return;
        }
        
        // Mostrar estado de carga
        generateBtn.innerHTML = '<span>Generando...</span><div class="spinner"></div>';
        generateBtn.disabled = true;
        
        const options = {
            color: {
                dark: qrColor.value,
                light: bgColor.value
            },
            width: 256,
            margin: 2,
            quality: 0.95
        };
        
        // Generar QR sin logo primero
        QRCode.toCanvas(content, options, (error, canvas) => {
            // Restaurar botón
            generateBtn.innerHTML = '<span>Generar Código QR</span><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M9 12l-4.463 4.969L0 12l4.537-4.969L9 12zm6 0l4.463 4.969L24 12l-4.537-4.969L15 12z"/></svg>';
            generateBtn.disabled = false;
            
            if (error) {
                console.error(error);
                showAlert('Error al generar el QR. Por favor, intenta nuevamente.');
                return;
            }
            
            if (logoFile) {
                addLogoToQR(canvas, logoPreview.src);
            } else {
                displayQR(canvas);
            }
        });
    }
    
    // Añadir logo al QR
    function addLogoToQR(canvas, logoUrl) {
        const ctx = canvas.getContext('2d');
        const img = new Image();
        
        img.onload = function() {
            // Tamaño del logo (20% del tamaño del QR)
            const logoSize = canvas.width * 0.2;
            const logoX = (canvas.width - logoSize) / 2;
            const logoY = (canvas.height - logoSize) / 2;
            
            // Dibujar fondo blanco para el logo
            ctx.fillStyle = bgColor.value;
            ctx.fillRect(logoX - 5, logoY - 5, logoSize + 10, logoSize + 10);
            
            // Dibujar el logo
            ctx.drawImage(img, logoX, logoY, logoSize, logoSize);
            
            displayQR(canvas);
        };
        
        img.onerror = function() {
            console.error('Error al cargar el logo');
            displayQR(canvas); // Mostrar QR sin logo si hay error
        };
        
        img.src = logoUrl;
    }
    
    // Mostrar el QR generado
    function displayQR(canvas) {
        // Limpiar el contenedor
        qrResult.innerHTML = '';
        
        // Agregar animación al canvas
        canvas.style.opacity = '0';
        canvas.style.transform = 'scale(0.8)';
        canvas.style.transition = 'all 0.3s ease';
        
        qrResult.appendChild(canvas);
        
        // Trigger reflow para activar la animación
        void canvas.offsetWidth;
        
        canvas.style.opacity = '1';
        canvas.style.transform = 'scale(1)';
        
        // Mostrar la sección de resultados con animación
        inputSection.classList.add('hidden');
        resultSection.classList.remove('hidden');
        resultSection.style.opacity = '0';
        resultSection.style.transform = 'translateY(20px)';
        resultSection.style.transition = 'all 0.4s ease';
        
        setTimeout(() => {
            resultSection.style.opacity = '1';
            resultSection.style.transform = 'translateY(0)';
        }, 50);
        
        // Scroll suave a la sección de resultados
        setTimeout(() => {
            resultSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }, 400);
    }
    
    // Descargar el QR
    function downloadQR(format) {
        const canvas = qrResult.querySelector('canvas');
        if (!canvas) return;
        
        let fileName = 'codigo-qr';
        const content = qrContent.value.trim();
        if (content) {
            // Crear un nombre de archivo seguro
            fileName = content.replace(/^https?:\/\//, '')
                              .replace(/[^a-z0-9]/gi, '-')
                              .replace(/-+/g, '-')
                              .replace(/^-|-$/g, '')
                              .substring(0, 30) || 'codigo-qr';
        }
        
        // Efecto al hacer clic en el botón
        const button = format === 'png' ? downloadPng : downloadSvg;
        button.classList.add('clicked');
        setTimeout(() => button.classList.remove('clicked'), 300);
        
        if (format === 'png') {
            // Descargar como PNG
            const link = document.createElement('a');
            link.download = `${fileName}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
        } else if (format === 'svg') {
            // Generar y descargar como SVG
            QRCode.toString(qrContent.value.trim(), {
                color: {
                    dark: qrColor.value,
                    light: bgColor.value
                },
                margin: 2,
                type: 'svg'
            }, function(error, svg) {
                if (error) {
                    console.error(error);
                    showAlert('Error al generar SVG. Descargando PNG en su lugar.');
                    downloadQR('png');
                    return;
                }
                
                const blob = new Blob([svg], {type: 'image/svg+xml'});
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.download = `${fileName}.svg`;
                link.href = url;
                link.click();
                URL.revokeObjectURL(url);
            });
        }
    }
    
    // Reiniciar el generador
    function resetGenerator() {
        // Animación de salida
        resultSection.style.opacity = '0';
        resultSection.style.transform = 'translateY(20px)';
        
        setTimeout(() => {
            qrContent.value = '';
            qrColor.value = '#4361ee'; // Color primario del diseño
            bgColor.value = '#ffffff';
            removeLogo();
            
            resultSection.classList.add('hidden');
            inputSection.classList.remove('hidden');
            qrResult.innerHTML = '';
            
            // Restaurar estilos para la próxima animación
            resultSection.style.opacity = '';
            resultSection.style.transform = '';
        }, 300);
        
        // Hacer scroll hacia arriba
        setTimeout(() => {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        }, 350);
    }
    
    // Mostrar alerta estilizada
    function showAlert(message) {
        const alert = document.createElement('div');
        alert.className = 'alert animate__animated animate__fadeInDown';
        alert.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
            </svg>
            <span>${message}</span>
        `;
        
        document.body.appendChild(alert);
        
        setTimeout(() => {
            alert.classList.add('animate__fadeOutUp');
            setTimeout(() => alert.remove(), 500);
        }, 3000);
    }
});