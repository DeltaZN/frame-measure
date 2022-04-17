// Copyright 2021 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

/*
 * Copyright (C) 2013 Google Inc. All rights reserved.
 * Copyright (C) 2012 Intel Inc. All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are
 * met:
 *
 *     * Redistributions of source code must retain the above copyright
 * notice, this list of conditions and the following disclaimer.
 *     * Redistributions in binary form must reproduce the above
 * copyright notice, this list of conditions and the following disclaimer
 * in the documentation and/or other materials provided with the
 * distribution.
 *     * Neither the name of Google Inc. nor the names of its
 * contributors may be used to endorse or promote products derived from
 * this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
 * "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
 * LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
 * A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
 * OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
 * SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
 * LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
 * DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
 * THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

import {TracingModel, TracingModelEvent} from "./TracingModel";
import {RecordType, TimelineData, TimelineModelImpl} from "./TimelineModel";
import {InputEvents, Phases} from "./models/TimelineIRModel";
import {Runtime} from "./generated/protocol";
import {binaryIndexOf, DEFAULT_COMPARATOR, upperBound} from "./platform/array-utilities";

const UIStrings = {
  /**
  *@description Text in Timeline UIUtils of the Performance panel
  *@example {node1} PH1
  *@example {node2} PH2
  */
  sAndS: '{PH1} and {PH2}',
  /**
  *@description Text in Timeline UIUtils of the Performance panel
  *@example {node1} PH1
  *@example {node2} PH2
  */
  sAndSOther: '{PH1}, {PH2}, and 1 other',
  /**
  *@description Text in Timeline UIUtils of the Performance panel
  */
  task: 'Task',
  /**
  *@description Text for other types of items
  */
  other: 'Other',
  /**
  *@description Text that refers to the animation of the web page
  */
  animation: 'Animation',
  /**
  *@description Text that refers to some events
  */
  event: 'Event',
  /**
  *@description Text in Timeline UIUtils of the Performance panel
  */
  requestMainThreadFrame: 'Request Main Thread Frame',
  /**
  *@description Text in Timeline UIUtils of the Performance panel
  */
  frameStart: 'Frame Start',
  /**
  *@description Text in Timeline UIUtils of the Performance panel
  */
  frameStartMainThread: 'Frame Start (main thread)',
  /**
  *@description Text in Timeline UIUtils of the Performance panel
  */
  drawFrame: 'Draw Frame',
  /**
  *@description The process the browser uses to determine a target element for a
  *pointer event. Typically, this is determined by considering the pointer's
  *location and also the visual layout of elements on the screen.
  */
  hitTest: 'Hit Test',
  /**
  *@description Noun for an event in the Performance panel. The browser has decided
  *that the styles for some elements need to be recalculated and scheduled that
  *recalculation process at some time in the future.
  */
  scheduleStyleRecalculation: 'Schedule Style Recalculation',
  /**
  *@description Text in Timeline UIUtils of the Performance panel
  */
  recalculateStyle: 'Recalculate Style',
  /**
  *@description Text in Timeline UIUtils of the Performance panel
  */
  invalidateLayout: 'Invalidate Layout',
  /**
  *@description Text in Timeline UIUtils of the Performance panel
  */
  layout: 'Layout',
  /**
  *@description Noun for an event in the Performance panel. Paint setup is a
  *step before the 'Paint' event. A paint event is when the browser draws pixels
  *to the screen. This step is the setup beforehand.
  */
  paintSetup: 'Paint Setup',
  /**
  *@description Noun for a paint event in the Performance panel, where an image
  *was being painted. A paint event is when the browser draws pixels to the
  *screen, in this case specifically for an image in a website.
  */
  paintImage: 'Paint Image',
  /**
  *@description Text in Timeline UIUtils of the Performance panel
  */
  updateLayer: 'Update Layer',
  /**
  *@description Text in Timeline UIUtils of the Performance panel
  */
  updateLayerTree: 'Update Layer Tree',
  /**
  *@description Noun for a paint event in the Performance panel. A paint event is when the browser draws pixels to the screen.
  */
  paint: 'Paint',
  /**
  *@description Text in Timeline UIUtils of the Performance panel
  */
  rasterizePaint: 'Rasterize Paint',
  /**
  *@description The action to scroll
  */
  scroll: 'Scroll',
  /**
  *@description Text in Timeline UIUtils of the Performance panel
  */
  compositeLayers: 'Composite Layers',
  /**
  *@description Text in Timeline UIUtils of the Performance panel
  */
  computeIntersections: 'Compute Intersections',
  /**
  *@description Text in Timeline UIUtils of the Performance panel
  */
  parseHtml: 'Parse HTML',
  /**
  *@description Text in Timeline UIUtils of the Performance panel
  */
  parseStylesheet: 'Parse Stylesheet',
  /**
  *@description Text in Timeline UIUtils of the Performance panel
  */
  installTimer: 'Install Timer',
  /**
  *@description Text in Timeline UIUtils of the Performance panel
  */
  removeTimer: 'Remove Timer',
  /**
  *@description Text in Timeline UIUtils of the Performance panel
  */
  timerFired: 'Timer Fired',
  /**
   *@description Text for an event. Shown in the timeline in the Performance panel.
   * XHR refers to XmlHttpRequest, a Web API. This particular Web API has a property
   * named 'readyState' (https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest/readyState). When
   * the 'readyState' property changes the text is shown.
   */
  xhrReadyStateChange: '`XHR` Ready State Change',
  /**
   * @description Text for an event. Shown in the timeline in the Perforamnce panel.
   * XHR refers to XmlHttpRequest, a Web API. (see https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest)
   * The text is shown when a XmlHttpRequest load event happens on the inspected page.
   */
  xhrLoad: '`XHR` Load',
  /**
  *@description Text in Timeline UIUtils of the Performance panel
  */
  compileScript: 'Compile Script',
  /**
  *@description Text in Timeline UIUtils of the Performance panel
  */
  cacheScript: 'Cache Script Code',
  /**
  *@description Text in Timeline UIUtils of the Performance panel
  */
  compileCode: 'Compile Code',
  /**
  *@description Text in Timeline UIUtils of the Performance panel
  */
  optimizeCode: 'Optimize Code',
  /**
  *@description Text in Timeline UIUtils of the Performance panel
  */
  evaluateScript: 'Evaluate Script',
  /**
  *@description Text in Timeline UIUtils of the Performance panel
  */
  compileModule: 'Compile Module',
  /**
  *@description Text in Timeline UIUtils of the Performance panel
  */
  cacheModule: 'Cache Module Code',
  /**
   * @description Text for an event. Shown in the timeline in the Perforamnce panel.
   * "Module" refers to JavaScript modules: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules
   * JavaScript modules are a way to organize JavaScript code.
   * "Evaluate" is the phase when the JavaScript code of a module is executed.
   */
  evaluateModule: 'Evaluate Module',
  /**
  *@description Noun indicating that a compile task (type: streaming) happened.
  */
  streamingCompileTask: 'Streaming Compile Task',
  /**
  *@description Text in Timeline UIUtils of the Performance panel
  */
  waitingForNetwork: 'Waiting for Network',
  /**
  *@description Text in Timeline UIUtils of the Performance panel
  */
  parseAndCompile: 'Parse and Compile',
  /**
  *@description Text in Timeline UIUtils of the Performance panel
  */
  streamingWasmResponse: 'Streaming Wasm Response',
  /**
  *@description Text in Timeline UIUtils of the Performance panel
  */
  compiledWasmModule: 'Compiled Wasm Module',
  /**
  *@description Text in Timeline UIUtils of the Performance panel
  */
  cachedWasmModule: 'Cached Wasm Module',
  /**
  *@description Text in Timeline UIUtils of the Performance panel
  */
  wasmModuleCacheHit: 'Wasm Module Cache Hit',
  /**
  *@description Text in Timeline UIUtils of the Performance panel
  */
  wasmModuleCacheInvalid: 'Wasm Module Cache Invalid',
  /**
  *@description Text in Timeline UIUtils of the Performance panel
  */
  frameStartedLoading: 'Frame Started Loading',
  /**
  *@description Text in Timeline UIUtils of the Performance panel
  */
  onloadEvent: 'Onload Event',
  /**
  *@description Text in Timeline UIUtils of the Performance panel
  */
  domcontentloadedEvent: 'DOMContentLoaded Event',
  /**
  *@description Text in Timeline UIUtils of the Performance panel
  */
  firstPaint: 'First Paint',
  /**
  *@description Text in Timeline UIUtils of the Performance panel
  */
  firstContentfulPaint: 'First Contentful Paint',
  /**
  *@description Text in Timeline UIUtils of the Performance panel
  */
  largestContentfulPaint: 'Largest Contentful Paint',
  /**
  *@description Text for timestamps of items
  */
  timestamp: 'Timestamp',
  /**
  *@description Noun for a 'time' event that happens in the Console (a tool in
  * DevTools). The user can trigger console time events from their code, and
  * they will show up in the Performance panel. Time events are used to measure
  * the duration of something, e.g. the user will emit two time events at the
  * start and end of some interesting task.
  */
  consoleTime: 'Console Time',
  /**
  *@description Text in Timeline UIUtils of the Performance panel
  */
  userTiming: 'User Timing',
  /**
   * @description Name for an event shown in the Performance panel. When a network
   * request is about to be sent by the browser, the time is recorded and DevTools
   * is notified that a network request will be sent momentarily.
   */
  willSendRequest: 'Will Send Request',
  /**
  *@description Text in Timeline UIUtils of the Performance panel
  */
  sendRequest: 'Send Request',
  /**
  *@description Text in Timeline UIUtils of the Performance panel
  */
  receiveResponse: 'Receive Response',
  /**
  *@description Text in Timeline UIUtils of the Performance panel
  */
  finishLoading: 'Finish Loading',
  /**
  *@description Text in Timeline UIUtils of the Performance panel
  */
  receiveData: 'Receive Data',
  /**
  *@description Event category in the Performance panel for time spent to execute microtasks in JavaScript
  */
  runMicrotasks: 'Run Microtasks',
  /**
  *@description Text in Timeline UIUtils of the Performance panel
  */
  functionCall: 'Function Call',
  /**
  *@description Text in Timeline UIUtils of the Performance panel
  */
  gcEvent: 'GC Event',
  /**
  *@description Event category in the Performance panel for time spent to perform a full Garbage Collection pass
  */
  majorGc: 'Major GC',
  /**
  *@description Event category in the Performance panel for time spent to perform a quick Garbage Collection pass
  */
  minorGc: 'Minor GC',
  /**
  *@description Event category in the Performance panel for time spent to execute JavaScript
  */
  jsFrame: 'JS Frame',
  /**
  *@description Text for the request animation frame event
  */
  requestAnimationFrame: 'Request Animation Frame',
  /**
  *@description Text to cancel the animation frame
  */
  cancelAnimationFrame: 'Cancel Animation Frame',
  /**
  *@description Text for the event that an animation frame is fired
  */
  animationFrameFired: 'Animation Frame Fired',
  /**
  *@description Text in Timeline UIUtils of the Performance panel
  */
  requestIdleCallback: 'Request Idle Callback',
  /**
  *@description Text in Timeline UIUtils of the Performance panel
  */
  cancelIdleCallback: 'Cancel Idle Callback',
  /**
  *@description Text in Timeline UIUtils of the Performance panel
  */
  fireIdleCallback: 'Fire Idle Callback',
  /**
  *@description Text in Timeline UIUtils of the Performance panel
  */
  createWebsocket: 'Create WebSocket',
  /**
  *@description Text in Timeline UIUtils of the Performance panel
  */
  sendWebsocketHandshake: 'Send WebSocket Handshake',
  /**
  *@description Text in Timeline UIUtils of the Performance panel
  */
  receiveWebsocketHandshake: 'Receive WebSocket Handshake',
  /**
  *@description Text in Timeline UIUtils of the Performance panel
  */
  destroyWebsocket: 'Destroy WebSocket',
  /**
  *@description Event category in the Performance panel for time spent in the embedder of the WebView
  */
  embedderCallback: 'Embedder Callback',
  /**
  *@description Event category in the Performance panel for time spent decoding an image
  */
  imageDecode: 'Image Decode',
  /**
  *@description Event category in the Performance panel for time spent to resize an image
  */
  imageResize: 'Image Resize',
  /**
  *@description Event category in the Performance panel for time spent in the GPU
  */
  gpu: 'GPU',
  /**
  *@description Text in Timeline UIUtils of the Performance panel
  */
  inputLatency: 'Input Latency',
  /**
  *@description Event category in the Performance panel for time spent to perform Garbage Collection for the Document Object Model
  */
  domGc: 'DOM GC',
  /**
  *@description Event category in the Performance panel for time spent to perform encryption
  */
  encrypt: 'Encrypt',
  /**
  *@description Text in Timeline UIUtils of the Performance panel
  */
  encryptReply: 'Encrypt Reply',
  /**
  *@description Event category in the Performance panel for time spent to perform decryption
  */
  decrypt: 'Decrypt',
  /**
  *@description Text in Timeline UIUtils of the Performance panel
  */
  decryptReply: 'Decrypt Reply',
  /**
   * @description Noun phrase meaning 'the browser was preparing the digest'.
   * Digest: https://developer.mozilla.org/en-US/docs/Glossary/Digest
   */
  digest: 'Digest',
  /**
  *@description Noun phrase meaning 'the browser was preparing the digest
  *reply'. Digest: https://developer.mozilla.org/en-US/docs/Glossary/Digest
  */
  digestReply: 'Digest Reply',
  /**
  *@description The 'sign' stage of a web crypto event. Shown when displaying what the website was doing at a particular point in time.
  */
  sign: 'Sign',
  /**
   * @description Noun phrase for an event of the Web Crypto API. The event is recorded when the signing process is concluded.
   * Signature: https://developer.mozilla.org/en-US/docs/Glossary/Signature/Security
   */
  signReply: 'Sign Reply',
  /**
  *@description Text in Timeline UIUtils of the Performance panel
  */
  verify: 'Verify',
  /**
  *@description Text in Timeline UIUtils of the Performance panel
  */
  verifyReply: 'Verify Reply',
  /**
  *@description Text in Timeline UIUtils of the Performance panel
  */
  asyncTask: 'Async Task',
  /**
  *@description Text in Timeline for Layout Shift records
  */
  layoutShift: 'Layout Shift',
  /**
  *@description Text in Timeline UIUtils of the Performance panel
  */
  keyCharacter: 'Key — Character',
  /**
  *@description Text in Timeline UIUtils of the Performance panel
  */
  keyDown: 'Key Down',
  /**
  *@description Noun for the end keyboard key event in the Performance panel. 'Up' refers to the keyboard key bouncing back up after being pushed down.
  */
  keyUp: 'Key Up',
  /**
  *@description Noun for a mouse click event in the Performance panel.
  */
  click: 'Click',
  /**
  *@description Text in Timeline UIUtils of the Performance panel
  */
  contextMenu: 'Context Menu',
  /**
  *@description Noun for the start of a mouse event in the Performance panel. Down refers to the button on the mouse being pressed down.
  */
  mouseDown: 'Mouse Down',
  /**
  *@description Noun for a mouse move event in the Performance panel.
  */
  mouseMove: 'Mouse Move',
  /**
  *@description Noun for the end of a mouse event in the Performance panel. Up refers to the button on the mouse being released.
  */
  mouseUp: 'Mouse Up',
  /**
  *@description Text in Timeline UIUtils of the Performance panel
  */
  mouseWheel: 'Mouse Wheel',
  /**
  *@description Noun for the beginning of a mouse scroll wheel event in the Performance panel.
  */
  scrollBegin: 'Scroll Begin',
  /**
  *@description Text in Timeline UIUtils of the Performance panel
  */
  scrollEnd: 'Scroll End',
  /**
  *@description Noun for an update of a mouse scroll wheel event in the Performance panel.
  */
  scrollUpdate: 'Scroll Update',
  /**
  *@description Noun for the beginning of a fling gesture event in the Performance panel.
  */
  flingStart: 'Fling Start',
  /**
  *@description Noun for the end of a fling gesture event in the Performance panel.
  */
  flingHalt: 'Fling Halt',
  /**
  *@description Noun for a tap event (tap on a touch screen device) in the Performance panel.
  */
  tap: 'Tap',
  /**
  *@description Noun for the end of a tap event (tap on a touch screen device) in the Performance panel.
  */
  tapHalt: 'Tap Halt',
  /**
  *@description Noun for the start of a tap event (tap on a touch screen device) in the Performance panel.
  */
  tapBegin: 'Tap Begin',
  /**
  *@description Noun for the beginning of a tap gesture event in the Performance
  *panel. 'Down' refers to the start (downward tap direction), as opposed to up
  *(finger leaving the touch surface).
  */
  tapDown: 'Tap Down',
  /**
   * @description Noun for the cancelation of an input touch event in the Performance panel.
   * For example this can happen when the user touches the surface with too many fingers.
   * This is opposed to a "Touch End" event, where the user lifts the finger from the surface.
   */
  touchCancel: 'Touch Cancel',
  /**
  *@description Noun for the end of an input touch event in the Performance panel.
  */
  touchEnd: 'Touch End',
  /**
  *@description Noun for an input touch event in the Performance panel.
  */
  touchMove: 'Touch Move',
  /**
  *@description Noun for the start of an input touch event in the Performance panel.
  */
  touchStart: 'Touch Start',
  /**
  *@description Noun for the beginning of a pinch gesture event in the Performance panel.
  */
  pinchBegin: 'Pinch Begin',
  /**
  *@description Text in Timeline UIUtils of the Performance panel
  */
  pinchEnd: 'Pinch End',
  /**
  *@description Text in Timeline UIUtils of the Performance panel
  */
  pinchUpdate: 'Pinch Update',
  /**
  *@description Text in Timeline UIUtils of the Performance panel
  */
  compile: 'Compile',
  /**
  *@description Text to parse something
  */
  parse: 'Parse',
  /**
  *@description Text with two placeholders separated by a colon
  *@example {Node removed} PH1
  *@example {div#id1} PH2
  */
  sS: '{PH1}: {PH2}',
  /**
  *@description Label of a field in a timeline. A Network response refers to the act of acknowledging a
  network request. Should not be confused with answer.
  */
  response: 'Response',
  /**
  *@description Text in Timeline UIUtils of the Performance panel
  */
  fling: 'Fling',
  /**
  *@description Text in Timeline UIUtils of the Performance panel
  */
  drag: 'Drag',
  /**
  *@description Text in Timeline UIUtils of the Performance panel
  */
  uncategorized: 'Uncategorized',
  /**
  *@description Details text in Timeline UIUtils of the Performance panel
  *@example {30 MB} PH1
  */
  sCollected: '{PH1} collected',
  /**
  *@description Details text in Timeline UIUtils of the Performance panel
  *@example {https://example.com} PH1
  *@example {2} PH2
  *@example {4} PH3
  */
  sSs: '{PH1} [{PH2}…{PH3}]',
  /**
  *@description Details text in Timeline UIUtils of the Performance panel
  *@example {https://example.com} PH1
  *@example {2} PH2
  */
  sSSquareBrackets: '{PH1} [{PH2}…]',
  /**
  *@description Text that is usually a hyperlink to more documentation
  */
  learnMore: 'Learn more',
  /**
  *@description Text in Timeline UIUtils of the Performance panel
  */
  compilationCacheStatus: 'Compilation cache status',
  /**
  *@description Text in Timeline UIUtils of the Performance panel
  */
  compilationCacheSize: 'Compilation cache size',
  /**
  *@description Text in Timeline UIUtils of the Performance panel
  */
  scriptLoadedFromCache: 'script loaded from cache',
  /**
  *@description Text in Timeline UIUtils of the Performance panel
  */
  failedToLoadScriptFromCache: 'failed to load script from cache',
  /**
  *@description Text in Timeline UIUtils of the Performance panel
  */
  scriptNotEligible: 'script not eligible',
  /**
  *@description Text for the total time of something
  */
  totalTime: 'Total Time',
  /**
  *@description Time of a single activity, as opposed to the total time
  */
  selfTime: 'Self Time',
  /**
  *@description Label in the summary view in the Performance panel for a number which indicates how much managed memory has been reclaimed by performing Garbage Collection
  */
  collected: 'Collected',
  /**
  *@description Text for a programming function
  */
  function: 'Function',
  /**
  *@description Text in Timeline UIUtils of the Performance panel
  */
  timerId: 'Timer ID',
  /**
  *@description Text in Timeline UIUtils of the Performance panel
  */
  timeout: 'Timeout',
  /**
  *@description Text in Timeline UIUtils of the Performance panel
  */
  repeats: 'Repeats',
  /**
  *@description Text in Timeline UIUtils of the Performance panel
  */
  callbackId: 'Callback ID',
  /**
  *@description Text that refers to the resources of the web page
  */
  resource: 'Resource',
  /**
  *@description Text that refers to the network request method
  */
  requestMethod: 'Request Method',
  /**
  *@description Status code of an event
  */
  statusCode: 'Status Code',
  /**
  *@description Text in Timeline UIUtils of the Performance panel
  */
  mimeTypeCaps: 'MIME Type',
  /**
  *@description Text to show the priority of an item
  */
  priority: 'Priority',
  /**
  *@description Text in Timeline UIUtils of the Performance panel
  */
  encodedData: 'Encoded Data',
  /**
  *@description Text in Timeline UIUtils of the Performance panel
  */
  sBytes: '{n, plural, =1 {# Byte} other {# Bytes}}',
  /**
  *@description Text in Timeline UIUtils of the Performance panel
  */
  decodedBody: 'Decoded Body',
  /**
  *@description Text for a module, the programming concept
  */
  module: 'Module',
  /**
  *@description Label for a group of JavaScript files
  */
  script: 'Script',
  /**
  *@description Text in Timeline UIUtils of the Performance panel
  */
  streamed: 'Streamed',
  /**
  *@description Text in Timeline UIUtils of the Performance panel
  */
  eagerCompile: 'Compiling all functions eagerly',
  /**
  *@description Text in Timeline UIUtils of the Performance panel
  */
  url: 'Url',
  /**
  *@description Text in Timeline UIUtils of the Performance panel
  */
  producedCacheSize: 'Produced Cache Size',
  /**
  *@description Text in Timeline UIUtils of the Performance panel
  */
  consumedCacheSize: 'Consumed Cache Size',
  /**
  *@description Title for a group of cities
  */
  location: 'Location',
  /**
  *@description Text in Timeline UIUtils of the Performance panel
  *@example {2} PH1
  *@example {2} PH2
  */
  sSCurlyBrackets: '({PH1}, {PH2})',
  /**
  *@description Text in Timeline UIUtils of the Performance panel
  */
  dimensions: 'Dimensions',
  /**
  *@description Text in Timeline UIUtils of the Performance panel
  *@example {2} PH1
  *@example {2} PH2
  */
  sSDimensions: '{PH1} × {PH2}',
  /**
  *@description Related node label in Timeline UIUtils of the Performance panel
  */
  layerRoot: 'Layer Root',
  /**
  *@description Related node label in Timeline UIUtils of the Performance panel
  */
  ownerElement: 'Owner Element',
  /**
  *@description Text in Timeline UIUtils of the Performance panel
  */
  imageUrl: 'Image URL',
  /**
  *@description Text in Timeline UIUtils of the Performance panel
  */
  stylesheetUrl: 'Stylesheet URL',
  /**
  *@description Text in Timeline UIUtils of the Performance panel
  */
  elementsAffected: 'Elements Affected',
  /**
  *@description Text in Timeline UIUtils of the Performance panel
  */
  nodesThatNeedLayout: 'Nodes That Need Layout',
  /**
  *@description Text in Timeline UIUtils of the Performance panel
  *@example {2} PH1
  *@example {10} PH2
  */
  sOfS: '{PH1} of {PH2}',
  /**
  *@description Related node label in Timeline UIUtils of the Performance panel
  */
  layoutRoot: 'Layout root',
  /**
  *@description Text in Timeline UIUtils of the Performance panel
  */
  message: 'Message',
  /**
  *@description Text in Timeline UIUtils of the Performance panel
  */
  websocketProtocol: 'WebSocket Protocol',
  /**
  *@description Text in Timeline UIUtils of the Performance panel
  */
  callbackFunction: 'Callback Function',
  /**
  *@description The current state of an item
  */
  state: 'State',
  /**
  *@description Text in Timeline UIUtils of the Performance panel
  */
  range: 'Range',
  /**
  *@description Text in Timeline UIUtils of the Performance panel
  */
  allottedTime: 'Allotted Time',
  /**
  *@description Text in Timeline UIUtils of the Performance panel
  */
  invokedByTimeout: 'Invoked by Timeout',
  /**
  *@description Text that refers to some types
  */
  type: 'Type',
  /**
  *@description Text for the size of something
  */
  size: 'Size',
  /**
  *@description Text for the details of something
  */
  details: 'Details',
  /**
  *@description Title in Timeline for Cumulative Layout Shifts
  */
  cumulativeLayoutShifts: 'Cumulative Layout Shifts',
  /**
  *@description Text for the link to the evolved CLS website
  */
  evolvedClsLink: 'evolved',
  /**
  *@description Warning in Timeline that CLS can cause a poor user experience. It contains a link to inform developers about the recent changes to how CLS is measured. The new CLS metric is said to have evolved from the previous version.
  *@example {Link to web.dev/metrics} PH1
  *@example {Link to web.dev/evolving-cls which will always have the text 'evolved'} PH2
  */
  sCLSInformation: '{PH1} can result in poor user experiences. It has recently {PH2}.',
  /**
  *@description Text to indicate an item is a warning
  */
  warning: 'Warning',
  /**
  *@description Title for the Timeline CLS Score
  */
  score: 'Score',
  /**
  *@description Text in Timeline for the cumulative CLS score
  */
  cumulativeScore: 'Cumulative Score',
  /**
  *@description Text in Timeline for the current CLS score
  */
  currentClusterScore: 'Current Cluster Score',
  /**
  *@description Text in Timeline for the current CLS cluster
  */
  currentClusterId: 'Current Cluster ID',
  /**
  *@description Text in Timeline for whether input happened recently
  */
  hadRecentInput: 'Had recent input',
  /**
  *@description Text in Timeline indicating that input has happened recently
  */
  yes: 'Yes',
  /**
  *@description Text in Timeline indicating that input has not happened recently
  */
  no: 'No',
  /**
  *@description Label for Cumulative Layout records, indicating where they moved from
  */
  movedFrom: 'Moved from',
  /**
  *@description Label for Cumulative Layout records, indicating where they moved to
  */
  movedTo: 'Moved to',
  /**
  *@description Text in Timeline UIUtils of the Performance panel
  */
  timeWaitingForMainThread: 'Time Waiting for Main Thread',
  /**
  *@description Text in Timeline UIUtils of the Performance panel
  */
  relatedNode: 'Related Node',
  /**
  *@description Text for previewing items
  */
  preview: 'Preview',
  /**
  *@description Text in Timeline UIUtils of the Performance panel
  */
  aggregatedTime: 'Aggregated Time',
  /**
  *@description Text in Timeline UIUtils of the Performance panel
  */
  networkRequest: 'Network request',
  /**
  *@description Text in Timeline UIUtils of the Performance panel
  */
  loadFromCache: 'load from cache',
  /**
  *@description Text in Timeline UIUtils of the Performance panel
  */
  networkTransfer: 'network transfer',
  /**
  *@description Text in Timeline UIUtils of the Performance panel
  *@example {1ms} PH1
  *@example {network transfer} PH2
  *@example {1ms} PH3
  */
  SSSResourceLoading: ' ({PH1} {PH2} + {PH3} resource loading)',
  /**
  *@description Text for the duration of something
  */
  duration: 'Duration',
  /**
  *@description Text in Timeline UIUtils of the Performance panel
  */
  mimeType: 'Mime Type',
  /**
  *@description Text in Timeline UIUtils of the Performance panel
  */
  FromMemoryCache: ' (from memory cache)',
  /**
  *@description Text in Timeline UIUtils of the Performance panel
  */
  FromCache: ' (from cache)',
  /**
  *@description Label for a network request indicating that it was a HTTP2 server push instead of a regular network request, in the Performance panel
  */
  FromPush: ' (from push)',
  /**
  *@description Text in Timeline UIUtils of the Performance panel
  */
  FromServiceWorker: ' (from `service worker`)',
  /**
  *@description Text for the initiator of something
  */
  initiator: 'Initiator',
  /**
  *@description Call site stack label in Timeline UIUtils of the Performance panel
  */
  timerInstalled: 'Timer Installed',
  /**
  *@description Call site stack label in Timeline UIUtils of the Performance panel
  */
  animationFrameRequested: 'Animation Frame Requested',
  /**
  *@description Call site stack label in Timeline UIUtils of the Performance panel
  */
  idleCallbackRequested: 'Idle Callback Requested',
  /**
  *@description Stack label in Timeline UIUtils of the Performance panel
  */
  recalculationForced: 'Recalculation Forced',
  /**
  *@description Call site stack label in Timeline UIUtils of the Performance panel
  */
  firstLayoutInvalidation: 'First Layout Invalidation',
  /**
  *@description Stack label in Timeline UIUtils of the Performance panel
  */
  layoutForced: 'Layout Forced',
  /**
  *@description Text in Timeline UIUtils of the Performance panel
  */
  callStacks: 'Call Stacks',
  /**
  *@description Text for the execution stack trace
  */
  stackTrace: 'Stack Trace',
  /**
  *@description Text in Timeline UIUtils of the Performance panel
  */
  invalidations: 'Invalidations',
  /**
   * @description Text in Timeline UIUtils of the Performance panel. Phrase is followed by a number of milliseconds.
   * Some events or tasks might have been only started, but have not ended yet. Such events or tasks are considered
   * "pending".
   */
  pendingFor: 'Pending for',
  /**
  *@description Text for revealing an item in its destination
  */
  reveal: 'Reveal',
  /**
  *@description Noun label for a stack trace which indicates the first time some condition was invalidated.
  */
  firstInvalidated: 'First Invalidated',
  /**
  *@description Title in Timeline UIUtils of the Performance panel
  */
  styleInvalidations: 'Style Invalidations',
  /**
  *@description Title in Timeline UIUtils of the Performance panel
  */
  layoutInvalidations: 'Layout Invalidations',
  /**
  *@description Title in Timeline UIUtils of the Performance panel
  */
  otherInvalidations: 'Other Invalidations',
  /**
  *@description Title of the paint profiler, old name of the performance pane
  */
  paintProfiler: 'Paint Profiler',
  /**
  *@description Text in Timeline Flame Chart View of the Performance panel
  *@example {Frame} PH1
  *@example {10ms} PH2
  */
  sAtS: '{PH1} at {PH2}',
  /**
  *@description Category in the Summary view of the Performance panel to indicate time spent to load resources
  */
  loading: 'Loading',
  /**
  *@description Text in Timeline for the Experience title
  */
  experience: 'Experience',
  /**
  *@description Category in the Summary view of the Performance panel to indicate time spent in script execution
  */
  scripting: 'Scripting',
  /**
  *@description Category in the Summary view of the Performance panel to indicate time spent in rendering the web page
  */
  rendering: 'Rendering',
  /**
  *@description Category in the Summary view of the Performance panel to indicate time spent to visually represent the web page
  */
  painting: 'Painting',
  /**
  *@description Text in Timeline UIUtils of the Performance panel
  */
  async: 'Async',
  /**
  *@description Category in the Summary view of the Performance panel to indicate time spent in the rest of the system
  */
  system: 'System',
  /**
  *@description Category in the Summary view of the Performance panel to indicate idle time
  */
  idle: 'Idle',
  /**
  *@description Text in Timeline UIUtils of the Performance panel
  *@example {blink.console} PH1
  */
  sSelf: '{PH1} (self)',
  /**
  *@description Text in Timeline UIUtils of the Performance panel
  *@example {blink.console} PH1
  */
  sChildren: '{PH1} (children)',
  /**
  *@description Text in Timeline UIUtils of the Performance panel
  */
  timeSpentInRendering: 'Time spent in rendering',
  /**
  *@description Text for a rendering frame
  */
  frame: 'Frame',
  /**
  *@description Text in Timeline Event Overview of the Performance panel
  */
  fps: 'FPS',
  /**
  *@description Text in Timeline UIUtils of the Performance panel
  */
  cpuTime: 'CPU time',
  /**
  *@description Text in Timeline UIUtils of the Performance panel
  */
  layerTree: 'Layer tree',
  /**
  *@description Text in Timeline UIUtils of the Performance panel
  */
  show: 'Show',
  /**
  *@description Text in Timeline UIUtils of the Performance panel
  *@example {10ms} PH1
  *@example {10ms} PH2
  */
  sAtSParentheses: '{PH1} (at {PH2})',
  /**
  *@description Text that only contain a placeholder
  *@example {100ms (at 200ms)} PH1
  */
  emptyPlaceholder: '{PH1}',  // eslint-disable-line rulesdir/l10n_no_locked_or_placeholder_only_phrase
  /**
  *@description Text in Timeline UIUtils of the Performance panel
  */
  jank: 'jank',
  /**
  *@description Text in Timeline UIUtils of the Performance panel
  *@example {Took 3ms} PH1
  *@example {jank} PH2
  */
  sLongFrameTimesAreAnIndicationOf: '{PH1}. Long frame times are an indication of {PH2}',
  /**
  *@description Text in Timeline UIUtils of the Performance panel
  */
  forcedReflow: 'Forced reflow',
  /**
  *@description Text in Timeline UIUtils of the Performance panel
  *@example {Forced reflow} PH1
  */
  sIsALikelyPerformanceBottleneck: '{PH1} is a likely performance bottleneck.',
  /**
  *@description Span text content in Timeline UIUtils of the Performance panel
  *@example {10ms} PH1
  */
  idleCallbackExecutionExtended: 'Idle callback execution extended beyond deadline by {PH1}',
  /**
  *@description Span text content in Timeline UIUtils of the Performance panel
  *@example {10ms} PH1
  */
  handlerTookS: 'Handler took {PH1}',
  /**
  *@description Warning to the user in the Performance panel that an input handler, which was run multiple times, took too long. Placeholder text is time in ms.
  *@example {20ms} PH1
  */
  recurringHandlerTookS: 'Recurring handler took {PH1}',
  /**
  *@description Text in Timeline UIUtils of the Performance panel
  */
  longTask: 'Long task',
  /**
  *@description Text in Timeline UIUtils of the Performance panel
  *@example {task} PH1
  *@example {10ms} PH2
  */
  sTookS: '{PH1} took {PH2}.',
  /**
  *@description Text that indicates something is not optimized
  */
  notOptimized: 'Not optimized',
  /**
  *@description Text that starts with a colon and includes a placeholder
  *@example {3.0} PH1
  */
  emptyPlaceholderColon: ': {PH1}',
  /**
  *@description Text in Timeline UIUtils of the Performance panel
  */
  unknownCause: 'Unknown cause',
  /**
  *@description Text in Timeline UIUtils of the Performance panel
  *@example {Unkown reason} PH1
  *@example {node1} PH2
  */
  sForS: '{PH1} for {PH2}',
  /**
  *@description Text in Timeline UIUtils of the Performance panel
  *@example {StyleInvalidator for element} PH1
  *@example {Stack trace: function  line} PH2
  */
  sSDot: '{PH1}. {PH2}',
  /**
  *@description Text in Object Properties Section
  */
  unknown: 'unknown',
  /**
  *@description Text of a DOM element in Timeline UIUtils of the Performance panel
  */
  stackTraceColon: 'Stack trace:',
  /**
  *@description Text in Timeline UIUtils of the Performance panel
  */
  nodes: 'Nodes:',
  /**
  *@description Text in Timeline UIUtils of the Performance panel
  */
  node: 'Node:',
  /**
  *@description Text of a DOM element in Timeline UIUtils of the Performance panel
  *@example {id2} PH1
  *@example {a, b} PH2
  */
  changedIdToSs: '(changed id to "{PH1}"{PH2})',
  /**
  *@description Text of a DOM element in Timeline UIUtils of the Performance panel
  *@example {class-name2} PH1
  *@example {a, b} PH2
  */
  changedClassToSs: '(changed class to "{PH1}"{PH2})',
  /**
  *@description Text of a DOM element in Timeline UIUtils of the Performance panel
  *@example {attribute-name} PH1
  *@example {a, b} PH2
  */
  changedAttributeToSs: '(changed attribute to "{PH1}"{PH2})',
  /**
  *@description Text of a DOM element in Timeline UIUtils of the Performance panel
  *@example {after} PH1
  *@example {a, b} PH2
  */
  changedPesudoToSs: '(changed pseudo to "{PH1}"{PH2})',
  /**
  *@description Text of a DOM element in Timeline UIUtils of the Performance panel
  *@example {part} PH1
  *@example {a, b} PH2
  */
  changedSs: '(changed "{PH1}"{PH2})',
  /**
  *@description Text in Timeline UIUtils of the Performance panel
  *@example {node1} PH1
  *@example {node2} PH2
  *@example {2} PH3
  */
  sSAndSOthers: '{PH1}, {PH2}, and {PH3} others',
  /**
  *@description Text of a DOM element in Timeline UIUtils of the Performance panel
  */
  UnknownNode: '[ unknown node ]',
};
const i18nString = (str: string) => str;

