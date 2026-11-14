async function withTimeout<T>(
    promise: Promise<T>,
    ms: number,
    label: string,
): Promise<T> {
    let timer: NodeJS.Timeout | undefined;
    const timeout = new Promise<never>((_, reject) => {
        timer = setTimeout(
            () => reject(new Error(`${label} timed out after ${ms}ms`)),
            ms,
        );
    });
    try {
        return await Promise.race([promise, timeout]);
    } finally {
        clearTimeout(timer);
    }
}

export async function withRetry<T>(
    fn: () => T | Promise<T>,
    opts: { retries?: number; timeoutMs?: number; label?: string } = {},
): Promise<T> {
    const { retries = 1, timeoutMs = 5000, label = "operation" } = opts;
    let lastError: unknown;
    for (let attempt = 0; attempt <= retries; attempt++) {
        try {
            return await withTimeout(
                Promise.resolve().then(fn),
                timeoutMs,
                label,
            );
        } catch (err) {
            lastError = err;
        }
    }
    throw lastError;
}
