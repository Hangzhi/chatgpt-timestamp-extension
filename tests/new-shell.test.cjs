const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

const source = fs.readFileSync(path.join(__dirname, '../src/content.js'), 'utf8')
  .replace(/\}\)\(\);\s*$/, 'globalThis.inspect = inspectNewShellTurn;})();');
const context = vm.createContext({
  window: { location: { pathname: '/c/server-conversation' }, addEventListener() {} },
  localStorage: { getItem() { return null; } },
  document: { body: {} },
  MutationObserver: class { observe() {} },
  setTimeout() {}, setInterval() {},
});
vm.runInContext(source, context);

function fixture({ entryId = 'local-chatgpt:temporary', ownerId = entryId,
  userTime = 1793958216.62, duplicateTurn = false, unitId = 'user-1',
  role = 'user', assistantTime = 1793958220, conflictingSnapshot = false,
  navigateDuringInspection = false } = {}) {
  const user = { type: 'user-message', messageId: 'user-1', serverMessageId: 'user-1' };
  const assistant = { type: 'assistant-message', messageId: 'assistant-1', phase: 'final_answer' };
  const turn = { items: [user, assistant] };
  const entry = { id: 'turn-1', conversationId: entryId, turn };
  const mapping = {
    'user-1': { id: 'user-1', message: { id: 'user-1', author: { role }, create_time: userTime } },
    'assistant-1': { id: 'assistant-1', message: { id: 'assistant-1', author: { role: 'assistant' }, create_time: assistantTime } },
  };
  const renderedTurn = { id: entry.id, turn };
  const snapshot = { renderedConversation: { mapping }, renderedTurns: duplicateTurn ? [renderedTurn, renderedTurn] : [renderedTurn] };
  const rootState = {};
  const root = { tag: 3, stateNode: rootState };
  rootState.current = root;
  const owner = { return: root, memoizedProps: { conversationId: ownerId }, memoizedState: { memoizedState: snapshot } };
  if (conflictingSnapshot) {
    owner.memoizedState.next = { memoizedState: {
      renderedConversation: { mapping: { ...mapping } }, renderedTurns: [renderedTurn],
    } };
  }
  const entryFiber = { return: owner, memoizedProps: { entry } };
  const leaf = { return: entryFiber };
  root.child = owner;
  owner.child = entryFiber;
  entryFiber.child = leaf;
  const unit = id => ({ getAttribute: () => id, querySelector: () => null });
  return {
    __reactFiber$test: leaf,
    querySelector(selector) {
      if (selector.includes(':user')) {
        if (navigateDuringInspection) context.window.location.pathname = '/c/another-conversation';
        return unit(unitId);
      }
      if (selector.includes(':assistant')) return unit('assistant-1');
      return null;
    },
  };
}

function inspect(options) {
  context.window.location.pathname = '/c/server-conversation';
  return context.inspect(fixture(options), 'server-conversation');
}

test('resolves timestamps in local and URL-matched committed snapshots', () => {
  for (const options of [{}, { entryId: 'server-conversation' }]) {
    const result = inspect(options);
    assert.equal(result.userTimestamp, 1793958216.62);
    assert.equal(result.assistantTimestamp, 1793958220);
  }
});

test('rejects mismatched owner, ambiguous turn, wrong message and wrong role', () => {
  for (const options of [
    { ownerId: 'local-chatgpt:other' },
    { duplicateTurn: true },
    { conflictingSnapshot: true },
    { unitId: 'different-message' },
    { role: 'assistant' },
    { entryId: 'local-chatgpt:' },
    { entryId: 'another-server-conversation' },
  ]) {
    const result = inspect(options);
    assert.equal(result.userTimestamp, null, JSON.stringify(options));
    assert.equal(result.assistantTimestamp, null, JSON.stringify(options));
  }
});

test('rejects results if the URL changes while inspecting the turn', () => {
  const result = inspect({ navigateDuringInspection: true });
  assert.equal(result.userTimestamp, null);
  assert.equal(result.assistantTimestamp, null);
});

test('does not display assistant timestamp when local user timestamp is missing', () => {
  const result = inspect({ userTime: null });
  assert.equal(result.userTimestamp, null);
  assert.equal(result.assistantTimestamp, null);
});
