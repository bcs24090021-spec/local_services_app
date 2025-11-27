import { Hono } from 'npm:hono';
import { cors } from 'npm:hono/cors';
import { logger } from 'npm:hono/logger';
import { createClient } from 'npm:@supabase/supabase-js@2';
import * as kv from './kv_store.tsx';

const app = new Hono();

app.use('*', cors());
app.use('*', logger(console.log));

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
);

// Initialize storage bucket for service images
const BUCKET_NAME = 'make-241dc560-service-images';

async function ensureBucketExists() {
  try {
    const { data: buckets } = await supabase.storage.listBuckets();
    const bucketExists = buckets?.some(bucket => bucket.name === BUCKET_NAME);
    
    if (!bucketExists) {
      console.log('Creating storage bucket:', BUCKET_NAME);
      await supabase.storage.createBucket(BUCKET_NAME, {
        public: true,
        fileSizeLimit: 5242880, // 5MB
      });
    }
  } catch (error) {
    console.error('Error ensuring bucket exists:', error);
  }
}

// Ensure bucket exists on startup
ensureBucketExists();

// ========== HEALTH CHECK ==========

// Root health check endpoint
app.get('/make-server-241dc560', (c) => {
  return c.json({
    status: 'ok',
    message: 'Make Server is running',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// Health check endpoint
app.get('/make-server-241dc560/health', (c) => {
  return c.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
  });
});

// ========== AUTH ROUTES ==========

// Customer Signup
app.post('/make-server-241dc560/auth/customer/signup', async (c) => {
  try {
    const { email, password, name, phone } = await c.req.json();

    if (!email || !password || !name) {
      return c.json({ error: 'Email, password, and name are required' }, 400);
    }

    // Check if user already exists
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find(u => u.email === email);
    
    if (existingUser) {
      console.log('User already exists, deleting and recreating:', email);
      await supabase.auth.admin.deleteUser(existingUser.id);
      // Wait for deletion to complete
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Create user with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm since email server not configured
      user_metadata: {
        name,
        phone,
        user_type: 'customer',
      },
    });

    if (authError) {
      console.log('Customer signup auth error:', authError);
      return c.json({ error: authError.message }, 400);
    }

    // Store additional customer data in KV store
    await kv.set(`customer:${authData.user.id}`, {
      id: authData.user.id,
      email,
      name,
      phone: phone || '',
      user_type: 'customer',
      created_at: new Date().toISOString(),
    });

    return c.json({
      success: true,
      user: authData.user,
    });
  } catch (error) {
    console.log('Customer signup error:', error);
    return c.json({ error: 'Failed to create customer account' }, 500);
  }
});

// Provider Signup
app.post('/make-server-241dc560/auth/provider/signup', async (c) => {
  try {
    const { email, password, name, phone, businessName, category } = await c.req.json();

    if (!email || !password || !name || !businessName) {
      return c.json({ error: 'Email, password, name, and business name are required' }, 400);
    }

    // Check if user already exists
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find(u => u.email === email);
    
    if (existingUser) {
      console.log('User already exists, deleting and recreating:', email);
      await supabase.auth.admin.deleteUser(existingUser.id);
      // Wait for deletion to complete
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Create user with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        name,
        phone,
        business_name: businessName,
        category,
        user_type: 'provider',
      },
    });

    if (authError) {
      console.log('Provider signup auth error:', authError);
      return c.json({ error: authError.message }, 400);
    }

    // Store provider data in KV store
    await kv.set(`provider:${authData.user.id}`, {
      id: authData.user.id,
      email,
      name,
      phone: phone || '',
      business_name: businessName,
      category: category || 'general',
      user_type: 'provider',
      rating: 0,
      total_reviews: 0,
      total_bookings: 0,
      total_earnings: 0,
      verified: false,
      created_at: new Date().toISOString(),
    });

    return c.json({
      success: true,
      user: authData.user,
    });
  } catch (error) {
    console.log('Provider signup error:', error);
    return c.json({ error: 'Failed to create provider account' }, 500);
  }
});