let eventStylesMap: EventStylesMap;

let inputEventToDisplayName: Map<InputEvents, string>;

let interactionPhaseStylesMap: Map<Phases, {
  color: string,
  label: string,
}>;

let categories: {
  [x: string]: TimelineCategory,
};

let eventCategories: string[];
interface EventStylesMap {
  [x: string]: TimelineRecordStyle;
}
export class TimelineUIUtils {
  private static initEventStyles(): EventStylesMap {
    if (eventStylesMap) {
      return eventStylesMap;
    }

    const type = RecordType;
    const categories = TimelineUIUtils.categories();
    const rendering = categories['rendering'];
    const scripting = categories['scripting'];
    const loading = categories['loading'];
    const experience = categories['experience'];
    const painting = categories['painting'];
    const other = categories['other'];
    const idle = categories['idle'];

    const eventStyles: EventStylesMap = {};
    eventStyles[type.Task] = new TimelineRecordStyle(i18nString(UIStrings.task), other);
    eventStyles[type.Program] = new TimelineRecordStyle(i18nString(UIStrings.other), other);
    eventStyles[type.Animation] = new TimelineRecordStyle(i18nString(UIStrings.animation), rendering);
    eventStyles[type.EventDispatch] = new TimelineRecordStyle(i18nString(UIStrings.event), scripting);
    eventStyles[type.RequestMainThreadFrame] =
        new TimelineRecordStyle(i18nString(UIStrings.requestMainThreadFrame), rendering, true);
    eventStyles[type.BeginFrame] = new TimelineRecordStyle(i18nString(UIStrings.frameStart), rendering, true);
    eventStyles[type.BeginMainThreadFrame] =
        new TimelineRecordStyle(i18nString(UIStrings.frameStartMainThread), rendering, true);
    eventStyles[type.DrawFrame] = new TimelineRecordStyle(i18nString(UIStrings.drawFrame), rendering, true);
    eventStyles[type.HitTest] = new TimelineRecordStyle(i18nString(UIStrings.hitTest), rendering);
    eventStyles[type.ScheduleStyleRecalculation] =
        new TimelineRecordStyle(i18nString(UIStrings.scheduleStyleRecalculation), rendering);
    eventStyles[type.RecalculateStyles] = new TimelineRecordStyle(i18nString(UIStrings.recalculateStyle), rendering);
    eventStyles[type.UpdateLayoutTree] = new TimelineRecordStyle(i18nString(UIStrings.recalculateStyle), rendering);
    eventStyles[type.InvalidateLayout] =
        new TimelineRecordStyle(i18nString(UIStrings.invalidateLayout), rendering, true);
    eventStyles[type.Layout] = new TimelineRecordStyle(i18nString(UIStrings.layout), rendering);
    eventStyles[type.PaintSetup] = new TimelineRecordStyle(i18nString(UIStrings.paintSetup), painting);
    eventStyles[type.PaintImage] = new TimelineRecordStyle(i18nString(UIStrings.paintImage), painting, true);
    eventStyles[type.UpdateLayer] = new TimelineRecordStyle(i18nString(UIStrings.updateLayer), painting, true);
    eventStyles[type.UpdateLayerTree] = new TimelineRecordStyle(i18nString(UIStrings.updateLayerTree), rendering);
    eventStyles[type.Paint] = new TimelineRecordStyle(i18nString(UIStrings.paint), painting);
    eventStyles[type.RasterTask] = new TimelineRecordStyle(i18nString(UIStrings.rasterizePaint), painting);
    eventStyles[type.ScrollLayer] = new TimelineRecordStyle(i18nString(UIStrings.scroll), rendering);
    eventStyles[type.CompositeLayers] = new TimelineRecordStyle(i18nString(UIStrings.compositeLayers), painting);
    eventStyles[type.ComputeIntersections] =
        new TimelineRecordStyle(i18nString(UIStrings.computeIntersections), rendering);
    eventStyles[type.ParseHTML] = new TimelineRecordStyle(i18nString(UIStrings.parseHtml), loading);
    eventStyles[type.ParseAuthorStyleSheet] = new TimelineRecordStyle(i18nString(UIStrings.parseStylesheet), loading);
    eventStyles[type.TimerInstall] = new TimelineRecordStyle(i18nString(UIStrings.installTimer), scripting);
    eventStyles[type.TimerRemove] = new TimelineRecordStyle(i18nString(UIStrings.removeTimer), scripting);
    eventStyles[type.TimerFire] = new TimelineRecordStyle(i18nString(UIStrings.timerFired), scripting);
    eventStyles[type.XHRReadyStateChange] =
        new TimelineRecordStyle(i18nString(UIStrings.xhrReadyStateChange), scripting);
    eventStyles[type.XHRLoad] = new TimelineRecordStyle(i18nString(UIStrings.xhrLoad), scripting);
    eventStyles[type.CompileScript] = new TimelineRecordStyle(i18nString(UIStrings.compileScript), scripting);
    eventStyles[type.CacheScript] = new TimelineRecordStyle(i18nString(UIStrings.cacheScript), scripting);
    eventStyles[type.CompileCode] = new TimelineRecordStyle(i18nString(UIStrings.compileCode), scripting);
    eventStyles[type.OptimizeCode] = new TimelineRecordStyle(i18nString(UIStrings.optimizeCode), scripting);
    eventStyles[type.EvaluateScript] = new TimelineRecordStyle(i18nString(UIStrings.evaluateScript), scripting);
    eventStyles[type.CompileModule] = new TimelineRecordStyle(i18nString(UIStrings.compileModule), scripting);
    eventStyles[type.CacheModule] = new TimelineRecordStyle(i18nString(UIStrings.cacheModule), scripting);
    eventStyles[type.EvaluateModule] = new TimelineRecordStyle(i18nString(UIStrings.evaluateModule), scripting);
    eventStyles[type.StreamingCompileScript] =
        new TimelineRecordStyle(i18nString(UIStrings.streamingCompileTask), other);
    eventStyles[type.StreamingCompileScriptWaiting] =
        new TimelineRecordStyle(i18nString(UIStrings.waitingForNetwork), idle);
    eventStyles[type.StreamingCompileScriptParsing] =
        new TimelineRecordStyle(i18nString(UIStrings.parseAndCompile), scripting);
    eventStyles[type.WasmStreamFromResponseCallback] =
        new TimelineRecordStyle(i18nString(UIStrings.streamingWasmResponse), scripting);
    eventStyles[type.WasmCompiledModule] = new TimelineRecordStyle(i18nString(UIStrings.compiledWasmModule), scripting);
    eventStyles[type.WasmCachedModule] = new TimelineRecordStyle(i18nString(UIStrings.cachedWasmModule), scripting);
    eventStyles[type.WasmModuleCacheHit] = new TimelineRecordStyle(i18nString(UIStrings.wasmModuleCacheHit), scripting);
    eventStyles[type.WasmModuleCacheInvalid] =
        new TimelineRecordStyle(i18nString(UIStrings.wasmModuleCacheInvalid), scripting);
    eventStyles[type.FrameStartedLoading] =
        new TimelineRecordStyle(i18nString(UIStrings.frameStartedLoading), loading, true);
    eventStyles[type.MarkLoad] = new TimelineRecordStyle(i18nString(UIStrings.onloadEvent), scripting, true);
    eventStyles[type.MarkDOMContent] =
        new TimelineRecordStyle(i18nString(UIStrings.domcontentloadedEvent), scripting, true);
    eventStyles[type.MarkFirstPaint] = new TimelineRecordStyle(i18nString(UIStrings.firstPaint), painting, true);
    eventStyles[type.MarkFCP] = new TimelineRecordStyle(i18nString(UIStrings.firstContentfulPaint), rendering, true);
    eventStyles[type.MarkLCPCandidate] =
        new TimelineRecordStyle(i18nString(UIStrings.largestContentfulPaint), rendering, true);
    eventStyles[type.TimeStamp] = new TimelineRecordStyle(i18nString(UIStrings.timestamp), scripting);
    eventStyles[type.ConsoleTime] = new TimelineRecordStyle(i18nString(UIStrings.consoleTime), scripting);
    eventStyles[type.UserTiming] = new TimelineRecordStyle(i18nString(UIStrings.userTiming), scripting);
    eventStyles[type.ResourceWillSendRequest] = new TimelineRecordStyle(i18nString(UIStrings.willSendRequest), loading);
    eventStyles[type.ResourceSendRequest] = new TimelineRecordStyle(i18nString(UIStrings.sendRequest), loading);
    eventStyles[type.ResourceReceiveResponse] = new TimelineRecordStyle(i18nString(UIStrings.receiveResponse), loading);
    eventStyles[type.ResourceFinish] = new TimelineRecordStyle(i18nString(UIStrings.finishLoading), loading);
    eventStyles[type.ResourceReceivedData] = new TimelineRecordStyle(i18nString(UIStrings.receiveData), loading);
    eventStyles[type.RunMicrotasks] = new TimelineRecordStyle(i18nString(UIStrings.runMicrotasks), scripting);
    eventStyles[type.FunctionCall] = new TimelineRecordStyle(i18nString(UIStrings.functionCall), scripting);
    eventStyles[type.GCEvent] = new TimelineRecordStyle(i18nString(UIStrings.gcEvent), scripting);
    eventStyles[type.MajorGC] = new TimelineRecordStyle(i18nString(UIStrings.majorGc), scripting);
    eventStyles[type.MinorGC] = new TimelineRecordStyle(i18nString(UIStrings.minorGc), scripting);
    eventStyles[type.JSFrame] = new TimelineRecordStyle(i18nString(UIStrings.jsFrame), scripting);
    eventStyles[type.RequestAnimationFrame] =
        new TimelineRecordStyle(i18nString(UIStrings.requestAnimationFrame), scripting);
    eventStyles[type.CancelAnimationFrame] =
        new TimelineRecordStyle(i18nString(UIStrings.cancelAnimationFrame), scripting);
    eventStyles[type.FireAnimationFrame] =
        new TimelineRecordStyle(i18nString(UIStrings.animationFrameFired), scripting);
    eventStyles[type.RequestIdleCallback] =
        new TimelineRecordStyle(i18nString(UIStrings.requestIdleCallback), scripting);
    eventStyles[type.CancelIdleCallback] = new TimelineRecordStyle(i18nString(UIStrings.cancelIdleCallback), scripting);
    eventStyles[type.FireIdleCallback] = new TimelineRecordStyle(i18nString(UIStrings.fireIdleCallback), scripting);
    eventStyles[type.WebSocketCreate] = new TimelineRecordStyle(i18nString(UIStrings.createWebsocket), scripting);
    eventStyles[type.WebSocketSendHandshakeRequest] =
        new TimelineRecordStyle(i18nString(UIStrings.sendWebsocketHandshake), scripting);
    eventStyles[type.WebSocketReceiveHandshakeResponse] =
        new TimelineRecordStyle(i18nString(UIStrings.receiveWebsocketHandshake), scripting);
    eventStyles[type.WebSocketDestroy] = new TimelineRecordStyle(i18nString(UIStrings.destroyWebsocket), scripting);
    eventStyles[type.EmbedderCallback] = new TimelineRecordStyle(i18nString(UIStrings.embedderCallback), scripting);
    eventStyles[type.DecodeImage] = new TimelineRecordStyle(i18nString(UIStrings.imageDecode), painting);
    eventStyles[type.ResizeImage] = new TimelineRecordStyle(i18nString(UIStrings.imageResize), painting);
    eventStyles[type.GPUTask] = new TimelineRecordStyle(i18nString(UIStrings.gpu), categories['gpu']);
    eventStyles[type.LatencyInfo] = new TimelineRecordStyle(i18nString(UIStrings.inputLatency), scripting);

    eventStyles[type.GCCollectGarbage] = new TimelineRecordStyle(i18nString(UIStrings.domGc), scripting);

    eventStyles[type.CryptoDoEncrypt] = new TimelineRecordStyle(i18nString(UIStrings.encrypt), scripting);
    eventStyles[type.CryptoDoEncryptReply] = new TimelineRecordStyle(i18nString(UIStrings.encryptReply), scripting);
    eventStyles[type.CryptoDoDecrypt] = new TimelineRecordStyle(i18nString(UIStrings.decrypt), scripting);
    eventStyles[type.CryptoDoDecryptReply] = new TimelineRecordStyle(i18nString(UIStrings.decryptReply), scripting);
    eventStyles[type.CryptoDoDigest] = new TimelineRecordStyle(i18nString(UIStrings.digest), scripting);
    eventStyles[type.CryptoDoDigestReply] = new TimelineRecordStyle(i18nString(UIStrings.digestReply), scripting);
    eventStyles[type.CryptoDoSign] = new TimelineRecordStyle(i18nString(UIStrings.sign), scripting);
    eventStyles[type.CryptoDoSignReply] = new TimelineRecordStyle(i18nString(UIStrings.signReply), scripting);
    eventStyles[type.CryptoDoVerify] = new TimelineRecordStyle(i18nString(UIStrings.verify), scripting);
    eventStyles[type.CryptoDoVerifyReply] = new TimelineRecordStyle(i18nString(UIStrings.verifyReply), scripting);

    eventStyles[type.AsyncTask] = new TimelineRecordStyle(i18nString(UIStrings.asyncTask), categories['async']);

    eventStyles[type.LayoutShift] = new TimelineRecordStyle(i18nString(UIStrings.layoutShift), experience);

    eventStylesMap = eventStyles;
    return eventStyles;
  }

