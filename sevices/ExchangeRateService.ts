import axios from 'axios';
import * as cheerio from 'cheerio';
class StoreItem {
    constructor(public value: string, public expireAt: number) { }
}
class Store {
    private store: Map<string, StoreItem>;

    constructor() {
        this.store = new Map<string, StoreItem>();
    }

    public setItem(key: string, value: string, ttl: number): void {
        const expireAt = Date.now() + ttl * 1000;
        const item = new StoreItem(value, expireAt);
        this.store.set(key, item);
    }

    public getItem(key: string): string | null {
        const item = this.store.get(key);
        if (!item) {
            return null;
        }
        if (Date.now() > item.expireAt) {
            this.store.delete(key);
            return null;
        }
        return item.value;
    }

    public deleteItem(key: string): void {
        this.store.delete(key);
    }

    public cleanUp(): void {
        const now = Date.now();
        this.store.forEach((item, key) => {
            if (now > item.expireAt) {
                this.store.delete(key);
            }
        })
    }
}

export const StoreCache = new Store()
const VCBExchangeKey = "VCBExchangeKey"
export class ExchangeRateService {
    public static readonly UrlVCB = "https://portal.vietcombank.com.vn/UserControls/TVPortal.TyGia/pListTyGia.aspx?txttungay={0}&BacrhID=1&isEn=False";

    public async GetExchangeRateVCBTableAsync(cancellationToken?: AbortSignal): Promise<{ [key: string]: number }> {
        const cacheValue = StoreCache.getItem(VCBExchangeKey)
        let exchangeRates: { [key: string]: number } = cacheValue ? JSON.parse(cacheValue) : {};
        if (!cacheValue) {
            const url = ExchangeRateService.UrlVCB.replace("{0}", new Date(Date.now() + 7 * 60 * 60 * 1000).toLocaleDateString('en-GB'));
            let config = {
                method: 'get',
                maxBodyLength: Infinity,
                url: url,
                headers: {
                    'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
                    'accept-language': 'vi-VN,vi;q=0.9,fr-FR;q=0.8,fr;q=0.7,en-US;q=0.6,en;q=0.5,zh-CN;q=0.4,zh;q=0.3',
                    'cache-control': 'no-cache',
                    'pragma': 'no-cache',
                    'priority': 'u=0, i',
                    'sec-ch-ua': '"Not/A)Brand";v="8", "Chromium";v="126", "Google Chrome";v="126"',
                    'sec-ch-ua-mobile': '?0',
                    'sec-ch-ua-platform': '"Windows"',
                    'sec-fetch-dest': 'document',
                    'sec-fetch-mode': 'navigate',
                    'sec-fetch-site': 'none',
                    'sec-fetch-user': '?1',
                    'upgrade-insecure-requests': '1',
                    'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
                }
            };

            const response = await axios.request(config)

            const content = response.data;
            const $ = cheerio.load(content);
            const rows = $('tr');
            rows.each((_, row) => {
                const columns = $(row).find('td');
                if (columns.length > 0) {
                    const key = $(columns[1]).text().trim();
                    const value = parseFloat($(columns[2]).text().replace(/,/, ''));
                    if (!isNaN(value)) {
                        exchangeRates[key] = value;
                    }
                }
            });
            StoreCache.setItem(VCBExchangeKey, JSON.stringify(exchangeRates), 600)
            console.log(exchangeRates, "no cache");

        } else {
            console.log(exchangeRates, "cache");
        }
        return exchangeRates;
    }
}
