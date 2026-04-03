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
    .from('berendina-bucket')
    .upload(filePath, file.buffer, {
      contentType: file.mimetype,
      upsert: true
    });

  if (error) throw error;

  const { data: publicUrlData } = supabase.storage
    .from('berendina-bucket')
    .getPublicUrl(filePath);

  return publicUrlData.publicUrl;
};
