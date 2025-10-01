/**
 * i18n Localization System for Plexus Mesh Motion
 * Supports EN, RU, DE, ES, IT, FR
 */

class I18nManager {
  constructor() {
    this.supportedLanguages = ['en', 'ru', 'de', 'es', 'it', 'fr'];
    this.defaultLanguage = 'en';
    this.currentLanguage = this.defaultLanguage;
    this.translations = {};
    this.fallbackTranslations = {}; // Store English as fallback
  }

  /**
   * Initialize the i18n system
   */
  async init() {
    // Determine language preference
    this.currentLanguage = this.detectLanguage();
    
    // Load translations
    await this.loadTranslations(this.currentLanguage);
    
    // Load fallback translations (English)
    if (this.currentLanguage !== this.defaultLanguage) {
      await this.loadTranslations(this.defaultLanguage, true);
    }
    
    // Apply translations
    this.applyTranslations();
    
    // Update HTML lang attribute
    document.documentElement.lang = this.currentLanguage;
    
    // Create language selector
    this.createLanguageSelector();
    
    // Save current language to localStorage
    this.saveLanguagePreference();
    
    // Update URL parameter
    this.updateUrlParameter();
  }

  /**
   * Detect language preference in this order:
   * 1. URL parameter ?lang=xx
   * 2. localStorage preference
   * 3. browser language
   */
  detectLanguage() {
    // Check URL parameter
    const urlParams = new URLSearchParams(window.location.search);
    const urlLang = urlParams.get('lang');
    if (urlLang && this.supportedLanguages.includes(urlLang)) {
      return urlLang;
    }
    
    // Check localStorage
    const savedLang = localStorage.getItem('plexus.language');
    if (savedLang && this.supportedLanguages.includes(savedLang)) {
      return savedLang;
    }
    
    // Check browser language
    const browserLang = navigator.language.substring(0, 2);
    if (this.supportedLanguages.includes(browserLang)) {
      return browserLang;
    }
    
    // Default to English
    return this.defaultLanguage;
  }

  /**
   * Load translation file
   */
  async loadTranslations(lang, isFallback = false) {
    try {
      const response = await fetch(`i18n/${lang}.json`, { 
        cache: 'no-store' // Disable cache during development
      });
      
      if (!response.ok) {
        throw new Error(`Failed to load ${lang} translations`);
      }
      
      const data = await response.json();
      
      if (isFallback) {
        this.fallbackTranslations = data;
      } else {
        this.translations = data;
      }
      
      return data;
    } catch (error) {
      console.warn(`Failed to load ${lang} translations:`, error);
      return {};
    }
  }

  /**
   * Get translated string by key
   */
  t(key) {
    // Try to get translation from current language
    let translation = this.getNestedProperty(this.translations, key);
    
    // If not found and not already in fallback, try fallback
    if ((!translation || translation === key) && this.currentLanguage !== this.defaultLanguage) {
      translation = this.getNestedProperty(this.fallbackTranslations, key);
    }
    
    // If still not found, return the key itself
    return translation || key;
  }

  /**
   * Helper to get nested property from object
   */
  getNestedProperty(obj, key) {
    return key.split('.').reduce((o, k) => (o && o[k] !== undefined) ? o[k] : null, obj);
  }

  /**
   * Apply translations to all elements with data-i18n attribute
   */
  applyTranslations() {
    // Update page title
    if (this.translations.meta && this.translations.meta.title) {
      document.title = this.translations.meta.title;
    }
    
    // Update all elements with data-i18n attribute
    const elements = document.querySelectorAll('[data-i18n]');
    elements.forEach(element => {
      const key = element.getAttribute('data-i18n');
      const translation = this.t(key);
      
      // Check if we need to update a specific attribute
      const attr = element.getAttribute('data-i18n-attr');
      if (attr) {
        element.setAttribute(attr, translation);
      } else {
        // Update text content
        element.textContent = translation;
      }
    });
  }

  /**
   * Create language selector in HUD
   */
  createLanguageSelector() {
    // Create select element
    const select = document.createElement('select');
    select.id = 'langSelect';
    select.className = 'btn';
    
    // Add options
    const languages = {
      'en': 'English',
      'ru': 'Русский',
      'de': 'Deutsch',
      'es': 'Español',
      'it': 'Italiano',
      'fr': 'Français'
    };
    
    Object.keys(languages).forEach(lang => {
      const option = document.createElement('option');
      option.value = lang;
      option.textContent = languages[lang];
      if (lang === this.currentLanguage) {
        option.selected = true;
      }
      select.appendChild(option);
    });
    
    // Add event listener
    select.addEventListener('change', (e) => {
      this.switchLanguage(e.target.value);
    });
    
    // Add to HUD
    const hud = document.querySelector('.hud');
    if (hud) {
      hud.insertBefore(select, hud.firstChild);
    }
  }

  /**
   * Switch to a different language
   */
  async switchLanguage(lang) {
    if (!this.supportedLanguages.includes(lang)) {
      console.warn(`Language ${lang} is not supported`);
      return;
    }
    
    this.currentLanguage = lang;
    
    // Load new translations
    await this.loadTranslations(lang);
    
    // Apply translations
    this.applyTranslations();
    
    // Update HTML lang attribute
    document.documentElement.lang = lang;
    
    // Save preference
    this.saveLanguagePreference();
    
    // Update URL
    this.updateUrlParameter();
  }

  /**
   * Save language preference to localStorage
   */
  saveLanguagePreference() {
    try {
      localStorage.setItem('plexus.language', this.currentLanguage);
    } catch (error) {
      console.warn('Failed to save language preference:', error);
    }
  }

  /**
   * Update URL parameter to reflect current language
   */
  updateUrlParameter() {
    try {
      const url = new URL(window.location);
      url.searchParams.set('lang', this.currentLanguage);
      window.history.replaceState({}, '', url);
    } catch (error) {
      console.warn('Failed to update URL parameter:', error);
    }
  }
}

// Initialize i18n when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
  window.i18n = new I18nManager();
  await window.i18n.init();
});