  // TODO(crbug.com/1172300) Ignored during the jsdoc to ts migration
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static setEventStylesMap(eventStyles: any): void {
    eventStylesMap = eventStyles;
  }

  static inputEventDisplayName(inputEventType: InputEvents): string|null {
    if (!inputEventToDisplayName) {
      const inputEvent = InputEvents;

      inputEventToDisplayName = new Map([
        [inputEvent.Char, i18nString(UIStrings.keyCharacter)],
        [inputEvent.KeyDown, i18nString(UIStrings.keyDown)],
        [inputEvent.KeyDownRaw, i18nString(UIStrings.keyDown)],
        [inputEvent.KeyUp, i18nString(UIStrings.keyUp)],
        [inputEvent.Click, i18nString(UIStrings.click)],
        [inputEvent.ContextMenu, i18nString(UIStrings.contextMenu)],
        [inputEvent.MouseDown, i18nString(UIStrings.mouseDown)],
        [inputEvent.MouseMove, i18nString(UIStrings.mouseMove)],
        [inputEvent.MouseUp, i18nString(UIStrings.mouseUp)],
        [inputEvent.MouseWheel, i18nString(UIStrings.mouseWheel)],
        [inputEvent.ScrollBegin, i18nString(UIStrings.scrollBegin)],
        [inputEvent.ScrollEnd, i18nString(UIStrings.scrollEnd)],
        [inputEvent.ScrollUpdate, i18nString(UIStrings.scrollUpdate)],
        [inputEvent.FlingStart, i18nString(UIStrings.flingStart)],
        [inputEvent.FlingCancel, i18nString(UIStrings.flingHalt)],
        [inputEvent.Tap, i18nString(UIStrings.tap)],
        [inputEvent.TapCancel, i18nString(UIStrings.tapHalt)],
        [inputEvent.ShowPress, i18nString(UIStrings.tapBegin)],
        [inputEvent.TapDown, i18nString(UIStrings.tapDown)],
        [inputEvent.TouchCancel, i18nString(UIStrings.touchCancel)],
        [inputEvent.TouchEnd, i18nString(UIStrings.touchEnd)],
        [inputEvent.TouchMove, i18nString(UIStrings.touchMove)],
        [inputEvent.TouchStart, i18nString(UIStrings.touchStart)],
        [inputEvent.PinchBegin, i18nString(UIStrings.pinchBegin)],
        [inputEvent.PinchEnd, i18nString(UIStrings.pinchEnd)],
        [inputEvent.PinchUpdate, i18nString(UIStrings.pinchUpdate)],
      ]);
    }
    return inputEventToDisplayName.get(inputEventType) || null;
  }

