import * as dotenv from 'dotenv';
import NotionObjectStore from './index.js';
dotenv.config();

const notionObjectStore = new NotionObjectStore(process.env.NOTION_SECRET_KEY, process.env.NOTION_DATABASE_ID, {
    "name": "Name",
    "amount": "Amount",
    "note": "Note",
    "created_by_discord_id": "Created by",
    "created_at": "Created at",
});

const all = await notionObjectStore.query();
console.log(all);

const positive = await notionObjectStore.query({
    property: "Amount",
    number: {
        greater_than: 0
    }
});

console.log(positive);