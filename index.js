import NotionDBProperty from './models/db-property.js';
import { Client } from '@notionhq/client';

export default class NotionObjectStore {
    constructor(secret_key, database_id, property_map) {
        this.client = new Client({ auth: secret_key });
        this.property_map = property_map;
        this.database_id = database_id;
        this.schema = {};
        this.initialized = false;
    }

    async init() {
        // Initialize the object with the schema from the database
        const response = await this.client.databases.retrieve({
            database_id: this.database_id
        });
        // The response contains the schema of the database
        for (const property of Object.keys(response.properties)) {
            this.schema[property] = response.properties[property].type;
        }
        this.initialized = true;
    }

    async persist(instance) {
        if (!this.initialized) await this.init();

        // First, we need to convert the instance to a Notion object
        const notion_properties = {};
        let page_id = null;
        for (const object_property in instance) {
            if (object_property === 'id') {
                // Special field -- use this to update an existing object
                page_id = instance[object_property];
                continue;
            }
            const notion_property = this.property_map[object_property];
            const notion_type = this.schema[notion_property];
            if (!notion_type) {
                throw new Error(`Property [${object_property}] not found in property map.`);
            }
            notion_properties[notion_property] = new NotionDBProperty(notion_type).serialize(instance[object_property]);
        }

        // Then, we can persist the object to the database
        if (page_id) {
            await this.client.pages.update({
                page_id: page_id,
                properties: notion_properties
            });
        } else {
            let response = await this.client.pages.create({
                parent: { database_id: this.database_id },
                properties: notion_properties
            });
            instance.id = response.id;
        }
        return instance;
    }

    async retrieve(id) {
        if (!this.initialized) await this.init();

        // Retrieve an instance of the object from the database
        const response = await this.client.pages.retrieve({
            page_id: id
        });
        const instance = {};
        for (const object_property in this.property_map) {
            const notion_property = this.property_map[object_property];
            const notion_type = this.schema[notion_property];
            instance[object_property] = new NotionDBProperty(notion_type).deserialize(response.properties[notion_property]);
        }
        instance.id = response.id;
        return instance;
    }

    async query(args) {
        if (!this.initialized) await this.init();

        // Query the database for objects that match the filter
        const { filter, sorts } = args; 
        const notion_query = {
            database_id: this.database_id
        };
        if (filter) notion_query.filter = filter;
        if (sorts) notion_query.sorts = sorts;
        
        const response = await this.client.databases.query(notion_query);
        const instances = [];
        for (const page of response.results) {
            const instance = {};
            for (const object_property in this.property_map) {
                const notion_property = this.property_map[object_property];
                const notion_type = this.schema[notion_property];
                instance[object_property] = new NotionDBProperty(notion_type).deserialize(page.properties[notion_property]);
            }
            instance.id = page.id;
            instances.push(instance);
        }
        return instances;
    }
    
    async delete(id) {
        if (!this.initialized) await this.init();

        // Delete an instance of the object from the database
        await this.client.pages.update({
            page_id: id,
            archived: true
        });
    }
    
}