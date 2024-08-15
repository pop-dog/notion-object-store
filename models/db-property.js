export default class NotionDBProperty {
    // https://developers.notion.com/reference/page-property-values
    constructor(type) {
        this.type = type;
        switch (type) {
            case 'checkbox':
                this.value = new NotionCheckboxProperty();
                break;
            case 'date':
                this.value = new NotionDateProperty();
                break;
            case 'number':
                this.value = new NotionNumberProperty();
                break;
            case 'title':
                this.value = new NotionTitleProperty();
                break;
            case 'rich_text':
                this.value = new NotionTextProperty();
                break;
            default:
                throw new Error(`Unsupported property type [${type}].`);
        }
    }

    deserialize(notion_property) {
        return this.value.deserialize(notion_property);
    }

    serialize(value) {
        return this.value.serialize(value);
    }

    schema() {
        return {
            type: this.type,
            [this.type]: {}
        }
    }
}

class NotionCheckboxProperty {
    constructor() {}

    deserialize(notion_checkbox_object) {
        return notion_checkbox_object.checkbox;
    }

    serialize(boolean) {
        return {
            type: 'checkbox',
            checkbox: boolean
        }
    }
}

class NotionDateProperty {
    constructor() { }

    deserialize(notion_date_object) {
        return new Date(notion_date_object.date.start);
    }

    serialize(date) {
        return {
            type: 'date',
            date: {
                start: date.toISOString()
            }
        }
    }
}

class NotionNumberProperty {
    constructor() { }

    deserialize(notion_number_object) {
        return notion_number_object.number;
    }

    serialize(number) {
        return {
            type: 'number',
            number: number
        }
    }
}

class NotionTitleProperty {
    constructor() { }

    deserialize(notion_title_object) {
        if (notion_title_object.title.length === 0) return '';
        return notion_title_object.title[0].text.content;
    }

    serialize(text) {
        return {
            type: 'title',
            title: [
                {
                    text: {
                        content: text
                    }
                }
            ]
        }
    }
}

class NotionTextProperty {
    constructor() { }

    deserialize(notion_text_object) {
        if (notion_text_object.rich_text.length === 0) return '';
        return notion_text_object.rich_text[0].text.content;
    }

    serialize(text) {
        return {
            type: 'rich_text',
            rich_text: [
                {
                    text: {
                        content: text
                    }
                }
            ]
        }
    }
}