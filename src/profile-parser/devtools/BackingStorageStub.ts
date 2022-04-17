export class BackingStorage {
    appendString(_string: string): void {}

    appendAccessibleString(string: string): () => Promise<string|null> {
        return () => new Promise<string | null>(resolve => resolve(null));
    }

    finishWriting(): void {}

    reset(): void {}
}
