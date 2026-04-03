import multer from 'multer';
import supabase from '../config/supabase.js';

// --- MULTER CONFIG (MEMORY STORAGE) ---
const storage = multer.memoryStorage();
export const upload = multer({ storage });

// --- SUPABASE UPLOAD HELPER ---
export const uploadToSupabase = async (file, folder = 'uploads') => {
  const fileName = `${Date.now()}-${file.originalname.replace(/\s+/g, '_')}`;
  const filePath = `${folder}/${fileName}`;

  const { data, error } = await supabase.storage
    .from('Berendinaa')
    .upload(filePath, file.buffer, {
      contentType: file.mimetype,
      upsert: true
    });

  if (error) throw error;

  const { data: signedUrlData, error: signedError } = await supabase.storage
    .from('Berendinaa')
    .createSignedUrl(filePath, 157680000); // 5 years in seconds

  if (signedError) throw signedError;

  return signedUrlData.signedUrl;
};