// Get User Profile
app.get('/make-server-241dc560/auth/profile', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const userType = user.user_metadata?.user_type || 'customer';
    let userData = await kv.get(`${userType}:${user.id}`);

    // If user data doesn't exist in KV store, create it from auth metadata
    if (!userData) {
      console.log(`${userType} profile not found in KV store, creating from auth metadata for:`, user.id);
      
      if (userType === 'customer') {
        userData = {
          id: user.id,
          email: user.email,
          name: user.user_metadata?.name || '',
          phone: user.user_metadata?.phone || '',
          user_type: 'customer',
          created_at: user.created_at || new Date().toISOString(),
        };
      } else if (userType === 'provider') {
        userData = {
          id: user.id,
          email: user.email,
          name: user.user_metadata?.name || '',
          phone: user.user_metadata?.phone || '',
          business_name: user.user_metadata?.business_name || '',
          category: user.user_metadata?.category || 'general',
          user_type: 'provider',
          rating: 0,
          total_reviews: 0,
          total_bookings: 0,
          total_earnings: 0,
          verified: false,
          created_at: user.created_at || new Date().toISOString(),
        };
      }
      
      // Save to KV store
      await kv.set(`${userType}:${user.id}`, userData);
    }

    return c.json({
      success: true,
      user: userData,
    });
  } catch (error) {
    console.log('Get profile error:', error);
    return c.json({ error: 'Failed to get user profile' }, 500);
  }
});

// Confirm Email (for users created without confirmation)
app.post('/make-server-241dc560/auth/confirm-email', async (c) => {
  try {
    const { email } = await c.req.json();

    if (!email) {
      return c.json({ error: 'Email is required' }, 400);
    }

    // Find user by email
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const user = existingUsers?.users?.find(u => u.email === email);

    if (!user) {
      return c.json({ error: 'User not found' }, 404);
    }

    // Update user to confirm email
    const { data: updatedUser, error: updateError } = await supabase.auth.admin.updateUserById(
      user.id,
      { email_confirm: true }
    );

    if (updateError) {
      console.log('Confirm email error:', updateError);
      return c.json({ error: updateError.message }, 400);
    }

    return c.json({
      success: true,
      message: 'Email confirmed successfully',
    });
  } catch (error) {
    console.log('Confirm email error:', error);
    return c.json({ error: 'Failed to confirm email' }, 500);
  }
});

// Update Provider Profile
app.patch('/make-server-241dc560/provider/profile', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    if (user.user_metadata?.user_type !== 'provider') {
      return c.json({ error: 'Only providers can update provider profile' }, 403);
    }

    const { name, phone, business_name, category, bio, address, services_offered } = await c.req.json();

    // Get existing provider data
    const existingProvider = await kv.get(`provider:${user.id}`);
    
    if (!existingProvider) {
      return c.json({ error: 'Provider profile not found' }, 404);
    }

    // Update provider data
    const updatedProvider = {
      ...existingProvider,
      ...(name && { name }),
      ...(phone && { phone }),
      ...(business_name && { business_name }),
      ...(category && { category }),
      ...(bio !== undefined && { bio }),
      ...(address && { address }),
      ...(services_offered && { services_offered }),
      updated_at: new Date().toISOString(),
    };

    await kv.set(`provider:${user.id}`, updatedProvider);

    // Update auth metadata if name or business_name changed
    if (name || business_name) {
      await supabase.auth.admin.updateUserById(user.id, {
        user_metadata: {
          ...user.user_metadata,
          ...(name && { name }),
          ...(business_name && { business_name }),
        },
      });
    }

    return c.json({
      success: true,
      provider: updatedProvider,
    });
  } catch (error) {
    console.log('Update provider profile error:', error);
    return c.json({ error: 'Failed to update provider profile' }, 500);
  }
});

