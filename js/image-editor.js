/* Image Editor - 图片编辑功能 */

class ImageEditor {
    constructor() {
        this.modal = null;
        this.currentImageElement = null;
        this.currentKey = null;
        this.currentDefaultImage = null;
        this.currentFile = null;
        
        this.init();
    }
    
    init() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setup());
        } else {
            this.setup();
        }
    }
    
    setup() {
        this.modal = document.getElementById('editModal');
        
        if (!this.modal) {
            console.error('❌ 找不到编辑弹窗');
            return;
        }
        
        // 创建toast容器
        this.createToast();
        
        // 绑定图片点击事件
        this.bindImageElements();
        
        console.log('✅ 图片编辑器初始化完成');
    }
    
    // 创建toast提示容器
    createToast() {
        const toast = document.createElement('div');
        toast.id = 'debugToast';
        toast.style.cssText = `
            position: fixed;
            top: 80px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0, 0, 0, 0.85);
            color: white;
            padding: 12px 20px;
            border-radius: 12px;
            font-size: 14px;
            z-index: 10000;
            opacity: 0;
            pointer-events: none;
            transition: opacity 0.3s ease;
            max-width: 80%;
            text-align: center;
            backdrop-filter: blur(10px);
            -webkit-backdrop-filter: blur(10px);
        `;
        document.body.appendChild(toast);
        this.toast = toast;
    }
    
    // 显示toast提示
    showToast(message, duration = 2000) {
        this.toast.textContent = message;
        this.toast.style.opacity = '1';
        
        setTimeout(() => {
            this.toast.style.opacity = '0';
        }, duration);
    }
    
    // 绑定图片元素的点击事件
    bindImageElements() {
        const images = {
            'circleLeft': {
                element: document.querySelector('.circle-left'),
                default: 'assets/images/page2-circle-left.png',
                name: '左侧头像'
            },
            'circleRight': {
                element: document.querySelector('.circle-right'),
                default: 'assets/images/page2-circle-right.png',
                name: '右侧头像'
            },
            'imageLarge': {
                element: document.querySelector('.widget-image.large'),
                default: 'assets/images/page2-large.png',
                name: '竖长图片'
            },
            'imageSmall': {
                element: document.querySelector('.widget-image.small'),
                default: 'assets/images/page2-small.jpg',
                name: '横长图片'
            }
        };
        
        Object.keys(images).forEach(key => {
            const img = images[key];
            if (img.element) {
                // 点击：显示选择菜单
                img.element.addEventListener('click', () => {
                    this.showImageOptions(img.element, key, img.default, img.name);
                });
            }
        });
        
        console.log('✅ 图片元素事件已绑定');
    }
    
    // 显示图片操作选项
    showImageOptions(element, key, defaultImg, name) {
        this.currentImageElement = element;
        this.currentKey = key;
        this.currentDefaultImage = defaultImg;
        
        const modalTitle = this.modal.querySelector('.modal-title');
        const modalBody = this.modal.querySelector('.modal-body');
        const modalFooter = this.modal.querySelector('.modal-footer');
        
        modalTitle.textContent = `${name}操作`;
        
        modalBody.innerHTML = `
            <div class="modal-options">
                <button class="option-btn" id="optionAlbum">
                    <span class="option-icon">📷</span>
                    <div class="option-text">
                        <div class="option-title">从相册选择</div>
                        <div class="option-desc">选择本地图片文件</div>
                    </div>
                </button>
                
                <button class="option-btn" id="optionURL">
                    <span class="option-icon">🔗</span>
                    <div class="option-text">
                        <div class="option-title">输入图片URL</div>
                        <div class="option-desc">使用网络图片链接</div>
                    </div>
                </button>
                
                <button class="option-btn" id="optionResetImage">
                    <span class="option-icon">🔄</span>
                    <div class="option-text">
                        <div class="option-title">恢复默认</div>
                        <div class="option-desc">恢复默认图片</div>
                    </div>
                </button>
                
                <button class="modal-cancel-btn" id="optionCancelImg">取消</button>
            </div>
        `;
        
        modalFooter.style.display = 'none';
        
        document.getElementById('optionAlbum').addEventListener('click', () => {
            this.selectFromAlbum();
        });
        
        document.getElementById('optionURL').addEventListener('click', () => {
            this.showURLInput();
        });
        
        document.getElementById('optionResetImage').addEventListener('click', () => {
            this.resetImage(element, key, defaultImg, name);
        });
        
        document.getElementById('optionCancelImg').addEventListener('click', () => {
            this.closeModal();
        });
        
        this.modal.classList.add('show');
    }
    
    // 恢复默认图片
    resetImage(element, key, defaultImage, name) {
        const confirm = window.confirm(`确定要恢复默认${name}吗？`);
        
        if (confirm) {
            this.showToast('正在恢复默认图片...');
            
            element.style.backgroundImage = `url('${defaultImage}')`;
            this.removeFromStorage(key);
            
            setTimeout(() => {
                this.showToast(`✅ 已恢复默认${name}！`);
            }, 500);
            
            console.log(`✅ 图片已恢复: ${key} = ${defaultImage}`);
        }
        
        this.closeModal();
    }
    
    // 显示URL输入框
    showURLInput() {
        const modalTitle = this.modal.querySelector('.modal-title');
        const modalBody = this.modal.querySelector('.modal-body');
        const modalFooter = this.modal.querySelector('.modal-footer');
        
        modalTitle.textContent = '输入图片URL';
        
        modalBody.innerHTML = `
            <input type="url" 
                   class="modal-input" 
                   id="urlInput" 
                   placeholder="https://example.com/image.jpg">
        `;
        
        modalFooter.style.display = 'flex';
        
        const cancelBtn = document.getElementById('modalCancel');
        const confirmBtn = document.getElementById('modalConfirm');
        
        const newCancelBtn = cancelBtn.cloneNode(true);
        const newConfirmBtn = confirmBtn.cloneNode(true);
        cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);
        confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
        
        newCancelBtn.addEventListener('click', () => this.closeModal());
        newConfirmBtn.addEventListener('click', () => this.applyURL());
        
        setTimeout(() => {
            document.getElementById('urlInput').focus();
        }, 100);
        
        document.getElementById('urlInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.applyURL();
            }
        });
    }
    
    // 应用URL图片
    applyURL() {
        const urlInput = document.getElementById('urlInput');
        const url = urlInput.value.trim();
        
        if (!url) {
            alert('请输入图片URL！');
            return;
        }
        
        try {
            new URL(url);
        } catch (e) {
            alert('URL格式不正确！');
            return;
        }
        
        this.showToast('正在加载图片...');
        
        const testImg = new Image();
        testImg.onload = () => {
            this.applyImage(url, 'url');
            this.closeModal();
        };
        
        testImg.onerror = () => {
            alert('图片加载失败！请检查URL是否正确。');
        };
        
        testImg.src = url;
    }
    
    // 从相册选择
    selectFromAlbum() {
        const savedElement = this.currentImageElement;
        const savedKey = this.currentKey;
        const savedDefault = this.currentDefaultImage;
        
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = 'image/*';
        fileInput.style.display = 'none';
        
        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                this.currentImageElement = savedElement;
                this.currentKey = savedKey;
                this.currentDefaultImage = savedDefault;
                
                this.handleFileSelected(file);
            }
        });
        
        document.body.appendChild(fileInput);
        fileInput.click();
        document.body.removeChild(fileInput);
        
        this.closeModal();
    }
    
    // 处理选中的文件
    handleFileSelected(file) {
        this.showToast(`文件已选择: ${file.name} (${(file.size/1024).toFixed(1)}KB)`);
        
        if (!file.type.startsWith('image/')) {
            alert('请选择图片文件！');
            return;
        }
        
        if (file.size > 10 * 1024 * 1024) {
            alert('图片太大了！最大支持10MB');
            return;
        }
        
        this.currentFile = file;
        this.showCompressionOptions();
    }
    
    // 显示压缩选项弹窗
    showCompressionOptions() {
        const modalTitle = this.modal.querySelector('.modal-title');
        const modalBody = this.modal.querySelector('.modal-body');
        const modalFooter = this.modal.querySelector('.modal-footer');
        
        modalTitle.textContent = '图片上传选项';
        
        modalBody.innerHTML = `
            <div class="modal-options">
                <button class="option-btn" id="optionCompress">
                    <span class="option-icon">⚡</span>
                    <div class="option-text">
                        <div class="option-title">压缩后上传</div>
                        <div class="option-desc">推荐，节省空间，加载更快</div>
                    </div>
                </button>
                
                <button class="option-btn" id="optionOriginal">
                    <span class="option-icon">📦</span>
                    <div class="option-text">
                        <div class="option-title">原图上传</div>
                        <div class="option-desc">保持原始质量，可能占用较多空间</div>
                    </div>
                </button>
                
                <button class="modal-cancel-btn" id="optionCancel2">取消</button>
            </div>
        `;
        
        modalFooter.style.display = 'none';
        
        document.getElementById('optionCompress').addEventListener('click', () => {
            this.uploadWithCompression();
        });
        
        document.getElementById('optionOriginal').addEventListener('click', () => {
            this.uploadOriginal();
        });
        
        document.getElementById('optionCancel2').addEventListener('click', () => {
            this.currentFile = null;
            this.closeModal();
        });
        
        this.modal.classList.add('show');
    }
    
    // 压缩后上传
    uploadWithCompression() {
        if (!this.currentFile) return;
        
        this.showLoading('正在压缩...');
        
        this.compressImage(this.currentFile, (compressedBase64) => {
            this.showToast('压缩完成！');
            this.applyImage(compressedBase64, 'base64');
            this.currentFile = null;
            this.modal.classList.remove('show');
        });
    }
    
    // 原图上传
    uploadOriginal() {
        if (!this.currentFile) return;
        
        this.showLoading('正在处理...');
        
        const reader = new FileReader();
        reader.onload = (e) => {
            this.showToast('读取完成！');
            const base64 = e.target.result;
            this.applyImage(base64, 'base64');
            this.currentFile = null;
            this.modal.classList.remove('show');
        };
        
        reader.onerror = () => {
            alert('图片读取失败！');
            this.closeModal();
        };
        
        reader.readAsDataURL(this.currentFile);
    }
    
    // 压缩图片
    compressImage(file, callback) {
        const reader = new FileReader();
        
        reader.onload = (e) => {
            const img = new Image();
            
            img.onload = () => {
                let maxWidth, maxHeight, quality;
                
                if (this.currentKey.includes('circle')) {
                    maxWidth = 300;
                    maxHeight = 300;
                    quality = 0.85;
                } else if (this.currentKey === 'imageLarge') {
                    maxWidth = 500;
                    maxHeight = 1000;
                    quality = 0.80;
                } else {
                    maxWidth = 1000;
                    maxHeight = 300;
                    quality = 0.80;
                }
                
                let width = img.width;
                let height = img.height;
                
                if (width > maxWidth || height > maxHeight) {
                    const ratio = Math.min(maxWidth / width, maxHeight / height);
                    width = Math.round(width * ratio);
                    height = Math.round(height * ratio);
                }
                
                this.showToast(`压缩尺寸: ${width}x${height}`, 1500);
                
                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                
                const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
                
                callback(compressedBase64);
            };
            
            img.onerror = () => {
                alert('图片加载失败！');
                this.closeModal();
            };
            
            img.src = e.target.result;
        };
        
        reader.onerror = () => {
            alert('文件读取失败！');
            this.closeModal();
        };
        
        reader.readAsDataURL(file);
    }
    
    // 显示加载提示
    showLoading(message) {
        const modalTitle = this.modal.querySelector('.modal-title');
        const modalBody = this.modal.querySelector('.modal-body');
        const modalFooter = this.modal.querySelector('.modal-footer');
        
        modalTitle.textContent = message;
        modalBody.innerHTML = `
            <div style="text-align: center; padding: 40px 20px;">
                <div style="font-size: 48px; margin-bottom: 16px;">⏳</div>
                <div style="color: var(--color-text-secondary);">请稍候...</div>
            </div>
        `;
        modalFooter.style.display = 'none';
    }
    
    // 应用图片
    applyImage(imageData, type) {
        this.showToast(`应用图片 (${type})...`);
        
        this.currentImageElement.style.backgroundImage = `url('${imageData}')`;
        this.saveToStorage(this.currentKey, imageData, type);
        
        setTimeout(() => {
            this.showToast('✅ 图片已应用！');
        }, 500);
    }
    
    // 保存到 localStorage
    saveToStorage(key, data, type) {
        try {
            let storage = JSON.parse(localStorage.getItem('page2Data') || '{}');
            if (!storage.images) storage.images = {};
            
            storage.images[key] = {
                type: type,
                data: data
            };
            
            localStorage.setItem('page2Data', JSON.stringify(storage));
        } catch (e) {
            alert('存储失败: ' + e.message);
        }
    }
    
    // 从 localStorage 加载
    loadFromStorage() {
        try {
            const storage = JSON.parse(localStorage.getItem('page2Data') || '{}');
            if (!storage.images) return;
            
            const images = {
                'circleLeft': document.querySelector('.circle-left'),
                'circleRight': document.querySelector('.circle-right'),
                'imageLarge': document.querySelector('.widget-image.large'),
                'imageSmall': document.querySelector('.widget-image.small')
            };
            
            Object.keys(storage.images).forEach(key => {
                const img = storage.images[key];
                const element = images[key];
                
                if (element && img.data) {
                    element.style.backgroundImage = `url('${img.data}')`;
                }
            });
            
            console.log('✅ 图片数据已加载');
        } catch (e) {
            console.error('❌ 加载失败:', e);
        }
    }
    
    // 关闭弹窗
    closeModal() {
        this.modal.classList.remove('show');
        this.currentImageElement = null;
        this.currentKey = null;
        this.currentDefaultImage = null;
        
        setTimeout(() => {
            this.modal.querySelector('.modal-footer').style.display = 'flex';
        }, 300);
    }
    
    // 从localStorage删除
    removeFromStorage(key) {
        try {
            let storage = JSON.parse(localStorage.getItem('page2Data') || '{}');
            if (storage.images && storage.images[key]) {
                delete storage.images[key];
                localStorage.setItem('page2Data', JSON.stringify(storage));
            }
        } catch (e) {
            console.error('❌ 删除失败:', e);
        }
    }
}

// 初始化
let imageEditorInstance = null;

function initImageEditor() {
    if (!imageEditorInstance) {
        imageEditorInstance = new ImageEditor();
        setTimeout(() => {
            imageEditorInstance.loadFromStorage();
        }, 500);
    }
    return imageEditorInstance;
}