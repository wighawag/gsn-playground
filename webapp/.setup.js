#!/usr/bin/env node
const fs = require('fs');

if (!fs.existsSync('.env.development')) {
  fs.copyFileSync('.env.development', '.env');
}
