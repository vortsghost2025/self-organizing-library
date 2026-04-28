#!/usr/bin/env node
var fs = require('fs');
var path = require('path');

var LONG = 'SwarmMind';
var SHORT = 'SwarmMind';
var DIRS = ['scripts', 'src', 'config', 'schemas'];
var EXTS = ['.js', '.ts', '.json'];
var SKIP = ['data/', 'docs/autonomous-cycle-test', 'verification/', 'lanes/library/inbox/', 'lanes/library/outbox/', 'lanes/library/processed/'];

var totalFiles = 0;
var totalReplacements = 0;
var changedFiles = [];

function shouldSkip(relPath) {
  var norm = relPath.replace(/\\/g, '/');
  for (var i = 0; i < SKIP.length; i++) {
    if (norm.startsWith(SKIP[i])) return true;
  }
  return false;
}

function processFile(filePath, relPath) {
  if (shouldSkip(relPath)) return;
  var ext = path.extname(filePath);
  if (EXTS.indexOf(ext) === -1) return;
  var content;
  try { content = fs.readFileSync(filePath, 'utf8'); } catch (e) { return; }
  if (content.indexOf(LONG) === -1) return;
  var count = 0;
  var newContent = content;
  while (newContent.indexOf(LONG) !== -1) {
    newContent = newContent.replace(LONG, SHORT);
    count++;
  }
  if (count > 0) {
    fs.writeFileSync(filePath, newContent, 'utf8');
    totalFiles++;
    totalReplacements += count;
    changedFiles.push(relPath + ' (' + count + ')');
  }
}

function walkDir(dir, relBase) {
  var entries;
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch (e) { return; }
  for (var i = 0; i < entries.length; i++) {
    var entry = entries[i];
    var fullPath = path.join(dir, entry.name);
    var relPath = relBase ? relBase + '/' + entry.name : entry.name;
    if (entry.isDirectory()) {
      walkDir(fullPath, relPath);
    } else if (entry.isFile()) {
      processFile(fullPath, relPath);
    }
  }
}

var repoRoot = path.resolve(__dirname, '..');
for (var i = 0; i < DIRS.length; i++) {
  walkDir(path.join(repoRoot, DIRS[i]), DIRS[i]);
}

console.log('Reverted ' + totalReplacements + ' occurrences in ' + totalFiles + ' files');
for (var j = 0; j < changedFiles.length; j++) {
  console.log('  ' + changedFiles[j]);
}
