import type { z } from 'zod';

export interface SchemaErrorHandling
{
    onSchemaError?: (error: z.ZodError) => void;
    exitOnSchemaError?: boolean;
}

export interface PipedConfig<Schema extends z.Schema> extends SchemaErrorHandling
{
    ExpectedSchema: Schema;
}

export async function piped<Schema extends z.Schema>({ ExpectedSchema, onSchemaError, exitOnSchemaError }: PipedConfig<Schema>, ...args: Parameters<typeof arg>): Promise<z.infer<Schema>>
{
    const value = await arg(...args);

    debugger;
    if (ExpectedSchema.safeParse(value).success) return value as Schema;

    try
    {
        const parsed = JSON.parse(value as string);

        const validation = ExpectedSchema.safeParse(parsed);

        if (validation.success) return parsed;

        log(`The piped data doesn't match the expected schema. Exiting...`);
        log('Parsed data:', parsed);
        log('Schema error:', JSON.stringify(validation.error, null, 2));

        onSchemaError?.(validation.error);

        (exitOnSchemaError ?? true) && exit();
    }
    catch (error)
    {
        log('🤔 Could not parse piped data as JSON.');
        log('Piped data:', value);

        notify()
    }
}
