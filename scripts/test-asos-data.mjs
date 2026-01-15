/**
 * Test script to fetch ASOS dataset CSV
 */

async function fetchAsosData() {
  console.log('Fetching ASOS dataset...\n');
  
  // The file is products_asos.csv based on the siblings list
  const csvUrl = 'https://huggingface.co/datasets/TrainingDataPro/asos-e-commerce-dataset/resolve/main/products_asos.csv';
  
  console.log('Trying:', csvUrl);
  
  try {
    const res = await fetch(csvUrl);
    console.log('Status:', res.status, res.statusText);
    
    if (res.ok) {
      const text = await res.text();
      console.log('\n✅ SUCCESS! Got', text.length, 'bytes');
      
      // Parse CSV manually (simple approach for testing)
      const lines = text.split('\n');
      console.log('Total lines:', lines.length);
      
      // Show header
      console.log('\nHeader:', lines[0].substring(0, 200) + '...');
      
      // Show first few rows
      console.log('\n=== SAMPLE DATA (first 3 products) ===\n');
      
      for (let i = 1; i <= 3 && i < lines.length; i++) {
        console.log(`\n--- Row ${i} ---`);
        console.log(lines[i].substring(0, 500) + '...');
      }
      
      // Try to find an image URL in the data
      console.log('\n=== Looking for image URLs ===');
      const sampleLine = lines[1];
      const imageMatch = sampleLine.match(/https:\/\/images\.asos-media\.com[^\s,"\]]+/);
      
      if (imageMatch) {
        console.log('Found image URL:', imageMatch[0]);
        
        // Test if it works
        const imgRes = await fetch(imageMatch[0], { method: 'HEAD' });
        console.log('Image accessible:', imgRes.ok ? '✅ YES' : '❌ NO', `(${imgRes.status})`);
      } else {
        console.log('No image URL pattern found in first row');
      }
      
    }
  } catch (e) {
    console.log('Error:', e.message);
  }
}

fetchAsosData();
