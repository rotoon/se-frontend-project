const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

module.exports = (env, argv) => {
  const isProduction = argv.mode === 'production';

  return {
    // Entry points for different pages
    entry: {
      main: './assets/js/main.js',
      places: './assets/js/places.js',
      detail: './assets/js/detail.js',
      'travel-style': './assets/js/travel-style.js'
    },

    // Output configuration
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: isProduction ? 'js/[name].[contenthash].js' : 'js/[name].js',
      clean: true, // Clean dist folder on each build
      publicPath: '/'
    },

    // Module rules for different file types
    module: {
      rules: [
        // CSS files
        {
          test: /\.css$/i,
          use: [
            isProduction ? MiniCssExtractPlugin.loader : 'style-loader',
            'css-loader'
          ]
        },
        // Images and fonts
        {
          test: /\.(png|jpg|jpeg|gif|svg|woff|woff2|eot|ttf)$/i,
          type: 'asset/resource',
          generator: {
            filename: 'assets/[name].[contenthash][ext]'
          }
        }
      ]
    },

    // Plugins
    plugins: [
      // Generate HTML files for each entry point
      new HtmlWebpackPlugin({
        template: './index.html',
        filename: 'index.html',
        chunks: ['main'],
        inject: 'body'
      }),
      new HtmlWebpackPlugin({
        template: './travel-style.html',
        filename: 'travel-style.html',
        chunks: ['travel-style'],
        inject: 'body'
      }),
      new HtmlWebpackPlugin({
        template: './places/index.html',
        filename: 'places/index.html',
        chunks: ['places'],
        inject: 'body'
      }),
      // Extract CSS in production
      ...(isProduction ? [
        new MiniCssExtractPlugin({
          filename: 'css/[name].[contenthash].css'
        })
      ] : [])
    ],

    // Development server configuration
    devServer: {
      static: [
        {
          directory: path.join(__dirname, 'dist')
        },
        {
          directory: path.join(__dirname, 'assets'),
          publicPath: '/assets'
        }
      ],
      port: 3001,
      open: true,
      hot: true,
      historyApiFallback: {
        rewrites: [
          { from: /^\/places\/detail/, to: '/places/detail.html' },
          { from: /^\/places/, to: '/places/index.html' },
          { from: /^\/travel-style/, to: '/travel-style.html' },
          { from: /^\//, to: '/index.html' }
        ]
      },
      // Proxy API calls to backend
      proxy: [
        {
          context: ['/api'],
          target: 'http://localhost:3000',
          changeOrigin: true
        }
      ]
    },

    // Development tools
    devtool: isProduction ? 'source-map' : 'eval-source-map',

    // Optimization
    optimization: {
      splitChunks: {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all'
          }
        }
      }
    },

    // Resolve extensions
    resolve: {
      extensions: ['.js', '.css']
    }
  };
};