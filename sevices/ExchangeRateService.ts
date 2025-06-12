import { IRateMoneyResponse } from '@/models';
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
export const configCahe = {
    Expire: 6 * 3600
}
export class ExchangeRateService {
    public static readonly UrlVCB = "https://www.vietcombank.com.vn/api/exchangerates?date={0}";
    public async RefreshExchangeVCBTableAsync() {
        let exchangeRates: { [key: string]: number | string } = {};
        const date = new Date(Date.now() + 7 * 60 * 60 * 1000).toISOString().slice(0, 10)
        console.log(`Fetching exchange rates for date: ${date}`);
        const url = ExchangeRateService.UrlVCB.replace("{0}", date);
        let config = {
            method: 'get',
            maxBodyLength: Infinity,
            url: url,
        };
        const response = await axios.request(config)
        const content = response.data as IRateMoneyResponse;
        content.Data.reduce((acc, item) => {
            if (item.currencyCode && item.transfer) {
                acc[item.currencyCode] = parseFloat(item.cash);
            }
            return exchangeRates
        }, exchangeRates);
        exchangeRates["date"] = new Date().toISOString()
        StoreCache.setItem(VCBExchangeKey, JSON.stringify(exchangeRates), configCahe.Expire)
        return exchangeRates;
    }
    public async GetExchangeRateVCBTableAsync(cancellationToken?: AbortSignal): Promise<{ [key: string]: number | string }> {
        const cacheValue = StoreCache.getItem(VCBExchangeKey)
        let exchangeRates: { [key: string]: number | string } = cacheValue ? JSON.parse(cacheValue) : {};
        if (!cacheValue) {
            exchangeRates = await this.RefreshExchangeVCBTableAsync()
            console.log(exchangeRates, "no cache");
        } else {
            console.log(exchangeRates, "cache");
        }
        return exchangeRates;
    }
}
