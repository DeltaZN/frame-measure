// Copyright 2018 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

export class NodeURL {
  static patch(object: {
    url?: string,
  }): void {
    process(object, '');

    function process(object: {url?: string}, path: string): void {
      if (object.url && NodeURL.isPlatformPath(object.url, false)) {
        // object.url can be ob both types: RawPathString and UrlString
        object.url = object.url;
      }
      for (const entry of Object.entries(object)) {
        const key = entry[0];
        const value = entry[1];
        const entryPath = path + '.' + key;
        if (entryPath !== '.result.result.value' && value !== null && typeof value === 'object') {
          process(
              (value as {
                url: string,
              }),
              entryPath);
        }
      }
    }
  }

  static isPlatformPath(fileSystemPath: string, isWindows: boolean): boolean {
    if (isWindows) {
      const re = /^([a-z]:[\/\\]|\\\\)/i;
      return re.test(fileSystemPath);
    }
    return fileSystemPath.length ? fileSystemPath[0] === '/' : false;
  }
}
