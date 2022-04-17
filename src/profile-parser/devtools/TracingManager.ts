import {ObjectSnapshot} from "./TracingModel";

export interface EventPayload {
    cat?: string;
    pid: number;
    tid: number;
    ts: number;
    ph: string;
    name: string;
    args: {
        sort_index: number,
        name: string,
        snapshot: ObjectSnapshot,
        data: Object|null,
    };
    dur: number;
    id: string;
    id2?: {
        global: (string|undefined),
        local: (string|undefined),
    };
    scope: string;
    bind_id: string;
    s: string;
}
