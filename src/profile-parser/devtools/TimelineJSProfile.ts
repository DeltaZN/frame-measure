// Copyright 2014 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

/* eslint-disable @typescript-eslint/no-explicit-any */

import {RecordType, TimelineModelImpl} from './TimelineModel';
import {Runtime} from "./generated/protocol";
import CallFrame = Runtime.CallFrame;
import {
  DevToolsTimelineEventCategory,
  MetadataEvent,
  Phase,
  Thread,
  TracingModel,
  TracingModelEvent
} from "./TracingModel";
import {CPUProfileDataModel} from "./sdk/CPUProfileDataModel";
import {ProfileNode} from "./sdk/ProfileTreeModel";
import {EventPayload} from "./TracingManager";

const UIStrings = {
  /**
  *@description Text for the name of a thread of the page
  *@example {1} PH1
  */
  threadS: 'Thread {PH1}',
};
export class TimelineJSProfileProcessor {
  static generateTracingEventsFromCpuProfile(
      jsProfileModel: CPUProfileDataModel,
      thread: Thread): TracingModelEvent[] {
    const idleNode = jsProfileModel.idleNode;
    const programNode = jsProfileModel.programNode || null;
    const gcNode = jsProfileModel.gcNode;
    const samples = jsProfileModel.samples || [];
    const timestamps = jsProfileModel.timestamps;
    const jsEvents: TracingModelEvent[] = [];
    const nodeToStackMap = new Map<ProfileNode|null, CallFrame[]>();
    nodeToStackMap.set(programNode, []);
    for (let i = 0; i < samples.length; ++i) {
      let node: ProfileNode|null = jsProfileModel.nodeByIndex(i);
      if (!node) {
        console.error(`Node with unknown id ${samples[i]} at index ${i}`);
        continue;
      }
      if (node === gcNode || node === idleNode) {
        continue;
      }
      let callFrames = nodeToStackMap.get(node);
      if (!callFrames) {
        callFrames = (new Array(node.depth + 1) as CallFrame[]);
        nodeToStackMap.set(node, callFrames);
        for (let j = 0; node.parent; node = node.parent) {
          callFrames[j++] = (node as CallFrame);
        }
      }
      const jsSampleEvent = new TracingModelEvent(
          DevToolsTimelineEventCategory, RecordType.JSSample, Phase.Instant,
          timestamps[i], thread);
      jsSampleEvent.args['data'] = {stackTrace: callFrames};
      jsEvents.push(jsSampleEvent);
    }
    return jsEvents;
  }