// Update Customer Profile
app.patch('/make-server-241dc560/customer/profile', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    if (user.user_metadata?.user_type !== 'customer') {
      return c.json({ error: 'Only customers can update customer profile' }, 403);
    }

    const { name, phone, bio, address, preferences } = await c.req.json();

    // Get existing customer data or create default
    let existingCustomer = await kv.get(`customer:${user.id}`);
    
    if (!existingCustomer) {
      console.log('Customer profile not found, creating new profile for:', user.id);
      // Create a default customer profile if it doesn't exist
      existingCustomer = {
        id: user.id,
        email: user.email,
        name: user.user_metadata?.name || '',
        phone: user.user_metadata?.phone || '',
        user_type: 'customer',
        created_at: new Date().toISOString(),
      };
    }

    // Update customer data
    const updatedCustomer = {
      ...existingCustomer,
      ...(name && { name }),
      ...(phone && { phone }),
      ...(bio !== undefined && { bio }),
      ...(address && { address }),
      ...(preferences && { preferences }),
      updated_at: new Date().toISOString(),
    };

    await kv.set(`customer:${user.id}`, updatedCustomer);

    // Update auth metadata if name changed
    if (name) {
      await supabase.auth.admin.updateUserById(user.id, {
        user_metadata: {
          ...user.user_metadata,
          name,
        },
      });
    }

    return c.json({
      success: true,
      customer: updatedCustomer,
    });
  } catch (error) {
    console.log('Update customer profile error:', error);
    return c.json({ error: 'Failed to update customer profile' }, 500);
  }
});

// ========== SERVICES ROUTES ==========

// Get All Services (with provider info)
app.get('/make-server-241dc560/services', async (c) => {
  try {
    const category = c.req.query('category');
    const search = c.req.query('search');
    
    console.log('Fetching services with filters:', { category, search });
    
    let allServices = [];
    try {
      allServices = await kv.getByPrefix('service:');
      console.log(`Found ${allServices.length} services in database`);
      
      // Ensure allServices is actually an array
      if (!Array.isArray(allServices)) {
        console.warn('getByPrefix returned non-array, defaulting to empty array');
        allServices = [];
      }
    } catch (kvError) {
      console.error('KV getByPrefix error:', kvError);
      // Return empty array if no services exist
      allServices = [];
    }
    
    let services = allServices;

    // Filter by category if provided
    if (category && category !== 'all') {
      services = services.filter((s: any) => s && s.category === category);
      console.log(`Filtered to ${services.length} services for category: ${category}`);
    }

    // Filter by search term if provided
    if (search) {
      const searchLower = search.toLowerCase();
      services = services.filter((s: any) => 
        s.title?.toLowerCase().includes(searchLower) ||
        s.description?.toLowerCase().includes(searchLower)
      );
      console.log(`Filtered to ${services.length} services for search: ${search}`);
    }

    // Enrich services with provider information
    const enrichedServices = await Promise.all(
      services.map(async (service: any) => {
        try {
          const provider = await kv.get(`provider:${service.provider_id}`);
          return {
            ...service,
            provider_name: provider?.business_name || provider?.name || 'Provider',
            provider_rating: provider?.rating || 0,
            provider_verified: provider?.verified || false,
          };
        } catch (providerError) {
          console.error(`Error getting provider ${service.provider_id}:`, providerError);
          return {
            ...service,
            provider_name: 'Provider',
            provider_rating: 0,
            provider_verified: false,
          };
        }
      })
    );

    console.log(`Returning ${enrichedServices.length} enriched services`);

    return c.json({
      success: true,
      services: enrichedServices,
    });
  } catch (error) {
    console.error('Get services error:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    return c.json({ error: 'Failed to get services', details: error instanceof Error ? error.message : String(error) }, 500);
  }
});

// Get Service by ID (with provider info)
app.get('/make-server-241dc560/services/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const service = await kv.get(`service:${id}`);

    if (!service) {
      return c.json({ error: 'Service not found' }, 404);
    }

    // Enrich with provider information
    const provider = await kv.get(`provider:${service.provider_id}`);
    const enrichedService = {
      ...service,
      provider_name: provider?.business_name || provider?.name || 'Provider',
      provider_rating: provider?.rating || 0,
      provider_verified: provider?.verified || false,
      provider_phone: provider?.phone || '',
      provider_email: provider?.email || '',
    };

    return c.json({
      success: true,
      service: enrichedService,
    });
  } catch (error) {
    console.log('Get service error:', error);
    return c.json({ error: 'Failed to get service' }, 500);
  }
});