  static testContentMatching(traceEvent: TracingModelEvent, regExp: RegExp): boolean {
    const title = TimelineUIUtils.eventStyle(traceEvent).title;
    const tokens = [title];
    const url = TimelineData.forEvent(traceEvent).url;
    if (url) {
      tokens.push(url);
    }
    appendObjectProperties(traceEvent.args, 2);
    return regExp.test(tokens.join('|'));

    // TODO(crbug.com/1172300) Ignored during the jsdoc to ts migration
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    function appendObjectProperties(object: any, depth: number): void {
      if (!depth) {
        return;
      }
      for (const key in object) {
        const value = object[key];
        const type = typeof value;
        if (type === 'string') {
          tokens.push(value);
        } else if (type === 'number') {
          tokens.push(String(value));
        } else if (type === 'object') {
          appendObjectProperties(value, depth - 1);
        }
      }
    }
  }

  static eventURL(event: TracingModelEvent): string|null {
    const data = event.args['data'] || event.args['beginData'];
    const url = data && data.url;
    if (url) {
      return url;
    }
    const stackTrace = data && data['stackTrace'];
    const frame = stackTrace && stackTrace.length && stackTrace[0] ||
        TimelineData.forEvent(event).topFrame();
    return frame && frame.url || null;
  }

  static eventStyle(event: TracingModelEvent): TimelineRecordStyle {
    const eventStyles = TimelineUIUtils.initEventStyles();
    if (event.hasCategory(TimelineModelImpl.Category.Console) ||
        event.hasCategory(TimelineModelImpl.Category.UserTiming)) {
      return new TimelineRecordStyle(event.name, TimelineUIUtils.categories()['scripting']);
    }

    if (event.hasCategory(TimelineModelImpl.Category.LatencyInfo)) {
      /** @const */
      const prefix = 'InputLatency::';
      const inputEventType = event.name.startsWith(prefix) ? event.name.substr(prefix.length) : event.name;
      const displayName =
          TimelineUIUtils.inputEventDisplayName((inputEventType as InputEvents));
      return new TimelineRecordStyle(displayName || inputEventType, TimelineUIUtils.categories()['scripting']);
    }
    let result: TimelineRecordStyle = eventStyles[event.name];
    if (!result) {
      result = new TimelineRecordStyle(event.name, TimelineUIUtils.categories()['other'], true);
      eventStyles[event.name] = result;
    }
    return result;
  }

