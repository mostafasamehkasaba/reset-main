const url = "https://invoice.looptech.cloud/api/invoices";
const payload = {
    invoiceNumber: "INV-9999",
    clientId: 1,
};

fetch(url, {
    method: "POST",
    headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
    },
    body: JSON.stringify(payload)
}).then(res => res.json().then(j => console.log(res.status, j)).catch(e => console.log(res.status, e)))
  .catch(err => console.error("Error", err));