// Get Provider by ID
app.get('/make-server-241dc560/providers/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const provider = await kv.get(`provider:${id}`);

    if (!provider) {
      return c.json({ error: 'Provider not found' }, 404);
    }

    return c.json({
      success: true,
      provider,
    });
  } catch (error) {
    console.log('Get provider error:', error);
    return c.json({ error: 'Failed to get provider' }, 500);
  }
});

// Upload Service Image (Provider only)
app.post('/make-server-241dc560/upload-service-image', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    if (user.user_metadata?.user_type !== 'provider') {
      return c.json({ error: 'Only providers can upload service images' }, 403);
    }

    const formData = await c.req.formData();
    const file = formData.get('file');

    if (!file || !(file instanceof File)) {
      return c.json({ error: 'No file provided' }, 400);
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return c.json({ error: 'Invalid file type. Only JPEG, PNG, and WebP are allowed.' }, 400);
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      return c.json({ error: 'File size too large. Maximum 5MB allowed.' }, 400);
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomStr = crypto.randomUUID().split('-')[0];
    const extension = file.name.split('.').pop() || 'jpg';
    const filename = `${user.id}/${timestamp}-${randomStr}.${extension}`;

    // Convert File to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    // Upload to Supabase Storage
    const { data, error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filename, uint8Array, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return c.json({ error: 'Failed to upload image' }, 500);
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(filename);

    return c.json({
      success: true,
      url: publicUrl,
      filename,
    });
  } catch (error) {
    console.error('Upload service image error:', error);
    return c.json({ error: 'Failed to upload image' }, 500);
  }
});

// Create Service (Provider only)
app.post('/make-server-241dc560/services', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    if (user.user_metadata?.user_type !== 'provider') {
      return c.json({ error: 'Only providers can create services' }, 403);
    }

    const { title, description, category, price, priceUnit, minBooking, images } = await c.req.json();

    if (!title || !description || !category || !price) {
      return c.json({ error: 'Missing required fields' }, 400);
    }

    const serviceId = crypto.randomUUID();
    const service = {
      id: serviceId,
      provider_id: user.id,
      title,
      description,
      category,
      price: parseFloat(price),
      price_unit: priceUnit || 'hour',
      min_booking: minBooking || 1,
      images: images || [],
      rating: 0,
      total_reviews: 0,
      total_bookings: 0,
      active: true,
      created_at: new Date().toISOString(),
    };

    await kv.set(`service:${serviceId}`, service);

    return c.json({
      success: true,
      service,
    });
  } catch (error) {
    console.log('Create service error:', error);
    return c.json({ error: 'Failed to create service' }, 500);
  }
});

// Get Provider Services
app.get('/make-server-241dc560/provider/services', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    let allServices = [];
    try {
      allServices = await kv.getByPrefix('service:');
      if (!Array.isArray(allServices)) {
        allServices = [];
      }
    } catch (kvError) {
      console.error('Error fetching provider services:', kvError);
      allServices = [];
    }
    
    const providerServices = allServices.filter((s: any) => s && s.provider_id === user.id);

    return c.json({
      success: true,
      services: providerServices,
    });
  } catch (error) {
    console.log('Get provider services error:', error);
    return c.json({ error: 'Failed to get provider services' }, 500);
  }
});

