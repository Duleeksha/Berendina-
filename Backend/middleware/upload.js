import multer from 'multer';
import supabase from '../config/supabase.js';
const storage = multer.memoryStorage();
export const upload = multer({ storage });
export const uploadToSupabase = async (file, folder = 'uploads') => {
  const fileName = `${Date.now()}-${file.originalname.replace(/\s+/g, '_')}`;
  const filePath = `${folder}/${fileName}`;
  try {
    const { data, error } = await supabase.storage
      .from('Berendinaa')
      .upload(filePath, file.buffer, {
        contentType: file.mimetype,
        upsert: true
      });
    if (error) {
        console.error("Supabase Storage Upload Error:", error);
        return null;
    }
    const { data: signedUrlData, error: signedError } = await supabase.storage
      .from('Berendinaa')
      .createSignedUrl(filePath, 157680000); 
    if (signedError) {
        console.error("Supabase Signed URL Error:", signedError);
        return null;
    }
    return signedUrlData.signedUrl;
  } catch (err) {
    console.error("CRITICAL STORAGE FETCH ERROR:", err.message);
    return null; 
  }
};