  static eventColor(event: TracingModelEvent): string {
    // TODO do I really need a color?
    return '';
  }

  static eventColorByProduct(
      model: TimelineModelImpl, urlToColorCache: Map<string, string>,
      event: TracingModelEvent): string {
    // TODO do I really need a color?
    return '';
  }

  private static interactionPhaseStyles(): Map<Phases, {
    color: string,
    label: string,
  }> {
    let map: Map<Phases, {
      color: string,
      label: string,
    }>|Map<Phases, {
      color: string,
      label: string,
    }> = interactionPhaseStylesMap;
    if (!map) {
      map = new Map([
        [Phases.Idle, {color: 'white', label: 'Idle'}],
        [
          Phases.Response,
          {color: 'hsl(43, 83%, 64%)', label: i18nString(UIStrings.response)},
        ],
        [
          Phases.Scroll,
          {color: 'hsl(256, 67%, 70%)', label: i18nString(UIStrings.scroll)},
        ],
        [Phases.Fling, {color: 'hsl(256, 67%, 70%)', label: i18nString(UIStrings.fling)}],
        [Phases.Drag, {color: 'hsl(256, 67%, 70%)', label: i18nString(UIStrings.drag)}],
        [
          Phases.Animation,
          {color: 'hsl(256, 67%, 70%)', label: i18nString(UIStrings.animation)},
        ],
        [
          Phases.Uncategorized,
          {color: 'hsl(0, 0%, 87%)', label: i18nString(UIStrings.uncategorized)},
        ],
      ]);
      interactionPhaseStylesMap = map;
    }
    return map;
  }

