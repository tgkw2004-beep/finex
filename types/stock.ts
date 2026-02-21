// Stock related types
export interface StockInfo {
    symbol: string
    name: string
    price: number
    change: number
    changePercent: number
    isPositive: boolean
}

export interface CompanyInfo {
    corpCode: string
    corpName: string
    stockName: string
    stockCode: string
    ceoName: string
    corpCls: string
    industry?: string
    sector?: string
    employees?: string
    founded?: string
    headquarters?: string
    website?: string
    description?: string
}

export interface FinancialData {
    revenue: string
    operatingProfit: string
    netProfit: string
    eps: string
    per: string
    pbr: string
    roe: string
    debtRatio: string
    quarterlyData: QuarterlyData[]
    yearlyData: YearlyData[]
}

export interface QuarterlyData {
    quarter: string
    revenue: string
    operatingProfit: string
    netProfit: string
}

export interface YearlyData {
    year: string
    revenue: string
    operatingProfit: string
    netProfit: string
}

export interface VolumeData {
    date: string
    volume: number
    tradingValue: number
    buyStrength: number
    foreignOwnership: number
}

export interface StockPrice {
    date: string
    open: number
    high: number
    low: number
    close: number
    volume: number
}

// Database table types (from remote_ schemas)
export interface DartCompanyInfo {
    corp_code: string
    corp_name: string
    corp_name_eng?: string
    stock_name: string
    stock_code: string
    ceo_nm: string
    corp_cls: string
    jurir_no?: string
    bizr_no?: string
    adres?: string
    hm_url?: string
    ir_url?: string
    phn_no?: string
    fax_no?: string
    induty_code?: string
    induty_name?: string
    est_dt?: string
    acc_mt?: string
}

export interface InvestResourceAll {
    id?: number
    date: string
    price: number
    big_cate: string
    small_cate: string
    per?: number
    market?: string
    seq?: number
}

export interface YfinStockPrice {
    id?: number
    date: string
    open: number
    high: number
    low: number
    close: number
    volume: number
    dividen?: number
    stock_spl?: number
    ticker?: string
}

// KRX Stock OHLCV data
export interface KrxStockOhlcv {
    date: string
    code: string
    open: number
    high: number
    low: number
    close: number
    volume: number
    trade_value: number
    change_rate: number
}

// DART Financial Statement data
export interface DartFinancialStatement {
    stock_code: string
    bsns_year: string
    reprt_code: string
    account_nm: string
    thstrm_amount: string
    thstrm_add_amount?: string
    frmtrm_amount?: string
    frmtrm_add_amount?: string
}
