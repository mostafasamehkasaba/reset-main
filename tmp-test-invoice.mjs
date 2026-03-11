const url = "https://invoice.looptech.cloud/api/invoices";
const payload = {
    "invoiceNumber": "INV-0005",
    "invoice_number": "INV-0005",
    "number": "INV-0005",
    "issueDate": "2026-03-12",
    "issue_date": "2026-03-12",
    "date": "2026-03-12",
    "dueDate": "",
    "due_date": "",
    "status": "draft",
    "payment_status": "draft",
    "currency": "OMR",
    "currency_code": "OMR",
    "paymentMethod": "cash",
    "payment_method": "cash",
    "clientId": 1,
    "client_id": 1,
    "clientName": "عميل 1",
    "client_name": "عميل 1",
    "clientEmail": "",
    "client_email": "",
    "clientPhone": "",
    "client_phone": "",
    "clientAddress": "",
    "client_address": "",
    "notes": "Thank you for your business.",
    "paidAmount": 0,
    "paid_amount": 0,
    "totals": {
        "subtotal": 12,
        "discount": 0,
        "tax": 1.8,
        "total": 13.8
    },
    "subtotal": 12,
    "discount": 0,
    "tax": 1.8,
    "total": 13.8,
    "items": [
        {
            "itemType": "service",
            "item_type": "service",
            "name": "dfghjkl;",
            "price": 12,
            "quantity": 1,
            "discountType": "amount",
            "discount_type": "amount",
            "discountValue": 0,
            "discount_value": 0,
            "taxRate": 15,
            "tax_rate": 15
        }
    ],
    "line_items": [
        {
            "itemType": "service",
            "item_type": "service",
            "name": "dfghjkl;",
            "price": 12,
            "quantity": 1,
            "discountType": "amount",
            "discount_type": "amount",
            "discountValue": 0,
            "discount_value": 0,
            "taxRate": 15,
            "tax_rate": 15
        }
    ]
}

fetch(url, {
    method: "POST",
    headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
    },
    body: JSON.stringify(payload)
}).then(res => res.json().then(j => console.log(res.status, JSON.stringify(j)))).catch(e => console.error(e));
