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

// ===== ESTADO DE LA APLICACIÓN =====
let comments = [];
let likes = 0;
let dislikes = 0;
let userVote = null;
let currentRating = 0;
let browserFingerprint = null;
let editingCommentId = null;

// Cargar datos del localStorage al iniciar
async function loadData() {
    browserFingerprint = await getBrowserFingerprint();
    console.log('🔐 Fingerprint:', browserFingerprint.substring(0, 16) + '...');

    const savedComments = localStorage.getItem('ytComments');
    const savedLikes = localStorage.getItem('ytLikes');
    const savedDislikes = localStorage.getItem('ytDislikes');
    const savedVote = localStorage.getItem('userVote');
    const savedFingerprint = localStorage.getItem('userFingerprint');

    if (savedComments) comments = JSON.parse(savedComments);
    if (savedLikes) likes = parseInt(savedLikes);
    if (savedDislikes) dislikes = parseInt(savedDislikes);

    if (savedVote && savedFingerprint === browserFingerprint) {
        userVote = savedVote;
    } else if (savedVote && savedFingerprint !== browserFingerprint) {
        console.log('⚠️ Fingerprint cambió, reseteando voto');
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

    likeBtn.className = 'social-btn flex-1 sm:flex-none justify-center min-w-0 flex items-center gap-2 px-3 py-3 md:px-6 rounded-full font-semibold glass-card text-gray-300 active:scale-95 text-xs';
    dislikeBtn.className = 'social-btn flex-1 sm:flex-none justify-center min-w-0 flex items-center gap-2 px-3 py-3 md:px-6 rounded-full font-semibold glass-card text-gray-300 active:scale-95 text-xs';

    if (userVote === 'like') {
        likeBtn.className = 'social-btn flex-1 sm:flex-none justify-center min-w-0 flex items-center gap-2 px-3 py-3 md:px-6 rounded-full font-semibold bg-emerald-500 text-white active:scale-95 text-xs';
    } else if (userVote === 'dislike') {
        dislikeBtn.className = 'social-btn flex-1 sm:flex-none justify-center min-w-0 flex items-center gap-2 px-3 py-3 md:px-6 rounded-full font-semibold bg-red-500 text-white active:scale-95 text-xs';
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
            alert('¡Enlace copiado al portapapeles!');
        }
    } catch (err) {
        console.log('Error al compartir:', err);
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
        alert('Por favor escribe tu nombre o selecciona "Comentar como Anónimo"');
        nameInput.focus();
        return;
    }

    if (!commentText || currentRating === 0) {
        alert('Por favor completa el comentario y la calificación (1-5 estrellas)');
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
            alert('Ya has comentado. Puedes editar tu comentario existente.');
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
            likedBy: [], // Array de fingerprints que dieron like
            edited: false
        };

        comments.unshift(comment);
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
        alert('Solo puedes editar tu propio comentario');
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

// Calcular score del comentario (rating + likes)
function getCommentScore(comment) {
    // Rating vale más que likes (rating * 10 + likes)
    return (comment.rating * 10) + (comment.likes || 0);
}

// Renderizar comentarios
function renderComments() {
    const commentsList = document.getElementById('commentsList');

    // Ordenar por score (rating + likes)
    const sortedComments = [...comments].sort((a, b) => getCommentScore(b) - getCommentScore(a));

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
        <div class="comment-card bg-black/20 rounded-2xl p-6 border border-gray-800 ${isOwnComment ? 'border-emerald-500/30' : ''}">
            <div class="flex flex-col md:flex-row items-center md:items-start justify-between mb-4 gap-4 md:gap-0 text-center md:text-left">
                <div class="flex flex-col md:flex-row items-center gap-3">
                    <div class="${comment.isAnonymous ? 'bg-gray-700' : 'bg-gradient-to-br from-emerald-500 to-teal-500'} w-14 h-14 md:w-10 md:h-10 rounded-full flex items-center justify-center font-bold text-xl md:text-base shadow-lg">
                        ${comment.isAnonymous ? '?' : comment.name[0].toUpperCase()}
                    </div>
                    <div>
                        <div class="font-semibold flex flex-col md:flex-row items-center gap-1 md:gap-2 text-lg md:text-base">
                            ${comment.name}
                            ${isOwnComment ? '<span class="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full">Tu comentario</span>' : ''}
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
            <p class="text-gray-300 mb-4 text-center md:text-left text-lg md:text-base leading-relaxed">${comment.text}</p>
            
            <div class="flex flex-col md:flex-row items-center md:justify-between pt-4 border-t border-gray-700/50 gap-3 md:gap-0">
                <div class="flex items-center justify-center gap-3 w-full md:w-auto">
                    <button 
                        onclick="likeComment(${comment.id})" 
                        class="flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${hasLiked ? 'bg-pink-500/20 text-pink-400' : 'bg-gray-700/30 text-gray-400 hover:bg-gray-700/50'}"
                    >
                        <i class="fas fa-heart ${hasLiked ? 'animate-pulse' : ''}"></i>
                        <span class="font-semibold">${comment.likes || 0}</span>
                    </button>
                    
                    ${isOwnComment ? `
                        <button 
                            onclick="editComment(${comment.id})" 
                            class="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-all"
                        >
                            <i class="fas fa-edit"></i>
                            <span class="font-semibold">Editar</span>
                        </button>
                    ` : ''}
                </div>
                
                <div class="text-xs font-mono text-gray-500 bg-gray-800/50 px-2 py-1 rounded w-full md:w-auto text-center md:text-right">
                    Score: ${getCommentScore(comment)}
                </div>
            </div>
        </div>
    `}).join('');
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
        formTitle.className = 'mb-4 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-sm text-emerald-400';
        formTitle.innerHTML = '<i class="fas fa-info-circle"></i> Ya has comentado. Puedes editar tu comentario haciendo clic en "Editar".';
        document.getElementById('commentForm').insertBefore(formTitle, document.getElementById('commentForm').firstChild);
    }
});