// Update Service (Provider only)
app.patch('/make-server-241dc560/services/:id', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    if (user.user_metadata?.user_type !== 'provider') {
      return c.json({ error: 'Only providers can update services' }, 403);
    }

    const serviceId = c.req.param('id');
    const service = await kv.get(`service:${serviceId}`);

    if (!service) {
      return c.json({ error: 'Service not found' }, 404);
    }

    // Verify the service belongs to this provider
    if (service.provider_id !== user.id) {
      return c.json({ error: 'Unauthorized to update this service' }, 403);
    }

    const { title, description, category, price, priceUnit, minBooking, images, active } = await c.req.json();

    const updatedService = {
      ...service,
      ...(title !== undefined && { title }),
      ...(description !== undefined && { description }),
      ...(category !== undefined && { category }),
      ...(price !== undefined && { price: parseFloat(price) }),
      ...(priceUnit !== undefined && { price_unit: priceUnit }),
      ...(minBooking !== undefined && { min_booking: minBooking }),
      ...(images !== undefined && { images }),
      ...(active !== undefined && { active }),
      updated_at: new Date().toISOString(),
    };

    await kv.set(`service:${serviceId}`, updatedService);

    return c.json({
      success: true,
      service: updatedService,
    });
  } catch (error) {
    console.log('Update service error:', error);
    return c.json({ error: 'Failed to update service' }, 500);
  }
});

// Delete Service (Provider only)
app.delete('/make-server-241dc560/services/:id', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    if (user.user_metadata?.user_type !== 'provider') {
      return c.json({ error: 'Only providers can delete services' }, 403);
    }

    const serviceId = c.req.param('id');
    const service = await kv.get(`service:${serviceId}`);

    if (!service) {
      return c.json({ error: 'Service not found' }, 404);
    }

    // Verify the service belongs to this provider
    if (service.provider_id !== user.id) {
      return c.json({ error: 'Unauthorized to delete this service' }, 403);
    }

    await kv.del(`service:${serviceId}`);

    return c.json({
      success: true,
      message: 'Service deleted successfully',
    });
  } catch (error) {
    console.log('Delete service error:', error);
    return c.json({ error: 'Failed to delete service' }, 500);
  }
});

// Toggle Service Active Status (Provider only)
app.patch('/make-server-241dc560/services/:id/toggle', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    if (user.user_metadata?.user_type !== 'provider') {
      return c.json({ error: 'Only providers can toggle service status' }, 403);
    }

    const serviceId = c.req.param('id');
    const service = await kv.get(`service:${serviceId}`);

    if (!service) {
      return c.json({ error: 'Service not found' }, 404);
    }

    // Verify the service belongs to this provider
    if (service.provider_id !== user.id) {
      return c.json({ error: 'Unauthorized to toggle this service' }, 403);
    }

    const updatedService = {
      ...service,
      active: !service.active,
      updated_at: new Date().toISOString(),
    };

    await kv.set(`service:${serviceId}`, updatedService);

    return c.json({
      success: true,
      service: updatedService,
    });
  } catch (error) {
    console.log('Toggle service error:', error);
    return c.json({ error: 'Failed to toggle service status' }, 500);
  }
});

// ========== BOOKINGS ROUTES ==========

// Create Booking
app.post('/make-server-241dc560/bookings', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { service_id, date, time, duration, notes } = await c.req.json();

    if (!service_id || !date || !time) {
      return c.json({ error: 'Missing required fields' }, 400);
    }

    const service = await kv.get(`service:${service_id}`);
    if (!service) {
      return c.json({ error: 'Service not found' }, 404);
    }

    const bookingId = crypto.randomUUID();
    const booking = {
      id: bookingId,
      customer_id: user.id,
      provider_id: service.provider_id,
      service_id,
      date,
      time,
      duration: duration || service.min_booking,
      notes: notes || '',
      status: 'pending',
      total_price: service.price * (duration || service.min_booking),
      created_at: new Date().toISOString(),
    };

    await kv.set(`booking:${bookingId}`, booking);

    return c.json({
      success: true,
      booking,
    });
  } catch (error) {
    console.log('Create booking error:', error);
    return c.json({ error: 'Failed to create booking' }, 500);
  }
});

