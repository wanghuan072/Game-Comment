// 游戏数据配置 - 模板项目
// 修改此文件来配置您的游戏列表
export const games = [
    {
        id: 1,
        title: "示例游戏", // 游戏标题
        keywords: "示例,游戏,模板", // SEO关键词
        addressBar: "example-game", // URL路径标识符
        publishDate: "2024-01-01", // 发布日期
        imageUrl: "https://picsum.photos/200", // 游戏封面图
        imageAlt: "示例游戏封面", // 图片alt文本
        iframeUrl: "https://example.com/game", // 游戏iframe地址
        seo: {
            title: "示例游戏 - 在线游戏", // SEO标题
            description: "这是一个示例游戏，用于演示评论评分系统", // SEO描述
            keywords: "示例游戏,在线游戏,免费游戏" // SEO关键词
        },
        detailsHtml: `
            <h1>示例游戏</h1>
            <p>这是一个示例游戏，用于演示评论评分系统的功能。</p>
            <p>您可以修改此文件来配置您自己的游戏数据。</p>
        `
    },
    {
        id: 2,
        title: "测试游戏AAA", 
        keywords: "测试,游戏,AAA", 
        addressBar: "aaa", // 对应数据库中的 game_address_bar
        publishDate: "2024-01-02", 
        imageUrl: "https://picsum.photos/201", 
        imageAlt: "测试游戏AAA封面", 
        iframeUrl: "https://example.com/game-aaa", 
        seo: {
            title: "测试游戏AAA - 在线游戏", 
            description: "测试游戏AAA，有很多用户评论和评分", 
            keywords: "测试游戏,AAA,在线游戏" 
        },
        detailsHtml: `
            <h1>测试游戏AAA</h1>
            <p>这是一个测试游戏，已经有用户评论和评分数据。</p>
            <p>可以看到真实的用户反馈。</p>
        `
    },
    {
        id: 3,
        title: "测试游戏", 
        keywords: "测试,游戏", 
        addressBar: "test-game", // 对应数据库中的 game_address_bar
        publishDate: "2024-01-03", 
        imageUrl: "https://picsum.photos/202", 
        imageAlt: "测试游戏封面", 
        iframeUrl: "https://example.com/test-game", 
        seo: {
            title: "测试游戏 - 在线游戏", 
            description: "另一个测试游戏", 
            keywords: "测试游戏,在线游戏" 
        },
        detailsHtml: `
            <h1>测试游戏</h1>
            <p>这是另一个测试游戏。</p>
        `
    }
    // 添加更多游戏...
]