/* Text Editor - 文字编辑功能 */

class TextEditor {
    constructor() {
        this.modal = null;
        this.modalInput = null;
        this.currentTextElement = null;
        this.currentKey = null;
        
        this.init();
    }
    
    init() {
        // 等待DOM加载
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setup());
        } else {
            this.setup();
        }
    }
    
    setup() {
        // 获取弹窗元素
        this.modal = document.getElementById('editModal');
        this.modalInput = document.getElementById('modalInput');
        const modalCancel = document.getElementById('modalCancel');
        const modalConfirm = document.getElementById('modalConfirm');
        
        if (!this.modal) {
            console.error('❌ 找不到编辑弹窗');
            return;
        }
        
        // 绑定按钮事件
        modalCancel.addEventListener('click', () => this.closeModal());
        modalConfirm.addEventListener('click', () => this.saveText());
        
        // 点击背景关闭
        this.modal.querySelector('.modal-backdrop').addEventListener('click', () => this.closeModal());
        
        // 回车保存
        this.modalInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.saveText();
            }
        });
        
        // 绑定文字点击事件
        this.bindTextElements();
        
        console.log('✅ 文字编辑器初始化完成');
    }
    
    // 绑定文字元素的点击事件
bindTextElements() {
    // 第2页的两句话
    const text1 = document.querySelector('.row-1 .custom-text');
    const text2 = document.querySelector('.row-2 .custom-text');
    
    // 默认文字
    const defaultTexts = {
        'page2Text1': '突破次元遇见你',
        'page2Text2': '跨越次元爱上你'
    };
    
    if (text1) {
        // 短按：编辑
        text1.addEventListener('click', () => {
            this.openModal(text1, 'page2Text1', '编辑文字');
        });
        
        // 长按：恢复默认
        this.addLongPressListener(text1, () => {
            this.confirmReset(text1, 'page2Text1', defaultTexts['page2Text1'], '文字');
        });
    }
    
    if (text2) {
        // 短按：编辑
        text2.addEventListener('click', () => {
            this.openModal(text2, 'page2Text2', '编辑文字');
        });
        
        // 长按：恢复默认
        this.addLongPressListener(text2, () => {
            this.confirmReset(text2, 'page2Text2', defaultTexts['page2Text2'], '文字');
        });
    }
    
    console.log('✅ 文字元素事件已绑定');
}
    
    // 打开弹窗
    openModal(textElement, storageKey, title = '编辑文字') {
        this.currentTextElement = textElement;
        this.currentKey = storageKey;
        
        // 设置弹窗内容
        document.getElementById('modalTitle').textContent = title;
        this.modalInput.value = textElement.textContent;
        
        // 显示弹窗
        this.modal.classList.add('show');
        
        // 自动聚焦并选中文字
        setTimeout(() => {
            this.modalInput.focus();
            this.modalInput.select();
        }, 100);
    }
    
    // 关闭弹窗
    closeModal() {
        this.modal.classList.remove('show');
        this.currentTextElement = null;
        this.currentKey = null;
        this.modalInput.value = '';
    }
    
    // 保存文字
    saveText() {
        const newText = this.modalInput.value.trim();
        
        // 验证
        if (!newText) {
            alert('文字不能为空！');
            return;
        }
        
        if (newText.length > 20) {
            alert('文字太长了！最多20个字');
            return;
        }
        
        // 更新DOM
        this.currentTextElement.textContent = newText;
        
        // 保存到 localStorage
        this.saveToStorage(this.currentKey, newText);
        
        // 关闭弹窗
        this.closeModal();
        
        console.log(`✅ 文字已保存: ${this.currentKey} = ${newText}`);
    }
    
    // 保存到 localStorage
    saveToStorage(key, value) {
        try {
            let data = JSON.parse(localStorage.getItem('page2Data') || '{}');
            if (!data.texts) data.texts = {};
            data.texts[key] = value;
            localStorage.setItem('page2Data', JSON.stringify(data));
        } catch (e) {
            console.error('❌ 保存失败:', e);
        }
    }
    
    // 从 localStorage 加载
    loadFromStorage() {
        try {
            const data = JSON.parse(localStorage.getItem('page2Data') || '{}');
            if (!data.texts) return;
            
            // 恢复第1句
            const text1 = document.querySelector('.row-1 .custom-text');
            if (text1 && data.texts.page2Text1) {
                text1.textContent = data.texts.page2Text1;
            }
            
            // 恢复第2句
            const text2 = document.querySelector('.row-2 .custom-text');
            if (text2 && data.texts.page2Text2) {
                text2.textContent = data.texts.page2Text2;
            }
            
            console.log('✅ 文字数据已加载');
        } catch (e) {
            console.error('❌ 加载失败:', e);
        }
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
        }, 800); // 长按800毫秒触发
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
    
    // 防止长按后触发点击
    element.addEventListener('click', handleClick, true);
}

// 确认恢复默认
confirmReset(element, key, defaultValue, type) {
    const confirm = window.confirm(`确定要恢复默认${type}吗？\n\n默认值：${defaultValue}`);
    
    if (confirm) {
        // 恢复DOM
        element.textContent = defaultValue;
        
        // 清除localStorage
        this.removeFromStorage(key);
        
        alert(`✅ 已恢复默认${type}！`);
        
        console.log(`✅ ${type}已恢复: ${key} = ${defaultValue}`);
    }
}

// 从localStorage删除
removeFromStorage(key) {
    try {
        let data = JSON.parse(localStorage.getItem('page2Data') || '{}');
        if (data.texts && data.texts[key]) {
            delete data.texts[key];
            localStorage.setItem('page2Data', JSON.stringify(data));
        }
    } catch (e) {
        console.error('❌ 删除失败:', e);
    }
}
}

// 初始化
let textEditorInstance = null;

function initTextEditor() {
    if (!textEditorInstance) {
        textEditorInstance = new TextEditor();
        // 页面加载时恢复数据
        setTimeout(() => {
            textEditorInstance.loadFromStorage();
        }, 500);
    }
    return textEditorInstance;
}