  static interactionPhaseColor(phase: Phases): string {
    const interactionPhase = TimelineUIUtils.interactionPhaseStyles().get(phase);
    if (!interactionPhase) {
      throw new Error(`Unknown phase ${phase}`);
    }
    return interactionPhase.color;
  }

  static interactionPhaseLabel(phase: Phases): string {
    const interactionPhase = TimelineUIUtils.interactionPhaseStyles().get(phase);
    if (!interactionPhase) {
      throw new Error(`Unknown phase ${phase}`);
    }
    return interactionPhase.label;
  }

  static isUserFrame(frame: Runtime.CallFrame): boolean {
    return frame.scriptId !== '0' && !(frame.url && frame.url.startsWith('native '));
  }

  static networkCategoryColor(category: NetworkCategory): string {
    const categories = NetworkCategory;
    switch (category) {
      case categories.HTML:
        return 'hsl(214, 67%, 66%)';
      case categories.Script:
        return 'hsl(43, 83%, 64%)';
      case categories.Style:
        return 'hsl(256, 67%, 70%)';
      case categories.Media:
        return 'hsl(109, 33%, 55%)';
      default:
        return 'hsl(0, 0%, 70%)';
    }
  }

  static statsForTimeRange(events: TracingModelEvent[], startTime: number, endTime: number): {
    [x: string]: number,
  } {
    if (!events.length) {
      return {'idle': endTime - startTime};
    }

    buildRangeStatsCacheIfNeeded(events);
    const aggregatedStats = subtractStats(aggregatedStatsAtTime(endTime), aggregatedStatsAtTime(startTime));
    const aggregatedTotal = Object.values(aggregatedStats).reduce((a, b) => a + b, 0);
    aggregatedStats['idle'] = Math.max(0, endTime - startTime - aggregatedTotal);
    return aggregatedStats;

    function aggregatedStatsAtTime(time: number): {
      [x: string]: number,
    } {
      const stats: {
        [x: string]: number,
      } = {};
      // @ts-ignore TODO(crbug.com/1011811): Remove symbol usage.
      const cache = events[categoryBreakdownCacheSymbol];
      for (const category in cache) {
        const categoryCache = cache[category];
        const index =
            upperBound(categoryCache.time, time, DEFAULT_COMPARATOR);
        let value;
        if (index === 0) {
          value = 0;
        } else if (index === categoryCache.time.length) {
          value = categoryCache.value[categoryCache.value.length - 1];
        } else {
          const t0 = categoryCache.time[index - 1];
          const t1 = categoryCache.time[index];
          const v0 = categoryCache.value[index - 1];
          const v1 = categoryCache.value[index];
          value = v0 + (v1 - v0) * (time - t0) / (t1 - t0);
        }
        stats[category] = value;
      }
      return stats;
    }

    function subtractStats(
        a: {
          [x: string]: number,
        },
        b: {
          [x: string]: number,
        }): {
      [x: string]: number,
    } {
      const result = Object.assign({}, a);
      for (const key in b) {
        result[key] -= b[key];
      }
      return result;
    }

    function buildRangeStatsCacheIfNeeded(events: TracingModelEvent[]): void {
      // @ts-ignore TODO(crbug.com/1011811): Remove symbol usage.
      if (events[categoryBreakdownCacheSymbol]) {
        return;
      }

      // aggeregatedStats is a map by categories. For each category there's an array
      // containing sorted time points which records accumulated value of the category.
      const aggregatedStats: {
        [x: string]: {
          time: number[],
          value: number[],
        },
      } = {};
      const categoryStack: string[] = [];
      let lastTime = 0;
      TimelineModelImpl.forEachEvent(
          events, onStartEvent, onEndEvent, undefined, undefined, undefined, filterForStats());

      function filterForStats(): (arg0: TracingModelEvent) => boolean {
        // const visibleEventsFilter = TimelineUIUtils.visibleEventsFilter();
        return (event: TracingModelEvent): boolean =>
            true;
      }

      function updateCategory(category: string, time: number): void {
        let statsArrays: {
          time: number[],
          value: number[],
        } = aggregatedStats[category];
        if (!statsArrays) {
          statsArrays = {time: [], value: []};
          aggregatedStats[category] = statsArrays;
        }
        if (statsArrays.time.length && statsArrays.time[statsArrays.time.length - 1] === time || lastTime > time) {
          return;
        }
        const lastValue = statsArrays.value.length > 0 ? statsArrays.value[statsArrays.value.length - 1] : 0;
        statsArrays.value.push(lastValue + time - lastTime);
        statsArrays.time.push(time);
      }

      function categoryChange(from: string|null, to: string|null, time: number): void {
        if (from) {
          updateCategory(from, time);
        }
        lastTime = time;
        if (to) {
          updateCategory(to, time);
        }
      }

      function onStartEvent(e: TracingModelEvent): void {
        const category = TimelineUIUtils.eventStyle(e).category.name;
        const parentCategory = categoryStack.length ? categoryStack[categoryStack.length - 1] : null;
        if (category !== parentCategory) {
          categoryChange(parentCategory || null, category, e.startTime);
        }
        categoryStack.push(category);
      }

      function onEndEvent(e: TracingModelEvent): void {
        const category = categoryStack.pop();
        const parentCategory = categoryStack.length ? categoryStack[categoryStack.length - 1] : null;
        if (category !== parentCategory) {
          categoryChange(category || null, parentCategory || null, e.endTime || 0);
        }
      }

      const obj = (events as Object);
      obj[categoryBreakdownCacheSymbol] = aggregatedStats;
    }
  }

