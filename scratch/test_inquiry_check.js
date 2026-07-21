const fs = require('fs');
const path = require('path');

async function testSubmitInquiry() {
  const LOCAL_STORAGE_PATH = path.join(__dirname, 'scratch', 'component_inquiries_db.json');
  console.log("Checking local storage file path:", LOCAL_STORAGE_PATH);
  
  if (fs.existsSync(LOCAL_STORAGE_PATH)) {
    const data = fs.readFileSync(LOCAL_STORAGE_PATH, 'utf8');
    console.log("Current inquiries in local DB:", JSON.parse(data));
  } else {
    console.log("Local inquiries file does not exist yet.");
  }
}

testSubmitInquiry();
