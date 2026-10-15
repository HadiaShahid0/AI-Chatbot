import { ChromaClient } from "chromadb";

const client = new ChromaClient({
  host: "localhost",
  port: 8000,
  ssl: false,
});

async function viewAllCollections() {
    try {
        const collections = await client.listCollections();
        const cleanNames = collections.map(col => col.name);
        console.log("Your ChromaDB Collections:", cleanNames);
    } catch (error) {
        console.error("Error fetching collections:", error);
    }
}

async function checkCollectionSize() {
    try {
        const collection = await client.getCollection({ name: "chat_documents" });
        const totalDocs = await collection.count();
        console.log(`Total documents inside 'chat_documents': ${totalDocs}`);
    } catch (error) {
        console.error("Error:", error);
    }
}

async function viewCollectionData() {
    try {
        const collection = await client.getCollection({ name: "chat_documents" });

        const data = await collection.get({
            limit: 11, 
            include: ["documents", "metadatas"] 
        });

        for (let i = 0; i < data.ids.length; i++) {
            console.log(`--- [ID: ${data.ids[i]}] ---`);
            console.log(`Metadata:`, data.metadatas[i]);
            console.log(`Content:\n${data.documents[i]}\n`);
        }
    } catch (error) {
        console.error("Error viewing data:", error);
    }
}
checkCollectionSize()
viewAllCollections()
viewCollectionData();

