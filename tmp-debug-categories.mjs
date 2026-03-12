
const url = "https://invoice.looptech.cloud/api/categories";

async function test() {
    try {
        const res = await fetch(url, {
            headers: {
                "Accept": "application/json"
            }
        });
        const j = await res.json();
        console.log("Status:", res.status);
        console.log("Data:", JSON.stringify(j, null, 2));
    } catch (e) {
        console.error(e);
    }
}

test();
