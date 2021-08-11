const webpack = require('webpack');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const path = require('path');
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');

const NODE_ENV = JSON.stringify(
    process.env.NODE_ENV ? process.env.NODE_ENV : 'development'
);
const devtool = NODE_ENV == '"development"' ? 'source-map' : undefined;

module.exports = {
    devtool,
    experiments: {
        outputModule: true,
    },
    optimization: {
        minimize: true,
    },
    entry: {
        // Global
        ReSubstitute: ['./src/ReSubstitute.ts'],
    },
    output: {
        path: path.join(__dirname, '/dist'),
        filename: '[name].js',
        libraryTarget: 'module',
    },
    resolve: {
        extensions: ['.js', '.jsx', '.ts', '.tsx'],
    },
    plugins: [
        new webpack.DefinePlugin({
            'process.env': {
                NODE_ENV: JSON.stringify(process.env.NODE_ENV),
            },
        }),
        new BundleAnalyzerPlugin({
            analyzerMode: 'static',
            reportFilename: '../analyzer/lib.html',
            openAnalyzer: false,
        }),
        new CopyWebpackPlugin({
            patterns: [
                {
                    from: './README.md',
                    to: './README.md',
                },
                {
                    from: './package.json',
                    to: './package.json',
                    transform(content, path) {
                        // Transform the content of package.json
                        const packageJson = JSON.parse(content);
                        return JSON.stringify(
                            {
                                ...packageJson,
                                version: process.env.RELEASE_VERSION
                                    ? process.env.RELEASE_VERSION.replace(
                                          'v',
                                          ''
                                      )
                                    : packageJson.version,
                            },
                            null,
                            2
                        );
                    },
                },
                {
                    from: './package.json',
                    to: './package.github.json',
                    transform(content, path) {
                        // Transform the content of package.json for GitHub Packages
                        const packageJson = JSON.parse(content);
                        return JSON.stringify(
                            {
                                ...packageJson,
                                name: '@fdmediagroep/resubstitute',
                                version: process.env.RELEASE_VERSION
                                    ? process.env.RELEASE_VERSION.replace(
                                          'v',
                                          ''
                                      )
                                    : packageJson.version,
                            },
                            null,
                            2
                        );
                    },
                },
            ],
        }),
    ],
    module: {
        strictExportPresence: true,
        rules: [
            { parser: { requireEnsure: false } },
            // all files with a `.ts` or `.tsx` extension will be handled by a TypeScript loader
            {
                test: /\.tsx?$/,
                use: [
                    {
                        loader: 'ts-loader',
                        options: {
                            configFile: 'tsconfig.json',
                        },
                    },
                ],
            },
        ],
    },
};
