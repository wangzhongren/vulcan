#!/usr/bin/env node

'use strict';

const { handleCommand } = require('../src/cli');
handleCommand(process.argv.slice(2));
