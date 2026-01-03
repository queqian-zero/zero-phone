/* Image Editor - 图片编辑功能 */

class ImageEditor {
    constructor() {
        this.modal = null;
        this.currentImageElement = null;
        this.currentKey = null;
        this.currentDefaultImage = null;
        
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
                img.element.addEventListener('click', () => {
                    this.showSourcePicker(img.element, key, img.default, img.name);
                });
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
    
    // 从相册选择（下一阶段实现）
    selectFromAlbum() {
        alert('相册选择功能将在下一阶段实现！');
        this.closeModal();
    }
    
    // 应用图片
    applyImage(imageData, type) {
        // 更新DOM
        this.currentImageElement.style.backgroundImage = `url('${imageData}')`;
        
        // 保存到 localStorage
        this.saveToStorage(this.currentKey, imageData, type);
        
        console.log(`✅ 图片已更新: ${this.currentKey}`);
    }
    
    // 保存到 localStorage
    saveToStorage(key, data, type) {
        try {
            let storage = JSON.parse(localStorage.getItem('page2Data') || '{}');
            if (!storage.images) storage.images = {};
            
            storage.images[key] = {
                type: type,  // 'url' 或 'base64'
                data: data
            };
            
            localStorage.setItem('page2Data', JSON.stringify(storage));
        } catch (e) {
            console.error('❌ 保存失败:', e);
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
        
        // 恢复底部按钮显示
        setTimeout(() => {
            this.modal.querySelector('.modal-footer').style.display = 'flex';
        }, 300);
    }
}

// 初始化
let imageEditorInstance = null;

function initImageEditor() {
    if (!imageEditorInstance) {
        imageEditorInstance = new ImageEditor();
        // 页面加载时恢复数据
        setTimeout(() => {
            imageEditorInstance.loadFromStorage();
        }, 500);
    }
    return imageEditorInstance;
}
