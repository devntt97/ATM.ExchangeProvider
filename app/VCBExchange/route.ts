import { configCahe, ExchangeRateService } from "@/sevices/ExchangeRateService"
import { NextRequest, NextResponse } from "next/server"

export const GET = async () => {
    const service = new ExchangeRateService()
    const data = await service.GetExchangeRateVCBTableAsync()
    return new NextResponse(JSON.stringify(data))
}
export const PUT = async () => {
    const service = new ExchangeRateService()
    const data = await service.RefreshExchangeVCBTableAsync()
    return new NextResponse(JSON.stringify(data))
}

export const PATCH = async (request: NextRequest) => {
    configCahe.Expire = parseInt(request.nextUrl.searchParams.get("expire") ?? (6 * 3600).toString())
    return new NextResponse(JSON.stringify(configCahe))
}