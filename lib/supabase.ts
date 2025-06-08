import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Get the current user's ID
 */
export const getCurrentUserId = async (): Promise<string | null> => {
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id || null;
};

/**
 * Save a chat message to the database
 */
export const saveMessage = async (message: {
  content: string;
  role: 'user' | 'assistant';
  userId: string;
}): Promise<void> => {
  const { error } = await supabase
    .from('messages')
    .insert([
      {
        user_id: message.userId,
        content: message.content,
        role: message.role,
      },
    ]);

  if (error) {
    console.error('Error saving message:', error);
    throw error;
  }
};

/**
 * Get chat messages for a user
 */
export const getMessages = async (userId: string, limit: number = 50) => {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })
    .limit(limit);

  if (error) {
    console.error('Error fetching messages:', error);
    throw error;
  }

  return data;
};

/**
 * Save a generated image to the database
 */
export const saveGeneratedImage = async (image: {
  prompt: string;
  imageUrl: string;
  size: string;
  style?: string;
  userId: string;
}): Promise<void> => {
  const { error } = await supabase
    .from('generated_images')
    .insert([
      {
        user_id: image.userId,
        prompt: image.prompt,
        image_url: image.imageUrl,
        size: image.size,
        style: image.style,
      },
    ]);

  if (error) {
    console.error('Error saving generated image:', error);
    throw error;
  }
};

/**
 * Get generated images for a user
 */
export const getGeneratedImages = async (userId: string, limit: number = 20) => {
  const { data, error } = await supabase
    .from('generated_images')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching generated images:', error);
    throw error;
  }

  return data;
};