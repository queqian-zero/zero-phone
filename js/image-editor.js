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
        
        // 绑定图片点击事件
        this.bindImageElements();
        
        console.log('✅ 图片编辑器初始化完成');
    }
    
    // 绑定图片元素的点击事件
    bindImageElements() {
        // 第2页的4个图片组件
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
                alert(`绑定图片: ${img.name}`); // 调试：确认绑定
                
                // 短按：选择图片
                img.element.addEventListener('click', (e) => {
                    alert(`点击了: ${img.name}`); // 调试
                    this.showSourcePicker(img.element, key, img.default, img.name);
                });
                
                // 长按：恢复默认
                this.addLongPressListener(img.element, () => {
                    alert(`长按了: ${img.name}`); // 调试
                    this.confirmReset(img.element, key, img.default, img.name);
                });
            } else {
                alert(`找不到图片元素: ${img.name}`); // 调试
            }
        });
        
        console.log('✅ 图片元素事件已绑定');
    }
    
    // 显示来源选择弹窗
    showSourcePicker(element, key, defaultImg, name) {
        this.currentImageElement = element;
        this.currentKey = key;
        this.currentDefaultImage = defaultImg;
        
        // 设置弹窗内容
        const modalTitle = this.modal.querySelector('.modal-title');
        const modalBody = this.modal.querySelector('.modal-body');
        
        modalTitle.textContent = `更换${name}`;
        
        // 创建选项列表
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
                
                <button class="modal-cancel-btn" id="optionCancel">取消</button>
            </div>
        `;
        
        // 隐藏底部按钮栏
        this.modal.querySelector('.modal-footer').style.display = 'none';
        
        // 绑定选项事件
        document.getElementById('optionAlbum').addEventListener('click', () => {
            this.selectFromAlbum();
        });
        
        document.getElementById('optionURL').addEventListener('click', () => {
            this.showURLInput();
        });
        
        document.getElementById('optionCancel').addEventListener('click', () => {
            this.closeModal();
        });
        
        // 显示弹窗
        this.modal.classList.add('show');
    }
    
    // 显示URL输入框
    showURLInput() {
        const modalTitle = this.modal.querySelector('.modal-title');
        const modalBody = this.modal.querySelector('.modal-body');
        const modalFooter = this.modal.querySelector('.modal-footer');
        
        modalTitle.textContent = '输入图片URL';
        
        // 创建输入框
        modalBody.innerHTML = `
            <input type="url" 
                   class="modal-input" 
                   id="urlInput" 
                   placeholder="https://example.com/image.jpg">
        `;
        
        // 显示底部按钮
        modalFooter.style.display = 'flex';
        
        // 重新绑定按钮
        const cancelBtn = document.getElementById('modalCancel');
        const confirmBtn = document.getElementById('modalConfirm');
        
        // 移除旧事件
        const newCancelBtn = cancelBtn.cloneNode(true);
        const newConfirmBtn = confirmBtn.cloneNode(true);
        cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);
        confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
        
        // 绑定新事件
        newCancelBtn.addEventListener('click', () => this.closeModal());
        newConfirmBtn.addEventListener('click', () => this.applyURL());
        
        // 自动聚焦
        setTimeout(() => {
            document.getElementById('urlInput').focus();
        }, 100);
        
        // 回车保存
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
        
        // 验证
        if (!url) {
            alert('请输入图片URL！');
            return;
        }
        
        // 简单验证URL格式
        try {
            new URL(url);
        } catch (e) {
            alert('URL格式不正确！');
            return;
        }
        
        // 测试图片能否加载
        const testImg = new Image();
        testImg.onload = () => {
            // 加载成功，应用图片
            this.applyImage(url, 'url');
            this.closeModal();
        };
        
        testImg.onerror = () => {
            // 加载失败
            alert('图片加载失败！请检查URL是否正确。');
        };
        
        testImg.src = url;
    }
    
    // 从相册选择
    selectFromAlbum() {
        // 先保存当前上下文（重要！）
        const savedElement = this.currentImageElement;
        const savedKey = this.currentKey;
        const savedDefault = this.currentDefaultImage;
        
        // 创建隐藏的文件输入框
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = 'image/*';
        fileInput.style.display = 'none';
        
        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                // 恢复上下文（重要！）
                this.currentImageElement = savedElement;
                this.currentKey = savedKey;
                this.currentDefaultImage = savedDefault;
                
                this.handleFileSelected(file);
            }
        });
        
        // 触发文件选择
        document.body.appendChild(fileInput);
        fileInput.click();
        document.body.removeChild(fileInput);
        
        // 先关闭弹窗
        this.closeModal();
    }
    
    // 处理选中的文件
    handleFileSelected(file) {
        alert(`文件已选择: ${file.name}, 大小: ${(file.size/1024).toFixed(1)}KB`);
        
        // 验证文件类型
        if (!file.type.startsWith('image/')) {
            alert('请选择图片文件！');
            return;
        }
        
        // 验证文件大小（最大10MB）
        if (file.size > 10 * 1024 * 1024) {
            alert('图片太大了！最大支持10MB');
            return;
        }
        
        // 保存文件引用
        this.currentFile = file;
        
        // 显示压缩选项弹窗
        this.showCompressionOptions();
    }
    
    // 显示压缩选项弹窗
    showCompressionOptions() {
        const modalTitle = this.modal.querySelector('.modal-title');
        const modalBody = this.modal.querySelector('.modal-body');
        const modalFooter = this.modal.querySelector('.modal-footer');
        
        modalTitle.textContent = '图片上传选项';
        
        // 创建选项列表
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
        
        // 隐藏底部按钮
        modalFooter.style.display = 'none';
        
        // 绑定事件
        document.getElementById('optionCompress').addEventListener('click', () => {
            alert('开始压缩...');
            this.uploadWithCompression();
        });
        
        document.getElementById('optionOriginal').addEventListener('click', () => {
            alert('开始原图上传...');
            this.uploadOriginal();
        });
        
        document.getElementById('optionCancel2').addEventListener('click', () => {
            this.currentFile = null;
            this.closeModal();
        });
        
        // 显示弹窗
        this.modal.classList.add('show');
    }
    
    // 压缩后上传
    uploadWithCompression() {
        if (!this.currentFile) {
            alert('没有文件！');
            return;
        }
        
        try {
            this.showLoading('正在压缩...');
            
            this.compressImage(this.currentFile, (compressedBase64) => {
                alert('压缩完成！准备应用...');
                this.applyImage(compressedBase64, 'base64');
                this.currentFile = null;
                alert('应用完成！准备关闭...');
                this.modal.classList.remove('show');
            });
        } catch (e) {
            alert('压缩失败: ' + e.message);
            this.closeModal();
        }
    }
    
    // 原图上传
    uploadOriginal() {
        if (!this.currentFile) {
            alert('没有文件！');
            return;
        }
        
        try {
            this.showLoading('正在处理...');
            
            const reader = new FileReader();
            reader.onload = (e) => {
                alert('读取完成！准备应用...');
                const base64 = e.target.result;
                this.applyImage(base64, 'base64');
                this.currentFile = null;
                alert('应用完成！准备关闭...');
                this.modal.classList.remove('show');
            };
            
            reader.onerror = (e) => {
                alert('图片读取失败: ' + e);
                this.closeModal();
            };
            
            reader.readAsDataURL(this.currentFile);
        } catch (e) {
            alert('处理失败: ' + e.message);
            this.closeModal();
        }
    }
    
    // 压缩图片
    compressImage(file, callback) {
        try {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                const img = new Image();
                
                img.onload = () => {
                    try {
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
                        
                        alert(`压缩尺寸: ${width}x${height}`);
                        
                        const canvas = document.createElement('canvas');
                        canvas.width = width;
                        canvas.height = height;
                        
                        const ctx = canvas.getContext('2d');
                        ctx.drawImage(img, 0, 0, width, height);
                        
                        const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
                        
                        alert('base64生成成功！');
                        
                        callback(compressedBase64);
                    } catch (e) {
                        alert('Canvas处理失败: ' + e.message);
                    }
                };
                
                img.onerror = (e) => {
                    alert('图片加载失败！');
                };
                
                img.src = e.target.result;
            };
            
            reader.onerror = (e) => {
                alert('文件读取失败！');
            };
            
            reader.readAsDataURL(file);
        } catch (e) {
            alert('压缩过程失败: ' + e.message);
        }
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
        try {
            alert(`应用图片: ${type}, 数据长度: ${imageData.length}`);
            
            this.currentImageElement.style.backgroundImage = `url('${imageData}')`;
            
            this.saveToStorage(this.currentKey, imageData, type);
            
            alert('图片已应用！');
        } catch (e) {
            alert('应用图片失败: ' + e.message);
        }
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
            alert('已保存到localStorage！');
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
    
    // 添加长按监听
    addLongPressListener(element, callback) {
        let pressTimer = null;
        let isLongPress = false;
        
        const startPress = (e) => {
            isLongPress = false;
            pressTimer = setTimeout(() => {
                isLongPress = true;
                callback();
            }, 800);
        };
        
        const cancelPress = () => {
            if (pressTimer) {
                clearTimeout(pressTimer);
                pressTimer = null;
            }
        };
        
        const handleClick = (e) => {
            if (isLongPress) {
                e.stopPropagation();
                e.preventDefault();
                isLongPress = false;
            }
        };
        
        element.addEventListener('touchstart', startPress);
        element.addEventListener('touchend', cancelPress);
        element.addEventListener('touchcancel', cancelPress);
        element.addEventListener('touchmove', cancelPress);
        
        element.addEventListener('click', handleClick, true);
    }
    
    // 确认恢复默认图片
    confirmReset(element, key, defaultImage, name) {
        const confirm = window.confirm(`确定要恢复默认${name}吗？`);
        
        if (confirm) {
            alert('开始恢复默认图片...');
            
            element.style.backgroundImage = `url('${defaultImage}')`;
            
            this.removeFromStorage(key);
            
            alert(`✅ 已恢复默认${name}！`);
            
            console.log(`✅ 图片已恢复: ${key} = ${defaultImage}`);
        }
    }
    
    // 从localStorage删除
    removeFromStorage(key) {
        try {
            let storage = JSON.parse(localStorage.getItem('page2Data') || '{}');
            if (storage.images && storage.images[key]) {
                delete storage.images[key];
                localStorage.setItem('page2Data', JSON.stringify(storage));
                alert('已从localStorage删除！');
            }
        } catch (e) {
            alert('删除失败: ' + e.message);
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