  static stackTraceFromCallFrames(callFrames: Runtime.CallFrame[]): Runtime.StackTrace {
    return {callFrames: callFrames} as Runtime.StackTrace;
  }

  // private static collectInvalidationNodeIds(
  //     nodeIds: Set<number>, invalidations: InvalidationTrackingEvent[]): void {
  //   Platform.SetUtilities.addAll(nodeIds, invalidations.map(invalidation => invalidation.nodeId).filter(id => id));
  // }

  public static aggregatedStatsForTraceEvent(
      total: {
        [x: string]: number,
      },
      model: TimelineModelImpl, event: TracingModelEvent): boolean {
    const events = model.inspectedTargetEvents();
    function eventComparator(startTime: number, e: TracingModelEvent): number {
      return startTime - e.startTime;
    }

    const index = binaryIndexOf(events, event.startTime, eventComparator);
    // Not a main thread event?
    if (index < 0) {
      return false;
    }
    let hasChildren = false;
    const endTime = event.endTime;
    if (endTime) {
      for (let i = index; i < events.length; i++) {
        const nextEvent = events[i];
        if (nextEvent.startTime >= endTime) {
          break;
        }
        if (!nextEvent.selfTime) {
          continue;
        }
        if (nextEvent.thread !== event.thread) {
          continue;
        }
        if (i > index) {
          hasChildren = true;
        }
        const categoryName = TimelineUIUtils.eventStyle(nextEvent).category.name;
        total[categoryName] = (total[categoryName] || 0) + nextEvent.selfTime;
      }
    }
    if (TracingModel.isAsyncPhase(event.phase)) {
      if (event.endTime) {
        let aggregatedTotal = 0;
        for (const categoryName in total) {
          aggregatedTotal += total[categoryName];
        }
        total['idle'] = Math.max(0, event.endTime - event.startTime - aggregatedTotal);
      }
      return false;
    }
    return hasChildren;
  }

