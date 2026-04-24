import { User } from '../models/User.js';

/**
 * GlobalUI.js
 * Centraliza la lógica de la interfaz que se repite en todas las páginas:
 * - Verificación de sesión
 * - Menú desplegable de perfil
 * - Modal de Ajustes (Update/Delete/Password)
 * - Cierre de sesión
 */
document.addEventListener('DOMContentLoaded', () => {
    const user = User.getCurrentUser();
    
    // 1. Redirigir si no hay sesión (excepto en login/registro)
    const isAuthPage = window.location.pathname.includes('login.html') || window.location.pathname.includes('register.html');
    if (!user && !isAuthPage) {
        // Ajustar ruta según profundidad
        const prefix = window.location.pathname.includes('/pages/') ? '../../' : '';
        window.location.href = `${prefix}pages/login/login.html`;
        return;
    }

    if (user) {
        initGlobalUI(user);
    }
});

function initGlobalUI(user) {
    // 2. Actualizar Header (Avatar y Nombre)
    const avatarImgs = document.querySelectorAll('#user-avatar img');
    const nameElements = document.querySelectorAll('#user-name');
    
    const avatarUrl = user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=83133F&color=fff`;
    
    avatarImgs.forEach(img => {
        img.src = avatarUrl;
        img.alt = `Avatar de ${user.name}`;
    });

    nameElements.forEach(el => {
        el.textContent = user.name;
    });

    // 3. Inyectar Modal de Ajustes si no existe
    if (!document.getElementById('settingsModal')) {
        injectSettingsModal();
    }

    // 4. Lógica del Dropdown de Perfil
    const btnAvatar = document.getElementById('user-avatar');
    const profileDropdown = document.getElementById('profileDropdown');

    if (btnAvatar && profileDropdown) {
        btnAvatar.addEventListener('click', (e) => {
            e.stopPropagation();
            const isHidden = profileDropdown.style.display === 'none' || profileDropdown.style.display === '';
            profileDropdown.style.display = isHidden ? 'block' : 'none';
        });

        window.addEventListener('click', () => {
            profileDropdown.style.display = 'none';
        });
    }

    // 5. Lógica de Logout
    const logoutBtns = document.querySelectorAll('#dropdown-logout, .btn-cerrar-sesión');
    logoutBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            User.logout();
            const prefix = window.location.pathname.includes('/pages/') ? '../../' : '';
            window.location.href = `${prefix}pages/login/login.html`;
        });
    });

    // 6. Lógica de Abrir Modal de Ajustes
    const settingsBtn = document.querySelector('.dropdown-item[href="#"], #btn-settings');
    const modal = document.getElementById('settingsModal');
    
    // Encontrar el link de Ajustes (usualmente el segundo en el dropdown)
    const dropdownItems = document.querySelectorAll('.dropdown-item');
    dropdownItems.forEach(item => {
        if (item.textContent.trim() === 'Ajustes') {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                openSettingsModal(user);
            });
        }
    });

    setupModalLogic(user, modal);
}

function injectSettingsModal() {
    const modalHTML = `
    <div id="settingsModal" class="modal-aura" style="display: none; position: fixed; z-index: 2000; left: 0; top: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); backdrop-filter: blur(5px); align-items: center; justify-content: center;">
        <div class="modal-content-aura" style="background: white; margin: auto; padding: 2.5rem; border-radius: 24px; width: 90%; max-width: 500px; box-shadow: 0 20px 50px rgba(0,0,0,0.2); position: relative;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
                <h2 style="font-family: 'Cornella', serif; margin: 0; color: #83133F; font-size: 2rem;">Configuración de Perfil</h2>
                <span id="closeModal" style="cursor: pointer; font-size: 2rem; font-weight: bold; color: #666; line-height: 1;">&times;</span>
            </div>
            
            <form id="settingsForm">
                <div style="margin-bottom: 1.5rem;">
                    <label style="display: block; margin-bottom: 0.5rem; font-weight: 600; color: #333;">Nombre Completo</label>
                    <input type="text" id="edit-name" style="width: 100%; padding: 0.8rem; border: 1px solid #ddd; border-radius: 8px; font-size: 1rem;">
                </div>
                
                <div style="border-top: 1px solid #eee; margin: 1.5rem 0; padding-top: 1rem;">
                    <h3 style="font-size: 1.2rem; color: #83133F; margin-bottom: 1rem; font-family: 'Cornella', serif;">Perfil Menstrual</h3>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                        <div>
                            <label style="display: block; font-size: 0.8rem; font-weight: 700;">EDAD</label>
                            <input type="number" id="edit-age" style="width: 100%; padding: 0.6rem; border: 1px solid #ddd; border-radius: 8px;">
                        </div>
                        <div>
                            <label style="display: block; font-size: 0.8rem; font-weight: 700;">CICLO (DÍAS)</label>
                            <input type="number" id="edit-cycle-len" style="width: 100%; padding: 0.6rem; border: 1px solid #ddd; border-radius: 8px;">
                        </div>
                    </div>
                </div>

                <div style="border-top: 1px solid #eee; margin: 1.5rem 0; padding-top: 1rem;">
                    <h3 style="font-size: 1.2rem; color: #83133F; margin-bottom: 1rem; font-family: 'Cornella', serif;">Seguridad</h3>
                    <div style="display: flex; flex-direction: column; gap: 0.8rem;">
                        <input type="password" id="old-pass" placeholder="Contraseña Actual" style="width: 100%; padding: 0.8rem; border: 1px solid #ddd; border-radius: 8px;">
                        <input type="password" id="new-pass" placeholder="Nueva Contraseña" style="width: 100%; padding: 0.8rem; border: 1px solid #ddd; border-radius: 8px;">
                        <input type="password" id="confirm-pass" placeholder="Confirmar Nueva Contraseña" style="width: 100%; padding: 0.8rem; border: 1px solid #ddd; border-radius: 8px;">
                    </div>
                </div>

                <div style="display: flex; flex-direction: column; gap: 1rem; margin-top: 2rem;">
                    <button type="submit" style="width: 100%; padding: 1rem; border: none; border-radius: 12px; font-weight: bold; background: #83133F; color: white; cursor: pointer; font-size: 1rem; transition: transform 0.2s;">Guardar Cambios</button>
                    <button type="button" id="btn-delete-account" style="width: 100%; padding: 0.8rem; border: 1px solid #B4295D; border-radius: 12px; font-weight: bold; background: transparent; color: #B4295D; cursor: pointer; font-size: 0.9rem;">Eliminar Cuenta</button>
                </div>
            </form>
        </div>
    </div>`;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

function openSettingsModal(user) {
    const modal = document.getElementById('settingsModal');
    document.getElementById('edit-name').value = user.name;
    
    // Cargar datos del perfil menstrual
    if (user.menstrualProfile) {
        document.getElementById('edit-age').value = user.menstrualProfile.age;
        document.getElementById('edit-cycle-len').value = user.menstrualProfile.averageCycleDuration;
    }

    modal.style.display = 'flex';
}

function setupModalLogic(user, modal) {
    const closeModal = document.getElementById('closeModal');
    const settingsForm = document.getElementById('settingsForm');
    const deleteBtn = document.getElementById('btn-delete-account');

    if (closeModal) {
        closeModal.onclick = () => modal.style.display = 'none';
    }

    window.addEventListener('click', (event) => {
        if (event.target == modal) modal.style.display = 'none';
    });

    if (settingsForm) {
        settingsForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const newName = document.getElementById('edit-name').value;
            const newAge = document.getElementById('edit-age').value;
            const newCycleLen = document.getElementById('edit-cycle-len').value;
            const oldPass = document.getElementById('old-pass').value;
            const newPass = document.getElementById('new-pass').value;
            const confirmPass = document.getElementById('confirm-pass').value;

            let updated = false;

            // Actualizar nombre
            if (newName !== user.name) {
                user.updateProfile({ name: newName });
                updated = true;
            }

            // Actualizar Perfil Menstrual
            if (user.menstrualProfile) {
                const p = user.menstrualProfile;
                if (parseInt(newAge) !== p.age || parseInt(newCycleLen) !== p.averageCycleDuration) {
                    p.update({
                        age: newAge,
                        averageCycleDuration: newCycleLen
                    });
                    User.saveToLocalStorage(user);
                    updated = true;
                }
            }

            // Cambiar contraseña si se llenaron los campos
            if (oldPass && newPass) {
                if (newPass !== confirmPass) {
                    alert('Las contraseñas no coinciden.');
                    return;
                }
                if (user.changePassword(oldPass, newPass)) {
                    updated = true;
                } else {
                    alert('La contraseña actual es incorrecta.');
                    return;
                }
            }
            
            if (updated) {
                alert('Información actualizada correctamente.');
                location.reload();
            }
            modal.style.display = 'none';
        });
    }

    if (deleteBtn) {
        deleteBtn.onclick = () => {
            if (confirm('¿Estás seguro de que deseas eliminar tu cuenta? Esta acción es irreversible.')) {
                const directory = JSON.parse(localStorage.getItem('usersDirectory')) || [];
                const updatedDir = directory.filter(id => id !== user.id);
                localStorage.setItem('usersDirectory', JSON.stringify(updatedDir));
                localStorage.removeItem(`user_${user.id}`);
                localStorage.removeItem('currentUser');
                alert('Cuenta eliminada correctamente.');
                const prefix = window.location.pathname.includes('/pages/') ? '../../' : '';
                window.location.href = `${prefix}pages/login/login.html`;
            }
        };
    }
}
