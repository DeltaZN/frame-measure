import {TimelineFrame} from "./devtools/TimelineFrameModel";
import {TimelineUIUtils} from "./devtools/TimelineUIUtils";
import {TracingModelEvent} from "./devtools/TracingModel";

interface CPUTimeReal {
    totalTime: number;
    allCPUTime: number;
    scriptTime: number;
    renderTime: number;
    systemTime: number;
    paintTime: number;
    idleTime: number;
}

interface CPUTimePercent {
    allCPUTimePercent: number;
    scriptTimePercent: number;
    renderTimePercent: number;
    systemTimePercent: number;
    paintTimePercent: number;
    idleTimePercent: number;
}

export type CPUStats = CPUTimeReal & CPUTimePercent;

export function getCPUStats(events: TracingModelEvent[], startTime: number, endTime: number): CPUStats {
    const timeRangeStats = TimelineUIUtils.statsForTimeRange(events, startTime, endTime);
    const totalTime = endTime - startTime;
    const scriptTime = timeRangeStats['scripting'];
    const systemTime = timeRangeStats['other'];
    const renderTime = timeRangeStats['rendering'];
    const paintTime = timeRangeStats['painting'];
    const idleTime = timeRangeStats['idle'];

    const allCPUTime = totalTime - idleTime;

    const allCPUTimePercent = allCPUTime / totalTime;
    const idleTimePercent = idleTime / totalTime;
    const scriptTimePercent = scriptTime / totalTime;
    const renderTimePercent = renderTime / totalTime;
    const systemTimePercent = systemTime / totalTime;
    const paintTimePercent = paintTime / totalTime;

    return {
        totalTime,
        scriptTime,
        systemTime,
        renderTime,
        paintTime,
        idleTime,
        allCPUTime,
        allCPUTimePercent,
        idleTimePercent,
        renderTimePercent,
        scriptTimePercent,
        systemTimePercent,
        paintTimePercent,
    };
}

interface FramesStats {
    avgFPS: number;
    droppedFrames: number;
    longestFrameTime: number;
}

function isValidForFPSFrame(frame: TimelineFrame): boolean {
    const notZeroDuration = frame.duration !== 0;
    const noActivityFrame = !frame.dropped && frame.cpuTime / frame.duration < 0.2;
    return notZeroDuration && !noActivityFrame;
}

// get FPS, keep in mind what frame can be very long
// get Max Frame rate, keep in mind the same thing
export function getFramesStats(frames: TimelineFrame[]): FramesStats {
    let droppedFrames = 0;
    let longestFrameTime = 0;
    const validFrames = frames.filter(isValidForFPSFrame);
    const summedFPS = validFrames.reduce((acc, f, idx) => {
        if (f.dropped) {
            droppedFrames += 1;
        } else {
            let actualFrameDuration = f.duration;
            // handle long frame
            if (validFrames[idx + 1] && validFrames[idx + 1].dropped) {
                let nextIdx = idx + 1;
                let nextFrame = validFrames[nextIdx];
                while (nextFrame && nextFrame.dropped) {
                    actualFrameDuration += nextFrame.duration;
                    nextIdx++;
                    nextFrame = validFrames[nextIdx];
                }
            }
            if (actualFrameDuration > longestFrameTime) {
                longestFrameTime = actualFrameDuration;
            }
            acc += 1000 / f.duration;
        }
        return acc;
    }, 0);
    return {
        avgFPS: summedFPS / validFrames.length,
        droppedFrames,
        longestFrameTime,
    }
}