  static generateJSFrameEvents(events: TracingModelEvent[], config: {
    showAllEvents: boolean,
    showRuntimeCallStats: boolean,
    showNativeFunctions: boolean,
  }): TracingModelEvent[] {
    function equalFrames(frame1: CallFrame, frame2: CallFrame): boolean {
      return frame1.scriptId === frame2.scriptId && frame1.functionName === frame2.functionName &&
          frame1.lineNumber === frame2.lineNumber;
    }

    function isJSInvocationEvent(e: TracingModelEvent): boolean {
      switch (e.name) {
        case RecordType.RunMicrotasks:
        case RecordType.FunctionCall:
        case RecordType.EvaluateScript:
        case RecordType.EvaluateModule:
        case RecordType.EventDispatch:
        case RecordType.V8Execute:
          return true;
      }
      return false;
    }

    const jsFrameEvents: TracingModelEvent[] = [];
    const jsFramesStack: TracingModelEvent[] = [];
    const lockedJsStackDepth: number[] = [];
    let ordinal = 0;
    let fakeJSInvocation = false;
    const {showAllEvents, showRuntimeCallStats, showNativeFunctions} = config;

    function onStartEvent(e: TracingModelEvent): void {
      if (fakeJSInvocation) {
        truncateJSStack((lockedJsStackDepth.pop() as number), e.startTime);
        fakeJSInvocation = false;
      }
      e.ordinal = ++ordinal;
      extractStackTrace(e);
      // For the duration of the event we cannot go beyond the stack associated with it.
      lockedJsStackDepth.push(jsFramesStack.length);
    }

    function onInstantEvent(e: TracingModelEvent, parent: TracingModelEvent|null): void {
      e.ordinal = ++ordinal;
      if ((parent && isJSInvocationEvent(parent)) || fakeJSInvocation) {
        extractStackTrace(e);
      } else if (e.name === RecordType.JSSample && jsFramesStack.length === 0) {
        // Force JS Samples to show up even if we are not inside a JS invocation event, because we
        // can be missing the start of JS invocation events if we start tracing half-way through.
        // Pretend we have a top-level JS invocation event.
        fakeJSInvocation = true;
        const stackDepthBefore = jsFramesStack.length;
        extractStackTrace(e);
        lockedJsStackDepth.push(stackDepthBefore);
      }
    }

    function onEndEvent(e: TracingModelEvent): void {
      truncateJSStack((lockedJsStackDepth.pop() as number), (e.endTime as number));
    }

    function truncateJSStack(depth: number, time: number): void {
      if (lockedJsStackDepth.length) {
        const lockedDepth = (lockedJsStackDepth[lockedJsStackDepth.length - 1] as number);
        if (depth < lockedDepth) {
          console.error(`Child stack is shallower (${depth}) than the parent stack (${lockedDepth}) at ${time}`);
          depth = lockedDepth;
        }
      }
      if (jsFramesStack.length < depth) {
        console.error(`Trying to truncate higher than the current stack size at ${time}`);
        depth = jsFramesStack.length;
      }
      for (let k = 0; k < jsFramesStack.length; ++k) {
        jsFramesStack[k].setEndTime(time);
      }
      jsFramesStack.length = depth;
    }

    function showNativeName(name: string): boolean {
      return showRuntimeCallStats && Boolean(TimelineJSProfileProcessor.nativeGroup(name));
    }

    function filterStackFrames(stack: CallFrame[]): void {
      if (showAllEvents) {
        return;
      }
      let previousNativeFrameName: (string|null)|null = null;
      let j = 0;
      for (let i = 0; i < stack.length; ++i) {
        const frame = stack[i];
        const url = frame.url;
        const isNativeFrame = url && url.startsWith('native ');
        if (!showNativeFunctions && isNativeFrame) {
          continue;
        }
        const isNativeRuntimeFrame = TimelineJSProfileProcessor.isNativeRuntimeFrame(frame);
        if (isNativeRuntimeFrame && !showNativeName(frame.functionName)) {
          continue;
        }
        const nativeFrameName =
            isNativeRuntimeFrame ? TimelineJSProfileProcessor.nativeGroup(frame.functionName) : null;
        if (previousNativeFrameName && previousNativeFrameName === nativeFrameName) {
          continue;
        }
        previousNativeFrameName = nativeFrameName;
        stack[j++] = frame;
      }
      stack.length = j;
    }

    function extractStackTrace(e: TracingModelEvent): void {
      const callFrames: CallFrame[] = e.name === RecordType.JSSample ?
          e.args['data']['stackTrace'].slice().reverse() :
          jsFramesStack.map(frameEvent => frameEvent.args['data']);
      filterStackFrames(callFrames);
      const endTime = e.endTime || e.startTime;
      const minFrames = Math.min(callFrames.length, jsFramesStack.length);
      let i;
      for (i = lockedJsStackDepth[lockedJsStackDepth.length - 1] || 0; i < minFrames; ++i) {
        const newFrame = callFrames[i];
        const oldFrame = jsFramesStack[i].args['data'];
        if (!equalFrames(newFrame, oldFrame)) {
          break;
        }
        jsFramesStack[i].setEndTime(Math.max((jsFramesStack[i].endTime as number), endTime));
      }
      truncateJSStack(i, e.startTime);
      for (; i < callFrames.length; ++i) {
        const frame = callFrames[i];
        const jsFrameEvent = new TracingModelEvent(
            DevToolsTimelineEventCategory, RecordType.JSFrame, Phase.Complete,
            e.startTime, e.thread);
        jsFrameEvent.ordinal = e.ordinal;
        jsFrameEvent.addArgs({data: frame});
        jsFrameEvent.setEndTime(endTime);
        jsFramesStack.push(jsFrameEvent);
        jsFrameEvents.push(jsFrameEvent);
      }
    }

    const firstTopLevelEvent = events.find(TracingModel.isTopLevelEvent);
    const startTime = firstTopLevelEvent ? firstTopLevelEvent.startTime : 0;
    TimelineModelImpl.forEachEvent(events, onStartEvent, onEndEvent, onInstantEvent, startTime);
    return jsFrameEvents;
  }

