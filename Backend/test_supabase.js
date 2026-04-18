import supabase from './config/supabase.js';
async function testConnection() {
  console.log('Testing Supabase Connection...');
  console.log('URL:', process.env.SUPABASE_URL);
  try {
    const bucketName = 'Berendinaa';
    console.log(`Using bucket: ${bucketName}`);
    const fileName = `test-connection-${Date.now()}.txt`;
    const content = 'Test Supabase Storage Connection - ' + new Date().toISOString();
    console.log(`Attempting to upload ${fileName} to bucket '${bucketName}'...`);
    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(`tests/${fileName}`, content, {
        contentType: 'text/plain',
        upsert: true
      });
    if (error) {
      console.error('❌ Upload failed:', error.message);
      return;
    }
    console.log('✅ Upload successful!', data);
    const { data: signedUrlData, error: signedError } = await supabase.storage
      .from(bucketName)
      .createSignedUrl(`tests/${fileName}`, 157680000); 
    if (signedError) {
      console.error('❌ Signed URL failed:', signedError.message);
      return;
    }
    console.log('🔗 Signed URL (5 years):', signedUrlData.signedUrl);
    console.log('🚀 CONNECTION TEST PASSED!');
  } catch (err) {
    console.error('❌ Unexpected error:', err.message);
  }
}
testConnection();
