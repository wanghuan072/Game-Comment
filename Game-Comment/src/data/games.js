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
    }
    // 添加更多游戏...
]