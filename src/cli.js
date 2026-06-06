'use strict';

function printBanner() {
  console.log(`
  ╔══════════════════════════════════════════╗
  ║     🔨 Vulcan  v0.1.0                   ║
  ║     AI-Driven Local UI Canvas            ║
  ╚══════════════════════════════════════════╝
`);
}

function printUsage() {
  console.log(`
  Usage:
    vulcan start [--port <port>] [--no-open]
    vulcan stop
    vulcan status
    vulcan init [--global] [--force]
    vulcan --help | -h
    vulcan --version | -v

  Commands:
    start    Start the local Vulcan server
    stop     Stop the running Vulcan server
    status   Show server status
    init     Install Claude Code skills (/deploy-view, /vulcan-inspect)

  Options:
    --port <port>   Specify port (default: 3000)
    --no-open       Don't auto-open browser on start
    --global        Install skills globally (all projects)
    --force         Overwrite existing files
`);
}

function handleCommand(args) {
  if (args.includes('--help') || args.includes('-h') || args.length === 0) {
    printBanner();
    printUsage();
    process.exit(0);
  }

  if (args.includes('--version') || args.includes('-v')) {
    const pkg = require('../package.json');
    console.log(pkg.version);
    process.exit(0);
  }

  const command = args[0];

  switch (command) {
    case 'start': {
      const portIdx = args.indexOf('--port');
      const port = portIdx !== -1 ? parseInt(args[portIdx + 1], 10) : undefined;
      const noOpen = args.includes('--no-open');
      require('./commands/start').run({ port, open: !noOpen });
      break;
    }
    case 'stop':
      require('./commands/stop').run();
      break;
    case 'status':
      require('./commands/status').run();
      break;
    case 'init': {
      const force = args.includes('--force');
      const global = args.includes('--global');
      require('./commands/init').run({ force, global });
      break;
    }
    default:
      console.error(`  ❌ Unknown command: ${command}`);
      printUsage();
      process.exit(1);
  }
}

module.exports = { handleCommand };