// Get User Bookings
app.get('/make-server-241dc560/bookings', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const allBookings = await kv.getByPrefix('booking:');
    const userType = user.user_metadata?.user_type || 'customer';
    
    const userBookings = allBookings.filter((b: any) => 
      userType === 'customer' ? b.customer_id === user.id : b.provider_id === user.id
    );

    // Enrich bookings with service and customer information
    const enrichedBookings = await Promise.all(
      userBookings.map(async (booking: any) => {
        const service = await kv.get(`service:${booking.service_id}`);
        const customer = await kv.get(`customer:${booking.customer_id}`);
        
        return {
          ...booking,
          service_title: service?.title || 'Service',
          service_category: service?.category || '',
          customer_name: customer?.name || 'Customer',
          customer_email: customer?.email || '',
        };
      })
    );

    return c.json({
      success: true,
      bookings: enrichedBookings,
    });
  } catch (error) {
    console.log('Get bookings error:', error);
    return c.json({ error: 'Failed to get bookings' }, 500);
  }
});

// Update Booking Status
app.patch('/make-server-241dc560/bookings/:id', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const bookingId = c.req.param('id');
    const { status } = await c.req.json();

    const booking = await kv.get(`booking:${bookingId}`);
    
    if (!booking) {
      return c.json({ error: 'Booking not found' }, 404);
    }

    // Verify user has permission to update
    if (booking.customer_id !== user.id && booking.provider_id !== user.id) {
      return c.json({ error: 'Unauthorized to update this booking' }, 403);
    }

    const updatedBooking = {
      ...booking,
      status,
      updated_at: new Date().toISOString(),
    };

    await kv.set(`booking:${bookingId}`, updatedBooking);

    return c.json({
      success: true,
      booking: updatedBooking,
    });
  } catch (error) {
    console.log('Update booking error:', error);
    return c.json({ error: 'Failed to update booking' }, 500);
  }
});

// ========== MESSAGES ROUTES ==========

// Get Conversations
app.get('/make-server-241dc560/messages/conversations', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const allMessages = await kv.getByPrefix('message:');
    
    // Get unique conversations
    const conversationsMap = new Map();
    
    allMessages.forEach((msg: any) => {
      if (msg.sender_id === user.id || msg.receiver_id === user.id) {
        const otherId = msg.sender_id === user.id ? msg.receiver_id : msg.sender_id;
        const convKey = [user.id, otherId].sort().join(':');
        
        if (!conversationsMap.has(convKey) || new Date(msg.created_at) > new Date(conversationsMap.get(convKey).created_at)) {
          conversationsMap.set(convKey, {
            ...msg,
            other_user_id: otherId,
          });
        }
      }
    });

    const conversations = Array.from(conversationsMap.values());

    // Enrich with other user's information
    const enrichedConversations = await Promise.all(
      conversations.map(async (conv: any) => {
        const { data: { user: otherUser } } = await supabase.auth.admin.getUserById(conv.other_user_id);
        
        let otherUserName = 'User';
        let otherUserType = 'customer';
        
        if (otherUser) {
          otherUserType = otherUser.user_metadata?.user_type || 'customer';
          otherUserName = otherUser.user_metadata?.business_name || 
                         otherUser.user_metadata?.name || 
                         otherUser.email?.split('@')[0] || 
                         'User';
        }

        // Count unread messages
        const unreadCount = allMessages.filter((msg: any) => 
          msg.receiver_id === user.id && 
          msg.sender_id === conv.other_user_id && 
          !msg.read
        ).length;

        return {
          id: conv.other_user_id,
          other_user_id: conv.other_user_id,
          other_user_name: otherUserName,
          other_user_type: otherUserType,
          last_message: conv.content,
          created_at: conv.created_at,
          unread_count: unreadCount,
        };
      })
    );

    // Sort by most recent
    enrichedConversations.sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    return c.json({
      success: true,
      conversations: enrichedConversations,
    });
  } catch (error) {
    console.log('Get conversations error:', error);
    return c.json({ error: 'Failed to get conversations' }, 500);
  }
});