  static isNativeRuntimeFrame(frame: CallFrame): boolean {
    return frame.url === 'native V8Runtime';
  }

  static nativeGroup(nativeName: string): string|null {
    if (nativeName.startsWith('Parse')) {
      return TimelineJSProfileProcessor.NativeGroups.Parse;
    }
    if (nativeName.startsWith('Compile') || nativeName.startsWith('Recompile')) {
      return TimelineJSProfileProcessor.NativeGroups.Compile;
    }
    return null;
  }

  static buildTraceProfileFromCpuProfile(profile: any, tid: number, injectPageEvent: boolean, name?: string|null):
      EventPayload[] {
    const events: EventPayload[] = [];
    if (injectPageEvent) {
      appendEvent('TracingStartedInPage', {data: {'sessionId': '1'}}, 0, 0, 'M');
    }
    if (!name) {
      name = UIStrings.threadS + tid;
    }
    appendEvent(MetadataEvent.ThreadName, {name}, 0, 0, 'M', '__metadata');
    if (!profile) {
      return events;
    }
    const idToNode = new Map<any, any>();
    const nodes = profile['nodes'];
    for (let i = 0; i < nodes.length; ++i) {
      idToNode.set(nodes[i].id, nodes[i]);
    }
    let programEvent: EventPayload|null = null;
    let functionEvent: null|EventPayload = null;
    let nextTime: number = profile.startTime;
    let currentTime = 0;
    const samples = profile['samples'];
    const timeDeltas = profile['timeDeltas'];
    for (let i = 0; i < samples.length; ++i) {
      currentTime = nextTime;
      nextTime += timeDeltas[i];
      const node = idToNode.get(samples[i]);
      const name = node.callFrame.functionName;
      if (name === '(idle)') {
        closeEvents();
        continue;
      }
      if (!programEvent) {
        programEvent = appendEvent('MessageLoop::RunTask', {}, currentTime, 0, 'X', 'toplevel');
      }
      if (name === '(program)') {
        if (functionEvent) {
          functionEvent.dur = currentTime - functionEvent.ts;
          functionEvent = null;
        }
      } else {
        // A JS function.
        if (!functionEvent) {
          functionEvent = appendEvent('FunctionCall', {data: {'sessionId': '1'}}, currentTime);
        }
      }
    }
    closeEvents();
    appendEvent('CpuProfile', {data: {'cpuProfile': profile}}, profile.endTime, 0, 'I');
    return events;

    function closeEvents(): void {
      if (programEvent) {
        programEvent.dur = currentTime - programEvent.ts;
      }
      if (functionEvent) {
        functionEvent.dur = currentTime - functionEvent.ts;
      }
      programEvent = null;
      functionEvent = null;
    }

    function appendEvent(
        name: string, args: any, ts: number, dur?: number, ph?: string, cat?: string): EventPayload {
      const event =
          ({cat: cat || 'disabled-by-default-devtools.timeline', name, ph: ph || 'X', pid: 1, tid, ts, args} as
           EventPayload);
      if (dur) {
        event.dur = dur;
      }
      events.push(event);
      return event;
    }
  }
}

export namespace TimelineJSProfileProcessor {
  // TODO(crbug.com/1172300) Ignored during the jsdoc to ts migration)
  // eslint-disable-next-line rulesdir/const_enum
  export enum NativeGroups {
    Compile = 'Compile',
    Parse = 'Parse',
  }
}
