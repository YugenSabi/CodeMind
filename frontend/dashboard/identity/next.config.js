/* eslint-disable @typescript-eslint/no-require-imports */
const path = require('path');

const withNextIntl = require('next-intl/plugin')(
  path.resolve(__dirname, './lib/i18n/request.ts'),
);

const nextConfig = {
  transpilePackages: [
    '@ui/layout',
    '@ui/input',
    '@ui/button',
    '@ui/icons',
    '@ui/text',
    '@ui/theme',
    '@ui/toast',
  ],
  webpack(config) {
    const svgrRule = {
      test: /\.svg$/i,
      type: 'javascript/auto',
      use: [
        {
          loader: '@svgr/webpack',
          options: {
            icon: true,
            svgo: true,
            svgoConfig: {
              plugins: [
                {
                  name: 'preset-default',
                  params: { overrides: { removeViewBox: false } },
                },
                'prefixIds',
              ],
            },
          },
        },
      ],
    };

    const oneOfIndex = config.module.rules.findIndex(
      (rule) => rule && typeof rule === 'object' && Array.isArray(rule.oneOf),
    );

    if (oneOfIndex !== -1) {
      const oneOf = config.module.rules[oneOfIndex].oneOf;
      for (const oneOfRule of oneOf) {
        if (oneOfRule?.test instanceof RegExp && oneOfRule.test.test('.svg')) {
          oneOfRule.exclude = /\.svg$/i;
        }
      }

      config.module.rules.splice(oneOfIndex, 0, svgrRule);
      return config;
    }

    config.module.rules.push(svgrRule);

    return config;
  },
};

module.exports = withNextIntl(nextConfig);
