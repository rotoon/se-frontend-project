// Language Management Module
export class LanguageManager {
    static currentLanguage = 'th';
    static supportedLanguages = ['th', 'en', 'zh', 'ja'];

    static getCurrentLanguage() {
        return this.currentLanguage || localStorage.getItem('language') || 'th';
    }

    static setLanguage(language) {
        if (this.supportedLanguages.includes(language)) {
            this.currentLanguage = language;
            localStorage.setItem('language', language);
            
            // Dispatch language change event
            window.dispatchEvent(new CustomEvent('languageChange', {
                detail: { language }
            }));
            
            return true;
        }
        return false;
    }

    static translate(textObj, language = null) {
        if (!textObj) return '';
        if (typeof textObj === 'string') return textObj;
        
        const lang = language || this.getCurrentLanguage();
        return textObj[lang] || textObj.th || textObj.en || '';
    }

    static init() {
        // Initialize with saved language or default
        const savedLang = localStorage.getItem('language');
        if (savedLang && this.supportedLanguages.includes(savedLang)) {
            this.currentLanguage = savedLang;
        }
    }
}

// Initialize on module load
LanguageManager.init();