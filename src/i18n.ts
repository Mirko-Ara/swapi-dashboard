import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

const resources = {
    en: {
        translation: {
            dashboardTitle: 'SWAPI Dashboard',
            toggleMenu: 'Toggle Menu',
            dashboard: 'Dashboard',
            users: 'Users',
            settings: 'Settings',
            logout: 'Logout',
            loggingOut: 'Logging out...',
            filterPlaceholder: 'Filter by name...',
            clearFilter: 'Clear filter',
            matchesFound: '{{count}} match found',
            matchesFound_plural: '{{count}} matches found',
            noResultsFound: 'No results found.',
            selectLanguage: 'Select Language',
        },
    },
    it: {
        translation: {
            dashboardTitle: 'Pannello SWAPI',
            toggleMenu: 'Mostra/Nascondi menu',
            dashboard: 'Pannello',
            users: 'Utenti',
            settings: 'Impostazioni',
            logout: 'Disconnetti',
            loggingOut: 'Disconnessione in corso...',
            filterPlaceholder: 'Filtra per nome...',
            clearFilter: 'Pulisci filtro',
            matchesFound: '{{count}} risultato trovato',
            matchesFound_plural: '{{count}} risultati trovati',
            noResultsFound: 'Nessun risultato trovato.',
            selectLanguage: 'Seleziona lingua',
        },
    },
    es: {
        translation: {
            dashboardTitle: 'Panel SWAPI',
            toggleMenu: 'Mostrar/Ocultar menú',
            dashboard: 'Tablero',
            users: 'Usuarios',
            settings: 'Configuración',
            logout: 'Cerrar sesión',
            loggingOut: 'Cerrando sesión...',
            filterPlaceholder: 'Filtrar por nombre...',
            clearFilter: 'Limpiar filtro',
            matchesFound: '{{count}} resultado encontrado',
            matchesFound_plural: '{{count}} resultados encontrados',
            noResultsFound: 'No se encontraron resultados.',
            selectLanguage: 'Seleccionar idioma',
        },
    },
};

i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        resources,
        fallbackLng: 'en',
        interpolation: { escapeValue: false },
        detection: {
            order: ['localStorage', 'navigator'],
            caches: ['localStorage'],
        },
    })
    .then(() => {
        console.log("i18n initialized");
    })
    .catch(err => {
        console.error("i18n initialization error:", err);
    });

export default i18n;
