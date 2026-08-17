const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://rover-uoik.onrender.com';
const CHAT_BASE_URL = import.meta.env.VITE_CHAT_BASE_URL || 'https://rover-frontent.vercel.app';

export const config = {
  apiBaseUrl: API_BASE_URL.replace(/\/$/, ''),
  chatBaseUrl: CHAT_BASE_URL.replace(/\/$/, ''),
};

export const getWidgetScriptUrl = () => `${config.apiBaseUrl}/static/widget.js`;
