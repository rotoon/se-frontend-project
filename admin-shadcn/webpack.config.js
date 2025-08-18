const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');

module.exports = (env, argv) => {
  const isProduction = argv.mode === 'production';
  
  return {
    entry: {
      login: './assets/js/login.js',
      dashboard: './assets/js/dashboard.js'
    },
    
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: isProduction ? 'js/[name].[contenthash].js' : 'js/[name].js',
      chunkFilename: isProduction ? 'js/[name].[contenthash].chunk.js' : 'js/[name].chunk.js',
      clean: true,
      publicPath: '/'
    },
    
    module: {
      rules: [
        {
          test: /\.js$/,
          exclude: /node_modules/,
          use: {
            loader: 'babel-loader',
            options: {
              presets: ['@babel/preset-env']
            }
          }
        },
        {
          test: /\.css$/,
          use: [
            isProduction ? MiniCssExtractPlugin.loader : 'style-loader',
            'css-loader'
          ]
        },
        {
          test: /\.(png|jpg|jpeg|gif|svg|ico)$/,
          type: 'asset/resource',
          generator: {
            filename: 'images/[name].[hash][ext]'
          }
        },
        {
          test: /\.(woff|woff2|ttf|eot)$/,
          type: 'asset/resource',
          generator: {
            filename: 'fonts/[name].[hash][ext]'
          }
        }
      ]
    },
    
    plugins: [
      new CleanWebpackPlugin(),
      
      // HTML pages
      new HtmlWebpackPlugin({
        template: './index.html',
        filename: 'index.html',
        chunks: ['login'],
        inject: 'body',
        minify: isProduction ? {
          removeComments: true,
          collapseWhitespace: true,
          removeRedundantAttributes: true,
          removeScriptTypeAttributes: true,
          removeStyleLinkTypeAttributes: true,
          useShortDoctype: true
        } : false
      }),
      
      new HtmlWebpackPlugin({
        template: './dashboard.html',
        filename: 'dashboard.html',
        chunks: ['dashboard'],
        inject: 'body',
        minify: isProduction ? {
          removeComments: true,
          collapseWhitespace: true,
          removeRedundantAttributes: true,
          removeScriptTypeAttributes: true,
          removeStyleLinkTypeAttributes: true,
          useShortDoctype: true
        } : false
      }),
      
      // Extract CSS in production
      ...(isProduction ? [
        new MiniCssExtractPlugin({
          filename: 'css/[name].[contenthash].css',
          chunkFilename: 'css/[name].[contenthash].chunk.css'
        })
      ] : []),
      
      // Copy static assets
      new CopyWebpackPlugin({
        patterns: [
          {
            from: 'assets/css',
            to: 'css',
            noErrorOnMissing: true
          },
          {
            from: 'assets/js',
            to: 'js',
            noErrorOnMissing: true
          },
          {
            from: 'assets/images',
            to: 'images',
            noErrorOnMissing: true
          }
        ]
      })
    ],
    
    optimization: {
      splitChunks: {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
            priority: 10
          },
          common: {
            name: 'common',
            minChunks: 2,
            chunks: 'all',
            priority: 5,
            reuseExistingChunk: true
          }
        }
      }
    },
    
    devServer: {
      static: {
        directory: path.join(__dirname, 'dist')
      },
      compress: true,
      port: 3002,
      open: true,
      hot: true,
      historyApiFallback: {
        rewrites: [
          { from: /^\/dashboard/, to: '/dashboard.html' },
          { from: /^\/places/, to: '/places.html' },
          { from: /^\/categories/, to: '/categories.html' },
          { from: /./, to: '/index.html' }
        ]
      },
      proxy: {
        '/api': {
          target: 'http://localhost:3000',
          changeOrigin: true,
          secure: false
        },
        '/auth': {
          target: 'http://localhost:3000',
          changeOrigin: true,
          secure: false
        },
        '/admin': {
          target: 'http://localhost:3000',
          changeOrigin: true,
          secure: false
        }
      },
      client: {
        overlay: {
          warnings: false,
          errors: true
        }
      }
    },
    
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
        '@css': path.resolve(__dirname, 'src/css'),
        '@js': path.resolve(__dirname, 'src/js'),
        '@components': path.resolve(__dirname, 'src/components'),
        '@utils': path.resolve(__dirname, 'src/utils')
      },
      extensions: ['.js', '.css', '.html']
    },
    
    devtool: isProduction ? 'source-map' : 'eval-source-map'
  };
};