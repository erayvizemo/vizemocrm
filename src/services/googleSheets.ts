const GOOGLE_SHEETS_URL = 'https://script.google.com/macros/s/AKfycbzGuicKk1D7z-0RWpOncP0vEf8e_yc2HE9rElznuNDCqnbRRHrQ7OyW6avTFKyasVW1hA/exec';

export interface SheetCustomerData {
    id: string;
    ad: string;
    telefon: string;
    email: string;
    vize: string;
    danisman: string;
    sehir: string;
    ulke: string;
    durum: string;
    statu: string;
    kaynak: string;
    surec: string;
    karar: string;
    evrakPct: string;
    gorusme: string;
    takip: string;
    not: string;
    createdAt: string;
}

export async function sendToGoogleSheets(data: SheetCustomerData): Promise<boolean> {
    try {
        const response = await fetch(GOOGLE_SHEETS_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });
        // no-cors returns opaque response, so we can't read status
        // but if fetch didn't throw, the request was sent successfully
        console.log('[Google Sheets] Müşteri verisi gönderildi:', data.ad);
        return true;
    } catch (error) {
        console.error('[Google Sheets] Veri gönderilemedi:', error);
        return false;
    }
}
