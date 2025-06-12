export interface IRateMoneyResponse {
    Count: number
    Date: string
    UpdatedDate: string
    Data: Daum[]
}

export interface Daum {
    currencyName: string
    currencyCode: string
    cash: string
    transfer: string
    sell: string
    icon: string
}
