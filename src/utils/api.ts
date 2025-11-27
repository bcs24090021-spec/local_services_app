import { projectId, publicAnonKey } from './supabase/info';
import { createClient } from '@supabase/supabase-js';

const API_BASE_URL = `https://${projectId}.supabase.co/functions/v1/make-server-241dc560`;

export const supabaseClient = createClient(
  `https://${projectId}.supabase.co`,
  publicAnonKey
);

// Test server connectivity
export async function testServerConnection(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/health`, {
      headers: {
        'Authorization': `Bearer ${publicAnonKey}`,
      },
    });
    return response.ok;
  } catch (error) {
    console.error('Server connection test failed:', error);
    return false;
  }
}

// Get auth token from current session
export async function getAuthToken(): Promise<string | null> {
  const { data: { session } } = await supabaseClient.auth.getSession();
  return session?.access_token || null;
}

// API call helper
async function apiCall(endpoint: string, options: RequestInit = {}) {
  const token = options.headers?.['Authorization'] 
    ? options.headers['Authorization'] 
    : publicAnonKey;

  const url = `${API_BASE_URL}${endpoint}`;
  
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Request failed' }));
      console.error('API Error:', { url, status: response.status, error });
      throw new Error(error.error || `Request failed with status ${response.status}`);
    }

    return response.json();
  } catch (error: any) {
    console.error('API Call Failed:', { url, error: error.message });
    
    // If it's a network error (fetch failed), provide more helpful message
    if (error.message === 'Failed to fetch') {
      throw new Error('Unable to connect to server. The edge function may not be deployed yet. Please wait a moment and try again.');
    }
    
    throw error;
  }
}

// ========== AUTH API ==========

export async function signupCustomer(data: {
  email: string;
  password: string;
  name: string;
  phone?: string;
}) {
  // Create user via server (which auto-confirms email)
  const result = await apiCall('/auth/customer/signup', {
    method: 'POST',
    body: JSON.stringify(data),
  });

  // Wait for the user to be fully created and email confirmed
  await new Promise(resolve => setTimeout(resolve, 1500));

  // Now sign in the user to get a session
  const { data: authData, error } = await supabaseClient.auth.signInWithPassword({
    email: data.email,
    password: data.password,
  });

  if (error) {
    console.error('Sign in after signup error:', error);
    
    // If email not confirmed, try to confirm it
    if (error.message.includes('Email not confirmed')) {
      await confirmEmail(data.email);
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Retry login
      const { data: retryData, error: retryError } = await supabaseClient.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });
      
      if (retryError) {
        throw new Error('Account created but sign in failed. Please try logging in manually.');
      }
      
      return retryData;
    }
    
    throw new Error('Account created but sign in failed. Please try logging in manually.');
  }
  
  return authData;
}

export async function signupProvider(data: {
  email: string;
  password: string;
  name: string;
  phone?: string;
  businessName: string;
  category?: string;
}) {
  // Create user via server (which auto-confirms email)
  const result = await apiCall('/auth/provider/signup', {
    method: 'POST',
    body: JSON.stringify(data),
  });

  // Wait for the user to be fully created and email confirmed
  await new Promise(resolve => setTimeout(resolve, 1500));

  // Now sign in the user to get a session
  const { data: authData, error } = await supabaseClient.auth.signInWithPassword({
    email: data.email,
    password: data.password,
  });

  if (error) {
    console.error('Sign in after signup error:', error);
    
    // If email not confirmed, try to confirm it
    if (error.message.includes('Email not confirmed')) {
      await confirmEmail(data.email);
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Retry login
      const { data: retryData, error: retryError } = await supabaseClient.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });
      
      if (retryError) {
        throw new Error('Account created but sign in failed. Please try logging in manually.');
      }
      
      return retryData;
    }
    
    throw new Error('Account created but sign in failed. Please try logging in manually.');
  }
  
  return authData;
}

export async function confirmEmail(email: string) {
  return apiCall('/auth/confirm-email', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

export async function login(email: string, password: string) {
  try {
    const { data, error } = await supabaseClient.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      // If email not confirmed, auto-confirm it and retry
      if (error.message.includes('Email not confirmed')) {
        console.log('Email not confirmed, confirming now...');
        await confirmEmail(email);
        
        // Wait a moment for the confirmation to process
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Retry login
        const { data: retryData, error: retryError } = await supabaseClient.auth.signInWithPassword({
          email,
          password,
        });
        
        if (retryError) throw retryError;
        return retryData;
      }
      throw error;
    }

    return data;
  } catch (error) {
    throw error;
  }
}

export async function logout() {
  const { error } = await supabaseClient.auth.signOut();
  if (error) throw error;
}

export async function getCurrentUser() {
  const { data: { user }, error } = await supabaseClient.auth.getUser();
  if (error) throw error;
  return user;
}

export async function getUserProfile() {
  const token = await getAuthToken();
  if (!token) throw new Error('Not authenticated');

  return apiCall('/auth/profile', {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
}

export async function updateProviderProfile(data: {
  name?: string;
  phone?: string;
  business_name?: string;
  category?: string;
  bio?: string;
  address?: string;
  services_offered?: string[];
}) {
  const token = await getAuthToken();
  if (!token) throw new Error('Not authenticated');

  return apiCall('/provider/profile', {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
}

export async function updateCustomerProfile(data: {
  name?: string;
  phone?: string;
  bio?: string;
  address?: string;
  preferences?: any;
}) {
  const token = await getAuthToken();
  if (!token) throw new Error('Not authenticated');

  return apiCall('/customer/profile', {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
}

// ========== SERVICES API ==========

export async function getServices(filters?: { category?: string; search?: string }) {
  const params = new URLSearchParams();
  if (filters?.category) params.append('category', filters.category);
  if (filters?.search) params.append('search', filters.search);
  
  const query = params.toString() ? `?${params.toString()}` : '';
  return apiCall(`/services${query}`);
}

export async function getServiceById(id: string) {
  return apiCall(`/services/${id}`);
}

export async function uploadServiceImage(file: File) {
  const token = await getAuthToken();
  if (!token) throw new Error('Not authenticated');

  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-241dc560/upload-service-image`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to upload image');
  }

  return response.json();
}

