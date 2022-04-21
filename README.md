# Frame Measure

You can use this tool for metrics extraction from Chrome Devtools performance profile.

## Motivation

For some performance-critical frontend applications it is very important to collect metrics
based on frames' data (maximum frame time, dropped frames, avg FPS).
However, it's almost impossible to parse chrome performance profile, because its format is undocumented
and the only option is to view this report in the browser. In this case you can't automate your performance testing.
This tool uses internal devtools models to extract frame and cpu metrics from the profile
in consumable format.

## Usage

```js

import { DevToolsAPIWrapper } from '@perf-util/frame-measure';

const data = require('/path/to/raw/timeline/json/file');

const wrapper = new DevToolsAPIWrapper(data);

const cpuStats = wrapper.calculateCPUStats();
const frameStats = wrapper.calculateFrameStats();
```

## License

MIT
