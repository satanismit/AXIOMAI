import { supabase } from './supabaseClient';

const API_BASE_URL = 'http://localhost:8000/api';

export const fetchWithAuth = async (endpoint, options = {}) => {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;

    if (!token) {
        throw new Error('Not authenticated');
    }

    const headers = {
        'Authorization': `Bearer ${token}`,
        ...options.headers,
    };

    // If body is FormData, don't set Content-Type header so browser sets it correctly with boundary
    if (options.body && options.body instanceof FormData) {
        delete headers['Content-Type'];
    } else if (options.body && typeof options.body === 'object') {
        headers['Content-Type'] = 'application/json';
        options.body = JSON.stringify(options.body);
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
    });

    if (!response.ok) {
        let errorData;
        try {
            errorData = await response.json();
        } catch {
            errorData = { detail: response.statusText };
        }
        throw new Error(errorData.detail || 'API request failed');
    }

    return response;
};
