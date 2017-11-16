const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  entry: './src/index.js',
  output: {
    path: `${__dirname}/dist`,
    filename: 'bundle.js',
  },
  resolve: {
    extensions: ['.js'],
  },
  module: {
    rules: [
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
      {
        test: /\.(png|jpg|gif|svg)/,
        use: ['url-loader?limit=50000'],
      },
      {
        test: /\.woff$/,
        use: ['url-loader'],
      },
      {
        test: /.js$/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['env'],
          },
        },
        exclude: /node_modules/,
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      inlineSource: '.(js|css)$',
      title: 'fatto-biito',
    }),
  ],
};
