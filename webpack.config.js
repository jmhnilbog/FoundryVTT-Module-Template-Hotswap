/* eslint-disable */
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const SymlinkWebpackPlugin = require('symlink-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');
const ESLintPlugin = require('eslint-webpack-plugin');
const globImporter = require('node-sass-glob-importer');
const path = require('path');
const glob = require('glob');

const allTemplates = () => {
    return glob
        .sync('**/*.html', { cwd: path.join(__dirname, 'static/templates') })
        .map((file) => `"modules/template/templates/${file}"`)
        .join(', ');
};

module.exports = (env) => {
    const defaults = {
        watch: false,
        mode: 'development',
    };

    const environment = { ...defaults, ...env };
    const isDevelopment = environment.mode === 'development';

    const config = {
        entry: './src/module.ts',
        watch: environment.watch,
        devtool: 'inline-source-map',
        stats: 'minimal',
        mode: environment.mode,
        resolve: {
            extensions: ['.wasm', '.mjs', '.ts', '.js', '.json'],
        },
        output: {
            filename: 'module.js',
            path: path.resolve(__dirname, 'dist'),
            publicPath: '',
        },
        devServer: {
            hot: true,
            writeToDisk: true,
            proxy: [
                {
                    context: (pathname) => {
                        return !pathname.match('^/sockjs');
                    },
                    target: 'http://localhost:30000',
                    ws: true,
                },
            ],
        },
        module: {
            rules: [
                isDevelopment
                    ? { test: /\.html$/, loader: 'raw-loader' }
                    : { test: /\.html$/, loader: 'null-loader' },
                {
                    test: /\.ts$/,
                    use: [
                        'ts-loader',
                        'webpack-import-glob-loader',
                        'source-map-loader',
                        {
                            loader: 'string-replace-loader',
                            options: {
                                search: '"__ALL_TEMPLATES__"',
                                replace: allTemplates,
                            },
                        },
                    ],
                },
                {
                    test: /\.s[ac]ss$/i,
                    use: [
                        MiniCssExtractPlugin.loader || 'style-loader',
                        {
                            loader: 'css-loader',
                            options: {
                                sourceMap: isDevelopment,
                                url: false,
                            },
                        },
                        {
                            loader: 'sass-loader',
                            options: {
                                sourceMap: isDevelopment,
                                sassOptions: {
                                    importer: globImporter(),
                                },
                            },
                        },
                    ],
                },
            ],
        },
        plugins: [
            new CleanWebpackPlugin(),
            new ESLintPlugin({
                extensions: ['ts'],
            }),
            new CopyPlugin({
                patterns: [
                    {
                        from: 'static',
                        noErrorOnMissing: true,
                    },
                ],
            }),
            new SymlinkWebpackPlugin([
                { origin: '../packs', symlink: 'packs', force: true },
            ]),
            new MiniCssExtractPlugin({
                // Options similar to the same options in webpackOptions.output
                // both options are optional
                filename: 'styles/[name].css',
                chunkFilename: 'styles/[id].css',
            }),
        ],
    };

    if (!isDevelopment) {
        delete config.devtool;
    }

    return config;
};
