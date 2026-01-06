// ===== BROWSER FINGERPRINTING =====
async function getBrowserFingerprint() {
    const data = {
        screen: `${screen.width}x${screen.height}x${screen.colorDepth}`,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        language: navigator.language,
        languages: navigator.languages.join(','),
        platform: navigator.platform,
        userAgent: navigator.userAgent,
        hardwareConcurrency: navigator.hardwareConcurrency || 0,
        deviceMemory: navigator.deviceMemory || 0,
        maxTouchPoints: navigator.maxTouchPoints || 0,
        canvas: await getCanvasFingerprint(),
        webgl: getWebGLFingerprint()
    };

    const fingerprint = await hashData(JSON.stringify(data));
    return fingerprint;
}

async function getCanvasFingerprint() {
    try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = 200;
        canvas.height = 50;

        ctx.textBaseline = 'top';
        ctx.font = '14px Arial';
        ctx.textBaseline = 'alphabetic';
        ctx.fillStyle = '#f60';
        ctx.fillRect(125, 1, 62, 20);
        ctx.fillStyle = '#069';
        ctx.fillText('Donaxi IA 🚀', 2, 15);
        ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
        ctx.fillText('Donaxi IA 🚀', 4, 17);

        return canvas.toDataURL();
    } catch (e) {
        return 'canvas-error';
    }
}

function getWebGLFingerprint() {
    try {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        if (!gl) return 'no-webgl';

        const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
        if (!debugInfo) return 'no-debug-info';

        return gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
    } catch (e) {
        return 'webgl-error';
    }
}

