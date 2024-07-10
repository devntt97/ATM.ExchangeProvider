import { ExchangeRateService } from "@/sevices/ExchangeRateService"
import { NextResponse } from "next/server"

export const GET = async () => {
    const service = new ExchangeRateService()
    const data = await service.GetExchangeRateVCBTableAsync()
    return new NextResponse(JSON.stringify(data))
}