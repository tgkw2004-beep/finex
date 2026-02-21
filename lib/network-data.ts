// Network data generator for 80 nodes
const generateSamsungNetwork = () => {
    const nodes = [
        // Core companies (Tier 1)
        { id: '005930', name: '삼성전자', revenue: 3000000, change: 1.5, isListed: true },
        { id: '028260', name: '삼성물산', revenue: 700000, change: -0.8, isListed: true },
        { id: '016360', name: '삼성증권', revenue: 50000, change: 2.1, isListed: true },
        { id: '009150', name: '삼성전기', revenue: 100000, change: -1.2, isListed: true },
        { id: '000810', name: '삼성화재', revenue: 300000, change: 0.5, isListed: true },
        { id: '032830', name: '삼성생명', revenue: 250000, change: 1.8, isListed: true },
        { id: '010140', name: '삼성중공업', revenue: 180000, change: -0.3, isListed: true },
        { id: '018260', name: '삼성SDS', revenue: 120000, change: 3.2, isListed: true },
        { id: '028050', name: '삼성엔지니어링', revenue: 90000, change: 1.1, isListed: true },
        { id: '006400', name: '삼성SDI', revenue: 200000, change: 2.5, isListed: true },

        // Tier 2 - Major subsidiaries (10 more)
        { id: 'S011', name: '삼성디스플레이', revenue: 280000, change: -1.5, isListed: false },
        { id: 'S012', name: '삼성바이오로직스', revenue: 160000, change: 4.2, isListed: true },
        { id: 'S013', name: '삼성전자서비스', revenue: 45000, change: 0.8, isListed: false },
        { id: 'S014', name: '삼성카드', revenue: 85000, change: 1.3, isListed: true },
        { id: 'S015', name: '삼성자산운용', revenue: 35000, change: 2.0, isListed: false },
        { id: 'S016', name: '삼성생명보험', revenue: 220000, change: -0.5, isListed: false },
        { id: 'S017', name: '삼성증권자산운용', revenue: 28000, change: 1.7, isListed: false },
        { id: 'S018', name: '삼성벤처투자', revenue: 15000, change: 3.5, isListed: false },
        { id: 'S019', name: '삼성웰스토리', revenue: 42000, change: 0.9, isListed: false },
        { id: 'S020', name: '에스원', revenue: 38000, change: 1.2, isListed: true },
    ]

    // Generate 60 more nodes
    for (let i = 21; i <= 80; i++) {
        const types = ['연구소', '사업부', '지사', '공장', '센터']
        const regions = ['수원', '기흥', '화성', '평택', '천안', '구미', '광주', '울산', '아산']
        const type = types[Math.floor(Math.random() * types.length)]
        const region = i > 50 ? regions[Math.floor(Math.random() * regions.length)] : ''

        nodes.push({
            id: `S${String(i).padStart(3, '0')}`,
            name: region ? `삼성${region}${type}` : `삼성${type}${i}`,
            revenue: Math.floor(Math.random() * 150000) + 10000,
            change: (Math.random() - 0.5) * 10,
            isListed: Math.random() > 0.9
        })
    }

    const links = []
    // Connect core companies to Samsung Electronics
    for (let i = 1; i < 10; i++) {
        links.push({ source: nodes[0].id, target: nodes[i].id, relationship: '계열사' })
    }

    // Connect remaining nodes in a hierarchical structure
    for (let i = 10; i < 80; i++) {
        const parentIdx = Math.max(0, Math.floor(i / 8))
        links.push({ source: nodes[parentIdx].id, target: nodes[i].id, relationship: '자회사' })
    }

    return { nodes, links }
}

// Network data for different companies
export const getNetworkData = (symbol: string) => {
    // Samsung Group network - 80 nodes
    if (symbol === '005930') {
        return generateSamsungNetwork()
    }

    // Hanwha Group network
    if (symbol === '009830') {
        return {
            nodes: [
                { id: '009830', name: '한화솔루션', revenue: 100000, change: -1.5, isListed: true },
                { id: '000880', name: '한화', revenue: 150000, change: 0.8, isListed: true },
                { id: '003410', name: '쌍용C&E', revenue: 80000, change: 1.2, isListed: true },
                { id: 'H004', name: '한화에어로스페이스', revenue: 95000, change: 2.3, isListed: true },
                { id: 'H005', name: '한화시스템', revenue: 62000, change: 1.7, isListed: true },
                { id: 'H006', name: '한화생명', revenue: 185000, change: 0.5, isListed: true },
                { id: 'H007', name: '한화손해보험', revenue: 125000, change: -0.3, isListed: true },
                { id: 'H008', name: '한화자산운용', revenue: 42000, change: 1.9, isListed: false },
                { id: 'H009', name: '한화투자증권', revenue: 58000, change: 2.1, isListed: true },
                { id: 'H010', name: '한화호텔앤드리조트', revenue: 38000, change: 3.2, isListed: false },
            ],
            links: [
                { source: '009830', target: '000880', relationship: '계열사' },
                { source: '009830', target: '003410', relationship: '계열사' },
                { source: '000880', target: 'H004', relationship: '자회사' },
                { source: '000880', target: 'H005', relationship: '자회사' },
                { source: '000880', target: 'H006', relationship: '자회사' },
                { source: 'H006', target: 'H007', relationship: '계열사' },
                { source: 'H006', target: 'H008', relationship: '자회사' },
                { source: '000880', target: 'H009', relationship: '자회사' },
                { source: '000880', target: 'H010', relationship: '자회사' },
            ]
        }
    }

    // Default: single node
    return {
        nodes: [
            { id: symbol, name: '현재 기업', revenue: 100000, change: 0, isListed: true },
        ],
        links: []
    }
}
