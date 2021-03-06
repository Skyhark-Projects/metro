/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

'use strict';

const meta = require('../../shared/output/meta');

const {getModuleCodeAndMap, concat} = require('./util');
const {createIndexMap} = require('metro-source-map');

import type {OutputFn} from '../types.flow';
import type {FBSourceMap, MetroSourceMap} from 'metro-source-map';

function asPlainBundle({
  filename,
  idsForPath,
  modules,
  requireCalls,
  sourceMapPath,
  enableIDInlining,
}): {|
  code: string | Buffer,
  extraFiles?: Iterable<[string, string | Buffer]>,
  map: FBSourceMap | MetroSourceMap,
|} {
  let code = '';
  let line = 0;
  const sections = [];
  const modIdForPath = (x: {path: string}) => idsForPath(x).moduleId;

  for (const module of concat(modules, requireCalls)) {
    const {moduleCode, moduleMap} = getModuleCodeAndMap(module, modIdForPath, {
      enableIDInlining,
    });

    code += moduleCode + '\n';
    if (moduleMap) {
      sections.push({
        map: moduleMap,
        offset: {column: 0, line},
      });
    }
    line += countLines(moduleCode);
  }

  if (sourceMapPath) {
    code += `//# sourceMappingURL=${sourceMapPath}`;
  }

  return {
    code,
    extraFiles: [[`${filename}.meta`, meta(code)]],
    map: createIndexMap(filename, sections),
  };
}

module.exports = (asPlainBundle: OutputFn<>);

const reLine = /^/gm;
function countLines(string: string): number {
  //$FlowFixMe This regular expression always matches
  return string.match(reLine).length;
}