async function hashData(text) {
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// ===== TOAST SYSTEM =====
function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return; // Validación por seguridad

    const toast = document.createElement('div');

    // Configuración por tipo
    const configs = {
        error: { bg: 'bg-red-500/10', border: 'border-red-500/50', icon: 'fa-times-circle', text: 'text-red-400' },
        success: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/50', icon: 'fa-check-circle', text: 'text-emerald-400' },
        info: { bg: 'bg-blue-500/10', border: 'border-blue-500/50', icon: 'fa-info-circle', text: 'text-blue-400' }
    };

    const cfg = configs[type] || configs.info;

    toast.className = `transform translate-y-10 opacity-0 transition-all duration-300 pointer-events-auto flex items-center gap-3 p-4 rounded-xl border backdrop-blur-md shadow-lg ${cfg.bg} ${cfg.border} max-w-sm w-full`;
    toast.innerHTML = `
        <i class="fas ${cfg.icon} ${cfg.text} text-xl shrink-0"></i>
        <p class="text-sm font-medium text-gray-200">${message}</p>
    `;

    container.appendChild(toast);

    // Animación entrada
    requestAnimationFrame(() => {
        toast.classList.remove('translate-y-10', 'opacity-0');
    });

    // Auto eliminar
    setTimeout(() => {
        toast.classList.add('translate-x-full', 'opacity-0');
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

// ===== CONFIRM MODAL SYSTEM =====
function showConfirm(message) {
    return new Promise((resolve) => {
        const modal = document.getElementById('confirm-modal');
        const content = document.getElementById('confirm-content');
        const msgEl = document.getElementById('confirm-message');
        const yesBtn = document.getElementById('confirm-yes');
        const cancelBtn = document.getElementById('confirm-cancel');

        if (!modal) return resolve(false);

        // Set message
        msgEl.textContent = message;

        // Show modal
        modal.classList.remove('hidden');
        // Small delay for transition
        requestAnimationFrame(() => {
            modal.classList.remove('opacity-0');
            content.classList.remove('scale-95');
            content.classList.add('scale-100');
        });

        // Handlers cleanup wrapper
        const cleanup = () => {
            modal.classList.add('opacity-0');
            content.classList.remove('scale-100');
            content.classList.add('scale-95');
            setTimeout(() => modal.classList.add('hidden'), 300);

            yesBtn.onclick = null;
            cancelBtn.onclick = null;
        };

        yesBtn.onclick = () => {
            cleanup();
            resolve(true);
        };

        cancelBtn.onclick = () => {
            cleanup();
            resolve(false);
        };
    });
}

// ===== ESTADO DE LA APLICACIÓN =====
let comments = [];
let likes = 20;
let dislikes = 0;
let userVote = null;
let currentRating = 0;
let browserFingerprint = null;
let editingCommentId = null;

// Cargar datos del localStorage al iniciar
async function loadData() {
    browserFingerprint = await getBrowserFingerprint();

    const savedComments = localStorage.getItem('ytComments');
    const savedLikes = localStorage.getItem('ytLikes');
    const savedDislikes = localStorage.getItem('ytDislikes');
    const savedVote = localStorage.getItem('userVote');
    const savedFingerprint = localStorage.getItem('userFingerprint');

    // Forzar el comentario del administrador y limpiar el resto (reseteo solicitado)
    const adminComment = {
        id: 1000,
        fingerprint: 'admin-donaxi',
        name: 'Donaxi',
        text: 'Espero y este contenido les guste y les pueda ayudar. ❤️🫶',
        rating: 5,
        date: new Date().toLocaleDateString('es-ES'),
        isAnonymous: false,
        likes: 0,
        likedBy: [],
        edited: false,
        isAdmin: true
    };

    comments = [adminComment];
    localStorage.setItem('ytComments', JSON.stringify(comments));
    if (savedLikes !== null) {
        likes = parseInt(savedLikes);
    } else {
        likes = 20; // Garantizar 20 por defecto
        localStorage.setItem('ytLikes', likes.toString());
    }
    if (savedDislikes) dislikes = parseInt(savedDislikes);

    if (savedVote && savedFingerprint === browserFingerprint) {
        userVote = savedVote;
    } else if (savedVote && savedFingerprint !== browserFingerprint) {
        localStorage.removeItem('userVote');
        localStorage.removeItem('userFingerprint');
        userVote = null;
    }

    updateUI();
    renderComments();
}

// Actualizar UI de likes/dislikes
function updateUI() {
    document.getElementById('likeCount').textContent = likes;
    document.getElementById('dislikeCount').textContent = dislikes;

    const likeBtn = document.getElementById('likeBtn');
    const dislikeBtn = document.getElementById('dislikeBtn');

    likeBtn.className = 'social-btn flex-1 sm:flex-none justify-center min-w-0 flex items-center gap-2 px-3 py-3 md:px-8 rounded-full font-bold glass-card text-gray-300 active:scale-95 text-lg md:text-xl';
    dislikeBtn.className = 'social-btn flex-1 sm:flex-none justify-center min-w-0 flex items-center gap-2 px-3 py-3 md:px-8 rounded-full font-bold glass-card text-gray-300 active:scale-95 text-lg md:text-xl';

    if (userVote === 'like') {
        likeBtn.className = 'social-btn flex-1 sm:flex-none justify-center min-w-0 flex items-center gap-2 px-3 py-3 md:px-8 rounded-full font-bold bg-emerald-500 text-white active:scale-95 text-lg md:text-xl';
    } else if (userVote === 'dislike') {
        dislikeBtn.className = 'social-btn flex-1 sm:flex-none justify-center min-w-0 flex items-center gap-2 px-3 py-3 md:px-8 rounded-full font-bold bg-red-500 text-white active:scale-95 text-lg md:text-xl';
    }
}

// Manejar like
function handleLike() {
    if (userVote === 'like') {
        likes--;
        userVote = null;
        localStorage.removeItem('userVote');
        localStorage.removeItem('userFingerprint');
    } else {
        if (userVote === 'dislike') dislikes--;
        likes++;
        userVote = 'like';
        localStorage.setItem('userVote', 'like');
        localStorage.setItem('userFingerprint', browserFingerprint);
    }

    localStorage.setItem('ytLikes', likes.toString());
    localStorage.setItem('ytDislikes', dislikes.toString());
    updateUI();
}

// Manejar dislike
function handleDislike() {
    if (userVote === 'dislike') {
        dislikes--;
        userVote = null;
        localStorage.removeItem('userVote');
        localStorage.removeItem('userFingerprint');
    } else {
        if (userVote === 'like') likes--;
        dislikes++;
        userVote = 'dislike';
        localStorage.setItem('userVote', 'dislike');
        localStorage.setItem('userFingerprint', browserFingerprint);
    }

    localStorage.setItem('ytLikes', likes.toString());
    localStorage.setItem('ytDislikes', dislikes.toString());
    updateUI();
}

// Manejar compartir
async function handleShare() {
    const shareData = {
        title: 'Guía de Monetización YouTube - Donaxi IA',
        text: '¡Descubre cómo monetizar tu canal de YouTube con esta guía completa!',
        url: window.location.href
    };

    try {
        if (navigator.share) {
            await navigator.share(shareData);
        } else {
            await navigator.clipboard.writeText(window.location.href);
            showToast('¡Enlace copiado al portapapeles!', 'success');
        }
    } catch (err) {
        // Error silenciado
    }
}

// Manejar rating de estrellas
function setupStarRating() {
    const stars = document.querySelectorAll('#starRating .star');

    stars.forEach(star => {
        star.addEventListener('click', () => {
            currentRating = parseInt(star.dataset.rating);
            updateStars();
        });

        star.addEventListener('mouseenter', () => {
            const rating = parseInt(star.dataset.rating);
            highlightStars(rating);
        });
    });

    document.getElementById('starRating').addEventListener('mouseleave', () => {
        updateStars();
    });
}

function highlightStars(rating) {
    const stars = document.querySelectorAll('#starRating .star');
    stars.forEach((star, index) => {
        if (index < rating) {
            star.classList.add('active');
        } else {
            star.classList.remove('active');
        }
    });
}

function updateStars() {
    highlightStars(currentRating);
}

// Manejar checkbox anónimo
function setupAnonymousToggle() {
    const checkbox = document.getElementById('anonymousCheck');
    const nameInput = document.getElementById('nameInput');

    // Estado inicial
    nameInput.required = !checkbox.checked;

    checkbox.addEventListener('change', () => {
        if (checkbox.checked) {
            nameInput.style.display = 'none';
            nameInput.required = false;
        } else {
            nameInput.style.display = 'block';
            nameInput.required = true;
        }
    });
}

// Verificar si el usuario ya comentó
function hasUserCommented() {
    return comments.some(c => c.fingerprint === browserFingerprint);
}

// Obtener comentario del usuario
function getUserComment() {
    return comments.find(c => c.fingerprint === browserFingerprint);
}

// Manejar envío de comentario
function handleCommentSubmit(e) {
    e.preventDefault();

    const commentText = document.getElementById('commentText').value.trim();
    const isAnonymous = document.getElementById('anonymousCheck').checked;
    const nameInput = document.getElementById('nameInput');
    const name = nameInput.value.trim();

    // Validación estricta
    if (!isAnonymous && !name) {
        showToast('Por favor escribe tu nombre o selecciona "Comentar como Anónimo"', 'error');
        return;
    }

    // Validar nombre duplicado (Nuevo requerimiento)
    if (!isAnonymous) {
        const nameExists = comments.some(c =>
            !c.isAnonymous &&
            c.name.toLowerCase() === name.toLowerCase() &&
            c.fingerprint !== browserFingerprint
        );

        if (nameExists) {
            showToast('¡Ese nombre ya está en uso! Por favor elige otro.', 'error');
            nameInput.focus();
            return;
        }
    }

    if (!commentText || currentRating === 0) {
        showToast('Por favor completa el comentario y la calificación', 'error');
        return;
    }

    const finalName = isAnonymous ? 'Anónimo' : name;

    // Verificar si está editando
    if (editingCommentId) {
        // Editar comentario existente
        const commentIndex = comments.findIndex(c => c.id === editingCommentId);
        if (commentIndex !== -1) {
            comments[commentIndex].text = commentText;
            comments[commentIndex].rating = currentRating;
            comments[commentIndex].name = finalName;
            comments[commentIndex].isAnonymous = isAnonymous;
            comments[commentIndex].edited = true;
            comments[commentIndex].editDate = new Date().toLocaleDateString('es-ES');
        }
        editingCommentId = null;
        document.querySelector('#commentForm button[type="submit"]').innerHTML = '<i class="fas fa-paper-plane"></i> Publicar Comentario';
    } else {
        // Verificar si ya comentó
        if (hasUserCommented()) {
            showToast('Ya has comentado. Puedes editar tu comentario existente.', 'info');
            return;
        }

        // Crear nuevo comentario
        const comment = {
            id: Date.now(),
            fingerprint: browserFingerprint,
            name: finalName,
            text: commentText,
            rating: currentRating,
            date: new Date().toLocaleDateString('es-ES'),
            isAnonymous: isAnonymous,
            likes: 0,
            likedBy: [],
            edited: false,
            isAdmin: !isAnonymous && name.toLowerCase() === 'donaxi'
        };

        comments.unshift(comment);
        showToast('¡Comentario publicado con éxito!', 'success');
    }

    localStorage.setItem('ytComments', JSON.stringify(comments));

    // Resetear formulario
    document.getElementById('commentForm').reset();
    currentRating = 0;
    updateStars();

    renderComments();
}

// Editar comentario
function editComment(commentId) {
    const comment = comments.find(c => c.id === commentId);
    if (!comment || comment.fingerprint !== browserFingerprint) {
        showToast('Solo puedes editar tu propio comentario', 'error');
        return;
    }

    // Llenar formulario
    document.getElementById('commentText').value = comment.text;
    document.getElementById('anonymousCheck').checked = comment.isAnonymous;
    if (!comment.isAnonymous) {
        document.getElementById('nameInput').value = comment.name;
        document.getElementById('nameInput').style.display = 'block';
    }
    currentRating = comment.rating;
    updateStars();

    editingCommentId = commentId;
    document.querySelector('#commentForm button[type="submit"]').innerHTML = '<i class="fas fa-save"></i> Guardar Cambios';

    // Scroll al formulario
    document.getElementById('commentForm').scrollIntoView({ behavior: 'smooth' });
}

// Cancelar edición
function cancelEdit() {
    editingCommentId = null;
    document.getElementById('commentForm').reset();
    currentRating = 0;
    updateStars();
    document.querySelector('#commentForm button[type="submit"]').innerHTML = '<i class="fas fa-paper-plane"></i> Publicar Comentario';
}

// Like en comentario
function likeComment(commentId) {
    const comment = comments.find(c => c.id === commentId);
    if (!comment) return;

    if (!comment.likedBy) comment.likedBy = [];

    const hasLiked = comment.likedBy.includes(browserFingerprint);

    if (hasLiked) {
        // Quitar like
        comment.likes--;
        comment.likedBy = comment.likedBy.filter(fp => fp !== browserFingerprint);
    } else {
        // Dar like
        comment.likes++;
        comment.likedBy.push(browserFingerprint);
    }

    localStorage.setItem('ytComments', JSON.stringify(comments));
    renderComments();
}

// Eliminar comentario (Nuevo)
async function deleteComment(commentId) {
    const confirmed = await showConfirm('¿Estás seguro de eliminar este comentario?');
    if (!confirmed) return;

    const commentIndex = comments.findIndex(c => c.id === commentId);
    if (commentIndex === -1) return;

    // Seguridad extra
    if (comments[commentIndex].fingerprint !== browserFingerprint) {
        showToast('Solo puedes eliminar tus propios comentarios.', 'error');
        return;
    }

    // Eliminar del array
    comments.splice(commentIndex, 1);

    // Guardar en LS
    localStorage.setItem('ytComments', JSON.stringify(comments));

    // Resetear UI
    cancelEdit();

    // Ocultar banner de "ya comentaste" si existe
    const banner = document.getElementById('alreadyCommentedBanner');
    if (banner) banner.remove();

    showToast('Comentario eliminado correctamente', 'success');

    renderComments();
}

// Calcular score del comentario (rating + likes)
function getCommentScore(comment) {
    // Rating vale más que likes (rating * 10 + likes)
    return (comment.rating * 10) + (comment.likes || 0);
}

// Renderizar comentarios
function renderComments() {
    const commentsList = document.getElementById('commentsList');

    // Ordenar: Admin primero, luego por score
    const sortedComments = [...comments].sort((a, b) => {
        if (a.isAdmin && !b.isAdmin) return -1;
        if (!a.isAdmin && b.isAdmin) return 1;
        return getCommentScore(b) - getCommentScore(a);
    });

    if (sortedComments.length === 0) {
        commentsList.innerHTML = `
            <div class="text-center py-12 text-gray-500">
                <i class="fas fa-comment-slash text-5xl mb-4 opacity-50"></i>
                <p>Sé el primero en comentar</p>
            </div>
        `;
        return;
    }

    commentsList.innerHTML = sortedComments.map(comment => {
        const isOwnComment = comment.fingerprint === browserFingerprint;
        const hasLiked = comment.likedBy && comment.likedBy.includes(browserFingerprint);

        return `
        <div class="comment-card bg-black/20 rounded-2xl p-4 border ${comment.isAdmin ? 'border-red-500/30 ring-1 ring-red-500/10' : (isOwnComment ? 'border-emerald-500/30' : 'border-gray-800')}">
            <div class="flex flex-col md:flex-row items-center md:items-start justify-between mb-4 gap-4 md:gap-0 text-center md:text-left">
                <div class="flex flex-col md:flex-row items-center gap-3">
                    <div class="${comment.isAdmin ? 'bg-red-600 shadow-red-600/50' : (comment.isAnonymous ? 'bg-gray-700' : 'bg-gradient-to-br from-emerald-500 to-teal-500')} w-10 h-10 rounded-full flex items-center justify-center font-bold shadow-lg transition-transform duration-500 hover:scale-110">
                        ${comment.isAdmin ? '<i class="fas fa-crown"></i>' : (comment.isAnonymous ? '?' : comment.name[0].toUpperCase())}
                    </div>
                    <div>
                        <div class="font-semibold flex flex-col md:flex-row items-center gap-1 md:gap-2 text-lg md:text-base">
                            ${comment.name}
                            ${comment.isAdmin ? '<span class="text-[10px] bg-red-600/20 text-red-400 px-2 py-0.5 rounded-lg border border-red-500/30 font-black tracking-widest uppercase flex items-center gap-1"><i class="fas fa-thumbtack text-[8px] rotate-45"></i> FIJADO</span>' : ''}
                            ${comment.isAdmin ? '<span class="text-[10px] bg-indigo-600/20 text-indigo-400 px-2 py-0.5 rounded-lg border border-indigo-500/30 font-black tracking-widest uppercase">Administrador</span>' : ''}
                            ${isOwnComment && !comment.isAdmin ? '<span class="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full">Tu comentario</span>' : ''}
                        </div>
                        <div class="text-xs text-gray-500 mt-1 md:mt-0">
                            ${comment.date}
                            ${comment.edited ? `<span class="text-yellow-400"> • Editado ${comment.editDate || ''}</span>` : ''}
                        </div>
                    </div>
                </div>
                <div class="star-rating bg-black/20 px-3 py-1 rounded-full">
                    ${Array(5).fill(0).map((_, i) => `
                        <i class="fas fa-star star text-xl md:text-base ${i < comment.rating ? 'active' : ''}" style="cursor: default;"></i>
                    `).join('')}
                </div>
            </div>
            <p class="text-gray-300 mb-4 text-center md:text-left text-sm md:text-base leading-relaxed">${comment.text}</p>
            
            <div class="flex flex-col md:flex-row items-center md:justify-between pt-4 border-t border-gray-700/50 gap-3 md:gap-0">
                <div class="flex items-center justify-center gap-3 w-full md:w-auto">
                    <button 
                        onclick="likeComment(${comment.id})" 
                        class="flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all text-xs font-medium border ${hasLiked ? 'bg-pink-500/10 border-pink-500/30 text-pink-400' : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'}"
                    >
                        <i class="fas fa-heart ${hasLiked ? 'animate-pulse' : ''}"></i>
                        <span>${comment.likes || 0}</span>
                    </button>
                    
                    ${isOwnComment ? `
                        <div class="flex items-center gap-2">
                            <button 
                                onclick="editComment(${comment.id})" 
                                class="flex items-center gap-1.5 px-3 py-1.5 md:px-4 md:py-2 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400 hover:bg-blue-500/20 transition-all text-xs md:text-sm font-medium"
                            >
                                <i class="fas fa-edit"></i>
                                <span>Editar</span>
                            </button>
                            <button 
                                onclick="deleteComment(${comment.id})" 
                                class="flex items-center gap-1.5 px-3 py-1.5 md:px-4 md:py-2 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 transition-all text-xs md:text-sm font-medium"
                            >
                                <i class="fas fa-trash-alt"></i>
                                <span>Eliminar</span>
                            </button>
                        </div>
                    ` : ''}
                </div>
                
                <div class="text-xs font-mono text-gray-500 bg-gray-800/50 px-2 py-1 rounded w-full md:w-auto text-center md:text-right">
                    Score: ${getCommentScore(comment)}
                </div>
            </div>
        </div>
        `;
    }).join('');
}

// Inicializar la aplicación
document.addEventListener('DOMContentLoaded', async () => {
    await loadData();
    setupStarRating();
    setupAnonymousToggle();

    // Event listeners
    document.getElementById('likeBtn').addEventListener('click', handleLike);
    document.getElementById('dislikeBtn').addEventListener('click', handleDislike);
    document.getElementById('shareBtn').addEventListener('click', handleShare);
    document.getElementById('commentForm').addEventListener('submit', handleCommentSubmit);

    // Verificar si ya comentó y mostrar mensaje
    if (hasUserCommented()) {
        const userComment = getUserComment();
        const formTitle = document.createElement('div');
        formTitle.id = 'alreadyCommentedBanner'; // ID para poder eliminarlo después
        formTitle.className = 'mb-4 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-sm text-emerald-400 flex items-center gap-2 animate-fade-in';
        formTitle.innerHTML = '<i class="fas fa-info-circle"></i> <span>Ya has comentado. Puedes editar o eliminar tu comentario.</span>';
        document.getElementById('commentForm').insertBefore(formTitle, document.getElementById('commentForm').firstChild);
    }
});