// Get Messages with User
app.get('/make-server-241dc560/messages/:userId', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const otherUserId = c.req.param('userId');
    const allMessages = await kv.getByPrefix('message:');
    
    const conversation = allMessages.filter((msg: any) => 
      (msg.sender_id === user.id && msg.receiver_id === otherUserId) ||
      (msg.sender_id === otherUserId && msg.receiver_id === user.id)
    ).sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

    // Mark messages from other user as read
    const markAsReadPromises = conversation
      .filter((msg: any) => msg.receiver_id === user.id && !msg.read)
      .map(async (msg: any) => {
        const updatedMsg = { ...msg, read: true };
        await kv.set(`message:${msg.id}`, updatedMsg);
      });
    
    await Promise.all(markAsReadPromises);

    return c.json({
      success: true,
      messages: conversation,
    });
  } catch (error) {
    console.log('Get messages error:', error);
    return c.json({ error: 'Failed to get messages' }, 500);
  }
});

// Send Message
app.post('/make-server-241dc560/messages', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { receiver_id, content } = await c.req.json();

    if (!receiver_id || !content) {
      return c.json({ error: 'Missing required fields' }, 400);
    }

    const messageId = crypto.randomUUID();
    const message = {
      id: messageId,
      sender_id: user.id,
      receiver_id,
      content,
      read: false,
      created_at: new Date().toISOString(),
    };

    await kv.set(`message:${messageId}`, message);

    return c.json({
      success: true,
      message,
    });
  } catch (error) {
    console.log('Send message error:', error);
    return c.json({ error: 'Failed to send message' }, 500);
  }
});

// ========== PROVIDER STATS ==========

// Get Provider Dashboard Stats
app.get('/make-server-241dc560/provider/stats', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    if (user.user_metadata?.user_type !== 'provider') {
      return c.json({ error: 'Only providers can access stats' }, 403);
    }

    const allBookings = await kv.getByPrefix('booking:');
    const providerBookings = allBookings.filter((b: any) => b.provider_id === user.id);
    
    const totalEarnings = providerBookings
      .filter((b: any) => b.status === 'completed')
      .reduce((sum: number, b: any) => sum + (b.total_price || 0), 0);
    
    const completedBookings = providerBookings.filter((b: any) => b.status === 'completed').length;
    const pendingBookings = providerBookings.filter((b: any) => b.status === 'pending').length;
    const upcomingBookings = providerBookings.filter((b: any) => 
      b.status === 'confirmed' && new Date(b.date) > new Date()
    ).length;

    return c.json({
      success: true,
      stats: {
        total_earnings: totalEarnings,
        completed_bookings: completedBookings,
        pending_bookings: pendingBookings,
        upcoming_bookings: upcomingBookings,
        total_bookings: providerBookings.length,
      },
    });
  } catch (error) {
    console.log('Get provider stats error:', error);
    return c.json({ error: 'Failed to get provider stats' }, 500);
  }
});

// ========== CUSTOMER STATS ==========

// Get Customer Stats
app.get('/make-server-241dc560/customer/stats', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    if (user.user_metadata?.user_type !== 'customer') {
      return c.json({ error: 'Only customers can access customer stats' }, 403);
    }

    // Get customer bookings
    const allBookings = await kv.getByPrefix('booking:');
    const customerBookings = allBookings.filter((b: any) => b.customer_id === user.id);
    
    // Get saved services (we'll store these as saved:userId:serviceId in the future)
    const savedServices = await kv.getByPrefix(`saved:${user.id}:`);
    
    // Calculate stats
    const totalBookings = customerBookings.length;
    const completedBookings = customerBookings.filter((b: any) => b.status === 'completed').length;
    const upcomingBookings = customerBookings.filter((b: any) => 
      (b.status === 'confirmed' || b.status === 'pending') && new Date(b.date) > new Date()
    ).length;
    
    // Count reviews (assuming reviews are stored as review:userId:bookingId)
    const reviews = await kv.getByPrefix(`review:${user.id}:`);
    const totalReviews = reviews.length;
    
    // Calculate average rating as customer (from provider feedback)
    const customerRating = 4.8; // Default for now, can be calculated from provider reviews

    return c.json({
      success: true,
      stats: {
        total_bookings: totalBookings,
        completed_bookings: completedBookings,
        upcoming_bookings: upcomingBookings,
        saved_services: savedServices.length,
        total_reviews: totalReviews,
        customer_rating: customerRating,
      },
    });
  } catch (error) {
    console.log('Get customer stats error:', error);
    return c.json({ error: 'Failed to get customer stats' }, 500);
  }
});