  static categories(): {
    [x: string]: TimelineCategory,
  } {
    if (categories) {
      return categories;
    }
    categories = {
      loading: new TimelineCategory(
          'loading', i18nString(UIStrings.loading), true, 'hsl(214, 67%, 74%)', 'hsl(214, 67%, 66%)'),
      experience: new TimelineCategory(
          'experience', i18nString(UIStrings.experience), false, 'hsl(5, 80%, 74%)', 'hsl(5, 80%, 66%)'),
      scripting: new TimelineCategory(
          'scripting', i18nString(UIStrings.scripting), true, 'hsl(43, 83%, 72%)', 'hsl(43, 83%, 64%) '),
      rendering: new TimelineCategory(
          'rendering', i18nString(UIStrings.rendering), true, 'hsl(256, 67%, 76%)', 'hsl(256, 67%, 70%)'),
      painting: new TimelineCategory(
          'painting', i18nString(UIStrings.painting), true, 'hsl(109, 33%, 64%)', 'hsl(109, 33%, 55%)'),
      gpu: new TimelineCategory('gpu', i18nString(UIStrings.gpu), false, 'hsl(109, 33%, 64%)', 'hsl(109, 33%, 55%)'),
      async:
          new TimelineCategory('async', i18nString(UIStrings.async), false, 'hsl(0, 100%, 50%)', 'hsl(0, 100%, 40%)'),
      other: new TimelineCategory('other', i18nString(UIStrings.system), false, 'hsl(0, 0%, 87%)', 'hsl(0, 0%, 79%)'),
      idle: new TimelineCategory('idle', i18nString(UIStrings.idle), false, 'hsl(0, 0%, 98%)', 'hsl(0, 0%, 98%)'),
    };
    return categories;
  }

  static setCategories(cats: {
    [x: string]: TimelineCategory,
  }): void {
    categories = cats;
  }

  static getTimelineMainEventCategories(): string[] {
    if (eventCategories) {
      return eventCategories;
    }
    eventCategories = ['idle', 'loading', 'painting', 'rendering', 'scripting', 'other'];
    return eventCategories;
  }

  static setTimelineMainEventCategories(categories: string[]): void {
    eventCategories = categories;
  }
}

export class TimelineRecordStyle {
  title: string;
  category: TimelineCategory;
  hidden: boolean;

  constructor(title: string, category: TimelineCategory, hidden: boolean|undefined = false) {
    this.title = title;
    this.category = category;
    this.hidden = hidden;
  }
}

// TODO(crbug.com/1167717): Make this a const enum again
// eslint-disable-next-line rulesdir/const_enum
export enum NetworkCategory {
  HTML = 'HTML',
  Script = 'Script',
  Style = 'Style',
  Media = 'Media',
  Other = 'Other',
}

export const aggregatedStatsKey = Symbol('aggregatedStats');

export const previewElementSymbol = Symbol('previewElement');

export class EventDispatchTypeDescriptor {
  priority: number;
  color: string;
  eventTypes: string[];

  constructor(priority: number, color: string, eventTypes: string[]) {
    this.priority = priority;
    this.color = color;
    this.eventTypes = eventTypes;
  }
}

export class TimelineCategory {
  name: string;
  title: string;
  visible: boolean;
  childColor: string;
  color: string;
  private hiddenInternal?: boolean;

  constructor(name: string, title: string, visible: boolean, childColor: string, color: string) {
    this.name = name;
    this.title = title;
    this.visible = visible;
    this.childColor = childColor;
    this.color = color;
    this.hidden = false;
  }

  get hidden(): boolean {
    return Boolean(this.hiddenInternal);
  }

  set hidden(hidden: boolean) {
    this.hiddenInternal = hidden;
  }
}

export const categoryBreakdownCacheSymbol = Symbol('categoryBreakdownCache');
export interface TimelineMarkerStyle {
  title: string;
  color: string;
  lineWidth: number;
  dashStyle: number[];
  tall: boolean;
  lowPriority: boolean;
}

export function assignLayoutShiftsToClusters(layoutShifts: readonly TracingModelEvent[]): void {
  const gapTimeInMs = 1000;
  const limitTimeInMs = 5000;
  let firstTimestamp = Number.NEGATIVE_INFINITY;
  let previousTimestamp = Number.NEGATIVE_INFINITY;
  let currentClusterId = 0;
  let currentClusterScore = 0;
  let currentCluster = new Set<TracingModelEvent>();

  for (const event of layoutShifts) {
    if (event.args['data']['had_recent_input'] || event.args['data']['weighted_score_delta'] === undefined) {
      continue;
    }

    if (event.startTime - firstTimestamp > limitTimeInMs || event.startTime - previousTimestamp > gapTimeInMs) {
      // This means the event does not fit into the current session/cluster, so we need to start a new cluster.
      firstTimestamp = event.startTime;

      // Update all the layout shifts we found in this cluster to associate them with the cluster.
      for (const layoutShift of currentCluster) {
        layoutShift.args['data']['_current_cluster_score'] = currentClusterScore;
        layoutShift.args['data']['_current_cluster_id'] = currentClusterId;
      }

      // Increment the cluster ID and reset the data.
      currentClusterId += 1;
      currentClusterScore = 0;
      currentCluster = new Set();
    }

    // Store the timestamp of the previous layout shift.
    previousTimestamp = event.startTime;
    // Update the score of the current cluster and store this event in that cluster
    currentClusterScore += event.args['data']['weighted_score_delta'];
    currentCluster.add(event);
  }

  // The last cluster we find may not get closed out - so if not, update all the shifts that we associate with it.
  for (const layoutShift of currentCluster) {
    layoutShift.args['data']['_current_cluster_score'] = currentClusterScore;
    layoutShift.args['data']['_current_cluster_id'] = currentClusterId;
  }
}
