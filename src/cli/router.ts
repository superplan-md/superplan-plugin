import { setup } from './commands/setup';
import { doctor } from './commands/doctor';
import { parse } from './commands/parse';
import { init } from './commands/init';
import { task } from './commands/task';
import { purge, remove } from './commands/remove';

type CommandOptions = {
  json: boolean;
};

type CommandResult = {
  ok: boolean;
  data?: unknown;
  error?: { code: string; message: string; retryable: boolean };
};

type CommandHandler = (args: string[], options: CommandOptions) => Promise<CommandResult>;

function hasError(result: CommandResult): result is CommandResult & {
  error: { code: string; message: string; retryable: boolean };
} {
  return !result.ok && Boolean(result.error);
}

export const router: Record<string, CommandHandler> = {
  init: async () => init(),
  setup: async (_args, options) => setup(options),
  remove: async (_args, options) => remove(options),
  purge: async (_args, options) => purge(options),
  doctor: async () => doctor(),
  parse: async (args, options) => parse(args, options),
  task: async (args) => task(args),
};

export async function routeCommand(args: string[]) {
  const command = args[0];
  const options = { json: args.includes('--json') };
  const commandArgs = args.slice(1);
  const handler = command ? router[command as keyof typeof router] : undefined;

  if (handler) {
    const result = await handler(commandArgs, options);
    if (hasError(result) && !options.json && result.error.code === 'INVALID_TASK_COMMAND') {
      console.error(result.error.message);
    } else if (result.ok) {
      console.log(JSON.stringify(result, null, 2));
    } else {
      console.error(JSON.stringify(result, null, 2));
    }

    if (!result.ok) {
      process.exitCode = 1;
    }
  } else {
    console.error(JSON.stringify({
      ok: false,
      error: {
        code: "UNKNOWN_COMMAND",
        message: `Unknown command: ${command}`,
        retryable: false
      }
    }, null, 2));
    process.exitCode = 1;
  }
}