// ========== CLEAR DEMO DATA ENDPOINT ==========

// Clear demo data endpoint
app.delete('/make-server-241dc560/clear-demo-data', async (c) => {
  try {
    console.log('Clearing demo data...');
    
    // Get all keys with demo prefixes
    const demoServiceKeys = await kv.getByPrefix('demo:service:');
    const demoProviderKeys = await kv.getByPrefix('demo:provider:');
    
    // Delete demo services
    for (const service of demoServiceKeys) {
      await kv.del(`demo:service:${service.id}`);
    }
    
    // Delete demo providers
    for (const provider of demoProviderKeys) {
      await kv.del(`demo:provider:${provider.id}`);
    }
    
    return c.json({
      success: true,
      message: 'Demo data cleared successfully',
      deleted: {
        services: demoServiceKeys.length,
        providers: demoProviderKeys.length,
      },
    });
  } catch (error) {
    console.log('Clear demo data error:', error);
    return c.json({ error: 'Failed to clear demo data' }, 500);
  }
});

// ========== AI CHATBOT ROUTES ==========

// AI Chat endpoint
app.post('/make-server-241dc560/ai/chat', async (c) => {
  try {
    const { message, conversationHistory } = await c.req.json();

    if (!message) {
      return c.json({ error: 'Message is required' }, 400);
    }

    const apiKey = Deno.env.get('aichatbox');
    
    console.log('Checking API key availability:', apiKey ? 'Key found' : 'Key not found');
    
    if (!apiKey) {
      return c.json({ 
        error: 'Google Gemini API key not configured. Please add your API key in the settings.' 
      }, 500);
    }

    // Build the conversation context
    const systemPrompt = `You are a helpful AI assistant for a local services marketplace app (similar to Agoda but for services). 
Your role is to help customers find services, understand their options, and answer questions about:
- Available service categories (cleaning, repair, beauty, tutoring, moving, photography, events, pet care)
- How to book services
- How to contact service providers
- Pricing and availability
- Custom service requirements
- General platform usage

Be friendly, concise, and helpful. If a customer has specific requirements, help them articulate what they need and suggest they can search for relevant services in the Explore tab or contact providers directly.`;

    // Prepare the API request
    const contents = [
      {
        role: 'user',
        parts: [{ text: systemPrompt }]
      }
    ];

    // Add conversation history if provided
    if (conversationHistory && Array.isArray(conversationHistory)) {
      conversationHistory.forEach((msg: any) => {
        contents.push({
          role: msg.role === 'user' ? 'user' : 'model',
          parts: [{ text: msg.content }]
        });
      });
    }

    // Add the current message
    contents.push({
      role: 'user',
      parts: [{ text: message }]
    });

    // Call Google Gemini API
    const apiUrl = `https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${apiKey}`;
    console.log('Calling Gemini API with model: gemini-pro');
    
    const response = await fetch(
      apiUrl,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: contents,
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 1024,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Gemini API error:', errorData);
      console.error('Response status:', response.status);
      return c.json({ 
        error: 'Failed to get AI response. Please check your API key.',
        details: errorData 
      }, 500);
    }

    const data = await response.json();
    console.log('Gemini API response received successfully');
    
    if (!data.candidates || !data.candidates[0]?.content?.parts?.[0]?.text) {
      console.error('Unexpected Gemini API response:', JSON.stringify(data, null, 2));
      return c.json({ error: 'Invalid response from AI service' }, 500);
    }

    const aiResponse = data.candidates[0].content.parts[0].text;

    return c.json({
      success: true,
      response: aiResponse,
    });
  } catch (error) {
    console.error('AI chat error:', error);
    return c.json({ error: 'Failed to process AI chat request' }, 500);
  }
});

Deno.serve(app.fetch);