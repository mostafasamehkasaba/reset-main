
const url = "https://invoice.looptech.cloud/api/categories";

async function test() {
    try {
        console.log("Fetching categories from:", url);
        const res = await fetch(url, {
            headers: {
                "Accept": "application/json"
            }
        });
        const data = await res.json();
        
        console.log("--- RAW RESPONSE START ---");
        // console.log(JSON.stringify(data, null, 2));
        
        function extract(payload) {
            if (Array.isArray(payload)) return payload;
            if (payload && typeof payload === 'object') {
                const candidates = [payload.data, payload.categories, payload.items];
                for (const c of candidates) {
                    if (Array.isArray(c)) return c;
                    if (c && typeof c === 'object' && Array.isArray(c.data)) return c.data;
                }
            }
            return [];
        }

        const items = extract(data);
        console.log(`Found ${items.length} items.`);

        items.forEach(item => {
            console.log(`- Item: ${item.name} (ID: ${item.id}, ParentID: ${item.parent_id || item.parentId || item.category_id || 'NONE'})`);
            if (item.name && item.name.toString().includes("لابتوب")) {
                console.log("!!! FOUND TARGET ITEM:", JSON.stringify(item, null, 2));
            }
        });

        if (items.length === 0) {
            console.log("Full response structure:", JSON.stringify(data, null, 2));
        }

        console.log("--- RAW RESPONSE END ---");
    } catch (err) {
        console.error("Test failed:", err);
    }
}

test();
