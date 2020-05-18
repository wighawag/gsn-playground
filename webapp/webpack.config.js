const webpack = require("webpack");
const fs = require("fs");
const path = require("path");
const config = require("sapper/config/webpack.js");
const pkg = require("./package.json");
const dotEnv = require("dotenv-webpack");

const env = (process.env.ENV || process.env.NODE_ENV || "production").trim();
const dev = env === "development";

const environments = {
  production: {
    contracts: "./src/contracts/production.json",
    mode: "production"
  },
  staging: {
    contracts: "./src/contracts/staging.json",
    mode: "production"
  },
  development: {
    contracts: "./src/contracts/development.json",
    mode: "development"
  }
};
console.log(`ENV ${env}`);

const envSettings = environments[env];
const contractsPath = process.env.CONTRACTS_PATH || (envSettings && envSettings.contracts) || "";
let contractsInfo = path.resolve(__dirname, contractsPath);
if (!fs.existsSync(contractsInfo)) {
  console.error(`${env} contracts info file doesn't exist: ${contractsInfo}`);
  // process.exit();
}
console.log(`using ${contractsInfo} contracts`);

let dotEnvPlugin;
let envPath = ".env";
if (env) {
  envPath = `./.env.${env}`;
  if (!fs.existsSync(envPath)) {
    envPath = ".env";
  }
}
if (fs.existsSync(envPath)) {
  dotEnvPlugin = new dotEnv({
    path: envPath
  });
}

const mode = envSettings.mode;
const alias = {
  svelte: path.resolve("node_modules", "svelte"),
  contractsInfo
};
const extensions = [".mjs", ".js", ".json", ".svelte", ".html"];
const mainFields = ["svelte", "module", "browser", "main"];

module.exports = {
  client: {
    entry: config.client.entry(),
    output: config.client.output(),
    resolve: { alias, extensions, mainFields },
    node: {
      net: "empty",
      fs: "empty",
      tls: "empty",
      dns: "empty"
    },
    module: {
      rules: [
        {
          test: /\.(svelte|html)$/,
          use: {
            loader: "svelte-loader",
            options: {
              dev,
              hydratable: true,
              hotReload: false // pending https://github.com/sveltejs/svelte/issues/2377
            }
          }
        },
        {
          test: /\.(jpg|png)$/,
          use: {
            loader: "url-loader"
          }
        }
      ]
    },
    mode,
    plugins: [
      dotEnvPlugin,
      // pending https://github.com/sveltejs/svelte/issues/2377
      // dev && new webpack.HotModuleReplacementPlugin(),
      new webpack.DefinePlugin({
        "process.browser": true,
        "process.env.NODE_ENV": JSON.stringify(mode)
      })
    ].filter(Boolean),
    devtool: dev && "inline-source-map"
  },

  server: {
    entry: config.server.entry(),
    output: config.server.output(),
    target: "node",
    resolve: { alias, extensions, mainFields },
    externals: Object.keys(pkg.dependencies).concat("encoding"),
    module: {
      rules: [
        {
          test: /\.(svelte|html)$/,
          use: {
            loader: "svelte-loader",
            options: {
              css: false,
              generate: "ssr",
              dev
            }
          }
        },
        {
          test: /\.(jpg|png)$/,
          use: {
            loader: "url-loader"
          }
        }
      ]
    },
    mode,
    plugins: [dotEnvPlugin].filter(Boolean),
    performance: {
      hints: false // it doesn't matter if server.js is large
    }
  },

  serviceworker: {
    entry: config.serviceworker.entry(),
    output: config.serviceworker.output(),
    mode
  }
};
