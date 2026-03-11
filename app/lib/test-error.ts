import { getErrorMessage, ApiError } from "./fetcher";

const err1 = new ApiError("فشل الطلب (422).", 422, null);
console.log("Error 1:", getErrorMessage(err1, "تعذر حفظ الفاتورة."));

const err2 = new Error("تعذر الاتصال بالخادم. تحقق من إعداد رابط الـ API أو سياسات CORS.");
console.log("Error 2:", getErrorMessage(err2, "تعذر حفظ الفاتورة."));

const err3 = new ApiError("Unauthenticated.", 401, null);
console.log("Error 3:", getErrorMessage(err3, "تعذر حفظ الفاتورة."));

const err4 = new Error();
console.log("Error 4:", getErrorMessage(err4, "تعذر حفظ الفاتورة."));