export async function createService(data: {
  title: string;
  description: string;
  category: string;
  price: number;
  priceUnit?: string;
  minBooking?: number;
  images?: string[];
}) {
  const token = await getAuthToken();
  if (!token) throw new Error('Not authenticated');

  return apiCall('/services', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
}

export async function getProviderServices() {
  const token = await getAuthToken();
  if (!token) throw new Error('Not authenticated');

  return apiCall('/provider/services', {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
}

export async function getProviderById(id: string) {
  return apiCall(`/providers/${id}`);
}

export async function updateService(serviceId: string, data: {
  title?: string;
  description?: string;
  category?: string;
  price?: number;
  priceUnit?: string;
  minBooking?: number;
  images?: string[];
  active?: boolean;
}) {
  const token = await getAuthToken();
  if (!token) throw new Error('Not authenticated');

  return apiCall(`/services/${serviceId}`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
}

export async function deleteService(serviceId: string) {
  const token = await getAuthToken();
  if (!token) throw new Error('Not authenticated');

  return apiCall(`/services/${serviceId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
}

export async function toggleServiceActive(serviceId: string) {
  const token = await getAuthToken();
  if (!token) throw new Error('Not authenticated');

  return apiCall(`/services/${serviceId}/toggle`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
}

// ========== BOOKINGS API ==========

export async function createBooking(data: {
  service_id: string;
  date: string;
  time: string;
  duration?: number;
  notes?: string;
}) {
  const token = await getAuthToken();
  if (!token) throw new Error('Not authenticated');

  return apiCall('/bookings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
}

export async function getBookings() {
  const token = await getAuthToken();
  if (!token) throw new Error('Not authenticated');

  return apiCall('/bookings', {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
}

export async function updateBookingStatus(bookingId: string, status: string) {
  const token = await getAuthToken();
  if (!token) throw new Error('Not authenticated');

  return apiCall(`/bookings/${bookingId}`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ status }),
  });
}

// ========== MESSAGES API ==========

export async function getConversations() {
  const token = await getAuthToken();
  if (!token) throw new Error('Not authenticated');

  return apiCall('/messages/conversations', {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
}

export async function getMessages(userId: string) {
  const token = await getAuthToken();
  if (!token) throw new Error('Not authenticated');

  return apiCall(`/messages/${userId}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
}

export async function sendMessage(receiverId: string, content: string) {
  const token = await getAuthToken();
  if (!token) throw new Error('Not authenticated');

  return apiCall('/messages', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      receiver_id: receiverId,
      content,
    }),
  });
}

// ========== PROVIDER STATS API ==========

export async function getProviderStats() {
  const token = await getAuthToken();
  if (!token) throw new Error('Not authenticated');

  return apiCall('/provider/stats', {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
}

// ========== CUSTOMER STATS API ==========

export async function getCustomerStats() {
  const token = await getAuthToken();
  if (!token) throw new Error('Not authenticated');

  return apiCall('/customer/stats', {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
}
