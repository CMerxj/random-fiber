const path = require("path");

let APP_NAME_LIST = [
    // 演示站
    "fiber-visualization",
];
let APP_NAME = APP_NAME_LIST[0];

let isProduction = process.env.NODE_ENV == "production";

let CompressionWebpackPlugin = require("compression-webpack-plugin");
// !gzip 压缩配置
let compress = new CompressionWebpackPlugin({
    filename: (info) => {
        return `${info.path}.gz${info.query}`;
    },
    algorithm: "gzip",
    threshold: 10240,
    test: new RegExp("\\.(" + ["js"].join("|") + ")$"),
    // 只有压缩率小于这个值的资源才会被处理
    minRatio: 0.8,
    deleteOriginalAssets: false, // 删除原文件
});

let getPublicPath = () => {
    //
    let publicPath = "/";
    if (isProduction) {
        publicPath = "/";
    }

    return publicPath;
};

// 随机算法
let randomUuid = () => {
    let str = "";
    for (let i = 0; i < 3; i++) {
        str += Number(parseInt(Math.random() * 100000)).toString(16);
    }
    return str;
};
// let webpack = require("webpack");
// let CommonsChunkPlugin = config.optimization.splitChunks;
const vueConfig = {
    configureWebpack: {
        // webpack plugins
        plugins: [
            compress,
            // Ignore all locale files of moment.js
            // obj_htmlwebpackplugin
            //   new webpack.IgnorePlugin(/^\.\/locale$/, /moment$/)
        ],
        // if prod is on, add externals
        // externals: isProd() ? prodExternals : {}
    },

    chainWebpack: (config) => {
        config.plugin("html").tap((args) => {
            args[0].minify = false;
            return args;
        });

        // config.optimization.splitChunks
        // const svgRule = config.module.rule("svg");

        // 清除已有的所有 loader。
        // 如果你不这样做，接下来的 loader 会附加在该规则现有的 loader 之后。
        // svgRule.uses.clear();

        // !! 修改前 start  2020-9-2 00:04:51
        // svgRule.use("vue-svg-loader").loader("vue-svg-loader");
        // !! 修改前 end 2020-9-2 00:04:51

        // svgRule
        //     .test(/\.svg$/)
        //     .include.add(path.resolve("/src/icons"))
        //     .end()
        //     .use("svg-sprite-loader")
        //     .loader("svg-sprite-loader")
        //     .options({
        //         symbolId: "icon-[name]",
        //     });
        config.module.rules.delete("svg");
        config.module
            .rule("svg-smart")
            .test(/\.svg$/)
            .include.add(path.resolve("src/assets/icons/"))
            .end()
            .use("svg-sprite-loader")
            .loader("svg-sprite-loader")
            .options({
                symbolId: "[name]",
            });
        const fileRule = config.module.rule("file");
        // 再次  clear
        fileRule.uses.clear();
        fileRule
            .test(/\.svg$/)
            .exclude.add(path.resolve("src/assets/icons/"))
            .end()
            .use("file-loader")
            .loader("file-loader");

        // 生成环境才开启
        if ("production" == process.env.NODE_ENV) {
            //最小化代码
            config.optimization.minimize(true);
            //分割代码
            config.optimization
                // 分割代码块
                .splitChunks({
                    chunks: "all",
                    minChunks: 1,
                    maxInitialRequests: Infinity,
                    maxAsyncRequests: 500,
                    minSize: 120000, // 依赖包超过300000bit将被单独打包
                    automaticNameDelimiter: "-",
                    cacheGroups: {
                        vendor: {
                            test: /[\\/]node_modules[\\/]/,
                            name(module) {
                                // 隐藏包名  安全
                                const packageName = module.context.match(
                                    /[\\/]node_modules[\\/](.*?)([\\/]|$)/
                                )[1];
                                packageName;
                                // return `chunk.${packageName.replace("@", "")}`;
                                return `chunk.${randomUuid()}`;
                            },
                            priority: 10,
                        },
                    },
                });
        }
    },
    // 开启hash
    filenameHashing: true,
    productionSourceMap: false,
    css: {
        // 源码 关闭
        sourceMap: false,
        loaderOptions: {
            less: {
                lessOptions: {
                    modifyVars: {
                        "primary-color": "#ff6a00",
                        "table-header-color": "#333333",
                        "table-row-hover-bg": "#f5f5f6",
                        "table-header-bg": "#f5f5f6",
                        "btn-danger-color": "#ffffff",
                        "btn-danger-bg": "#f5222d",
                        "link-color": "#42B983",
                    },
                    javascriptEnabled: true,
                },
            },
        },
    },
    parallel: require("os").cpus().length > 1,

    devServer: {
        // 测试环境 不开启host检查
        disableHostCheck: true,
        host: "0.0.0.0",
        port: 8080,
        proxy: {
            "/serverUrl/": {
                // 直接映射到容器
                target: "https://127.0.0.1:9742",
                ws: false,
                //是否允许跨越
                changeOrigin: true,
                pathRewrite: {
                    // 删除 serverUrL
                    "^/serverUrl": "",
                },
            },
            "https://127.0.0.1:8507/": {
                // 直接映射到容器
                target: "https://127.0.0.1:8507",
                ws: true,
                //是否允许跨越
                changeOrigin: true,
                pathRewrite: {
                    // 删除 serverUrL
                    "^https://127.0.0.1:8507": "",
                },

                secure: false,
            },
            // 行情
            "/serverQuotesUrl/": {
                // 直接映射到容器
                target: "https://127.0.0.1:9742",
                ws: false,
                //是否允许跨越
                changeOrigin: true,
                pathRewrite: {
                    // 删除 serverQuotesUrl
                    "^/serverQuotesUrl": "",
                },
            },
            "/StaticResourceUrl/": {
                // 直接映射到容器
                target: "http://192.168.91.129",
                ws: false,
                //是否允许跨越
                changeOrigin: true,
                pathRewrite: {
                    // 删除 serverUrL
                    "^/StaticResourceUrl": "",
                },
            },
        },
    },
    lintOnSave: undefined,
    // !配置部署时的域名 其他什么都不需要改变
    publicPath: getPublicPath(),
    outputDir: "./dist/",
};

module.exports = vueConfig;
