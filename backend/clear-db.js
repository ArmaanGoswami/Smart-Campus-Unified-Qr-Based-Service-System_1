const MongoClient = require('mongodb').MongoClient;
const uri = 'mongodb+srv://armaangoswami:Armaan2510@armaan.ob3lull.mongodb.net/smart_campus_db?appName=ARMAAN';

async function clearDatabase() {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db('smart_campus_db');
    
    // Delete all documents from collections
    const collections = ['students', 'wardens', 'guards', 'gate_passes'];
    for (let coll of collections) {
      try {
        const result = await db.collection(coll).deleteMany({});
        console.log(`✅ Cleared ${coll}: deleted ${result.deletedCount} documents`);
      } catch (err) {
        console.log(`⚠️  Collection ${coll} may not exist or error: ${err.message}`);
      }
    }
    
    console.log('\n✅ Database cleared successfully!');
  } catch (err) {
    console.error('❌ Error:', err);
  } finally {
    await client.close();
  }
}

clearDatabase();
