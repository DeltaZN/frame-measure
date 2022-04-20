import {BackingStorage} from "./devtools/BackingStorageStub";
import {TracingModel} from './devtools/TracingModel';
import {TimelineModelImpl} from "./devtools/TimelineModel";
import {PerformanceModel} from "./devtools/PerformanceModel";
import {EventPayload} from "./devtools/TracingManager";
import {TimelineFrame} from "./devtools/TimelineFrameModel";
import {getCPUStats, getFramesStats} from "./metrics.model";

export class DevToolsAPIWrapper {
    private readonly _tracingModel: TracingModel;
    private readonly _timelineModel: TimelineModelImpl;
    private readonly _perfModel: PerformanceModel;
    private readonly _frames: TimelineFrame[];

    constructor(events: {traceEvents: EventPayload[]} | EventPayload[]) {
        const _events = importTraceEvents(events);
        const tracingModelBackingStorage = new BackingStorage();
        this._tracingModel = new TracingModel(tracingModelBackingStorage);
        this._timelineModel = new TimelineModelImpl();

        this._tracingModel.addEvents(_events);
        this._tracingModel.tracingComplete();

        this._timelineModel.setEvents(this._tracingModel);
        this._perfModel = new PerformanceModel();
        this._perfModel.setTracingModel(this._tracingModel);

        // probably better to drop first frame, because usually first frame is done during profiler initialization
        this._frames = this.getFrameModel().getFrames().slice(1);
    }

    public getTracingModel() {
        return this._tracingModel;
    }

    public getPerformanceModel() {
        return this._perfModel;
    }

    public getTimelimeModel() {
        return this._timelineModel;
    }

    public getFrameModel() {
        return this._perfModel.frameModel();
    }

    public calculateCPUStats() {
        return getCPUStats(this._timelineModel.tracks()[0].syncEvents(), this._frames[0]?.startTime ?? 0, this._frames[this._frames.length - 1]?.endTime ?? 0);
    }

    public calculateFrameStats() {
        return getFramesStats(this._frames);
    }
}

function isTraceEventList(maybeEventList: any): maybeEventList is EventPayload[] {
    if (!Array.isArray(maybeEventList)) return false
    if (maybeEventList.length === 0) return false

    // Both ph and ts should be provided for every event. In theory, many other
    // fields are mandatory, but without these fields, we won't usefully be able
    // to import the data, so we'll rely upon these.
    for (let el of maybeEventList) {
        if (!('ph' in el)) {
            return false
        }

        switch (el.ph) {
            case 'B':
            case 'E':
            case 'X':
                // All B, E, and X events must have a timestamp specified, otherwise we
                // won't be able to import correctly.
                if (!('ts' in el)) {
                    return false
                }

            case 'M':
                // It's explicitly okay for "M" (metadata) events not to specify a "ts"
                // field, since usually there is no logical timestamp for them to have
                break
        }
    }

    return true
}

function isTraceEventObject(
    maybeTraceEventObject: any,
): maybeTraceEventObject is {traceEvents: EventPayload[]} {
    if (!('traceEvents' in maybeTraceEventObject)) return false
    return isTraceEventList(maybeTraceEventObject['traceEvents'])
}

function importTraceEvents(
    rawProfile: {traceEvents: EventPayload[]} | EventPayload[],
): EventPayload[] {
    if (isTraceEventObject(rawProfile)) {
        return rawProfile.traceEvents;
    } else if (isTraceEventList(rawProfile)) {
        return rawProfile;
    } else {
        const _exhaustiveCheck: never = rawProfile
        return _exhaustiveCheck
    }
}
