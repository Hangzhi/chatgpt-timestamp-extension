// Wrapped in an IIFE so the declarations below are function-scoped. If the
// script is injected more than once into the same page (duplicate install or
// SPA re-injection), top-level `let`s would otherwise collide in the shared
// MAIN world and throw "Identifier ... has already been declared".
(function () {
const initializationKey = Symbol.for('chatgpt-timestamp-extension.initialized');
if (window[initializationKey]) return;
window[initializationKey] = true;

let use24HourFormat = localStorage.getItem('chatgpt-timestamps-24h-format') !== 'false';
let useUserOnlyTimestamps = localStorage.getItem('chatgpt-timestamps-user-only') !== 'false';

function getCurrentConversationId() {
  return window.location.pathname.match(/\/c\/([^/?#]+)/)?.[1] || null;
}

function normalizeTimestamp(value) {
  if (value == null || value === '') return null;

  let timestamp = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(timestamp)) {
    timestamp = Date.parse(value) / 1000;
  } else if (Math.abs(timestamp) >= 1e12) {
    timestamp /= 1000;
  }
  return Number.isFinite(timestamp) ? timestamp : null;
}

function getMessageFromReactFiber(element) {
  const reactKey = Object.keys(element).find(key => key.startsWith('__reactFiber$'));
  if (!reactKey) return;

  let node = element[reactKey];
  for (let i = 0; i < 15 && node; i++) {
    const messages = node.memoizedProps?.messages;
    if (messages?.[0]?.create_time) return messages[0];
    node = node.return;
  }
}

function formatTimestamp(timestamp) {
  const date = new Date(timestamp * 1000);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const format = number => number.toString().padStart(2, '0');

  if (use24HourFormat) {
    return `${months[date.getMonth()]} ${date.getDate()} ${date.getFullYear()} - ${format(date.getHours())}:${format(date.getMinutes())}:${format(date.getSeconds())}`;
  }

  let hours = date.getHours();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;
  return `${months[date.getMonth()]} ${date.getDate()} ${date.getFullYear()} - ${hours}:${format(date.getMinutes())}:${format(date.getSeconds())} ${ampm}`;
}

function createTimestampSpan(timestamp) {
  const span = document.createElement('span');
  span.textContent = formatTimestamp(timestamp);
  span.className = 'chatgpt-timestamp';
  span.dir = 'ltr';
  span.style.cssText = `
    font-size: 11px;
    color: inherit;
    opacity: 0.65;
    font-weight: 600;
    margin-inline-end: 8px;
    margin-bottom: 4px;
    display: inline-block;
    unicode-bidi: isolate;
    font-family: ui-monospace, 'SF Mono', Monaco, monospace;
  `;
  return span;
}

function addTimestamp(container, messageDiv) {
  if (container.dataset.timestampAdded) return;

  const message = getMessageFromReactFiber(messageDiv);
  const timestamp = normalizeTimestamp(message?.create_time);
  if (timestamp == null) return;
  if (useUserOnlyTimestamps && message.author?.role !== 'user') return;

  messageDiv.insertBefore(createTimestampSpan(timestamp), messageDiv.firstChild);
  container.dataset.timestampAdded = 'true';
}

function ownValue(object, key) {
  if (!object || typeof object !== 'object' || !Object.prototype.hasOwnProperty.call(object, key)) return undefined;
  return object[key];
}

function getCommittedFiber(domNode) {
  const fiberKey = Object.keys(domNode).find(key => key.startsWith('__reactFiber$'));
  if (!fiberKey) return null;

  const originalPath = [];
  const seen = new Set();
  let fiber = ownValue(domNode, fiberKey);
  let root = null;
  for (let depth = 0; fiber && depth < 400; depth++) {
    if (seen.has(fiber)) return null;
    seen.add(fiber);
    originalPath.push(fiber);
    if (ownValue(fiber, 'tag') === 3) {
      const rootState = ownValue(fiber, 'stateNode');
      const current = ownValue(rootState, 'current');
      if (current === fiber || current === ownValue(fiber, 'alternate')) {
        root = { fiber, state: rootState, current };
        break;
      }
    }
    fiber = ownValue(fiber, 'return');
  }
  if (!root) return null;

  const committedPath = [root.current];
  let committedParent = root.current;
  let work = 0;
  for (let pathIndex = originalPath.length - 2; pathIndex >= 0; pathIndex--) {
    const wanted = originalPath[pathIndex];
    const alternate = ownValue(wanted, 'alternate');
    const siblingSeen = new Set();
    const matches = [];
    let child = ownValue(committedParent, 'child');
    for (let siblings = 0; child && siblings < 1024; siblings++) {
      if (++work > 4096 || siblingSeen.has(child)) return null;
      siblingSeen.add(child);
      if (child === wanted || child === alternate) matches.push(child);
      child = ownValue(child, 'sibling');
    }
    if (child || matches.length !== 1) return null;
    committedParent = matches[0];
    committedPath.push(committedParent);
  }

  if (ownValue(root.state, 'current') !== root.current) return null;
  const views = committedPath.map(committedFiber => ({
    memoizedProps: ownValue(committedFiber, 'memoizedProps'),
    memoizedState: ownValue(committedFiber, 'memoizedState'),
    updateQueue: ownValue(committedFiber, 'updateQueue'),
    return: null
  }));
  for (let i = 1; i < views.length; i++) views[i].return = views[i - 1];
  return views[views.length - 1];
}

function getTurnEntry(committedFiber, conversationId) {
  let fiber = committedFiber;
  const seen = new Set();
  for (let depth = 0; fiber && depth < 32; depth++) {
    if (seen.has(fiber)) return null;
    seen.add(fiber);
    const props = fiber.memoizedProps;
    const entry = ownValue(props, 'entry');
    const turn = ownValue(entry, 'turn');
    const items = ownValue(turn, 'items');
    if (Array.isArray(items) && ownValue(entry, 'conversationId') === conversationId) {
      const entryId = ownValue(entry, 'id');
      if (typeof entryId !== 'string' || !entryId) return null;

      return { entry, turn, items };
    }
    fiber = fiber.return;
  }
  return null;
}

function isSnapshotCandidate(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  return Object.prototype.hasOwnProperty.call(value, 'renderedConversation') &&
    Object.prototype.hasOwnProperty.call(value, 'renderedTurns');
}

function findLiveSnapshot(committedFiber, turnInfo) {
  const candidates = [];
  let remaining = 2048;
  const addCandidate = value => {
    if (isSnapshotCandidate(value)) {
      candidates.push(value);
    }
  };
  const inspectMemoCache = memoData => {
    if (!Array.isArray(memoData) || memoData.length > 32) return true;
    for (const row of memoData) {
      if (!Array.isArray(row) || row.length > 1024) continue;
      for (const value of row) {
        if (--remaining < 0) return false;
        addCandidate(value);
      }
    }
    return true;
  };

  const seenFibers = new Set();
  let owner = committedFiber;
  owners: for (let depth = 0; owner && depth < 400; depth++, owner = owner.return) {
    if (seenFibers.has(owner)) return null;
    seenFibers.add(owner);
    if (ownValue(owner.memoizedProps, 'conversationId') !== turnInfo.entry.conversationId) continue;

    let hook = owner.memoizedState;
    const seenHooks = new Set();
    while (hook && remaining > 0) {
      if (seenHooks.has(hook)) return null;
      seenHooks.add(hook);
      remaining--;
      const state = ownValue(hook, 'memoizedState');
      addCandidate(state);
      if (Array.isArray(state)) addCandidate(state[0]);
      hook = ownValue(hook, 'next');
    }
    if (hook || remaining <= 0) break owners;

    const updateQueue = owner.updateQueue;
    const memoCache = ownValue(updateQueue, 'memoCache');
    const memoData = ownValue(memoCache, 'data');
    if (!inspectMemoCache(memoData)) break owners;
  }

  const valid = [];
  for (const snapshot of candidates) {
    const renderedConversation = ownValue(snapshot, 'renderedConversation');
    const renderedTurns = ownValue(snapshot, 'renderedTurns');
    const mapping = ownValue(renderedConversation, 'mapping');
    if (!mapping || typeof mapping !== 'object' || !Array.isArray(renderedTurns)) continue;

    const matchingTurns = renderedTurns.filter(turn =>
      ownValue(turn, 'id') === ownValue(turnInfo.entry, 'id') &&
      ownValue(turn, 'turn') === turnInfo.turn
    );
    if (matchingTurns.length !== 1) continue;

    const userNode = ownValue(mapping, turnInfo.userId);
    const userMessage = ownValue(userNode, 'message');
    if (ownValue(userNode, 'id') !== turnInfo.userId ||
        ownValue(userMessage, 'id') !== turnInfo.userId ||
        ownValue(ownValue(userMessage, 'author'), 'role') !== 'user') continue;
    valid.push({ snapshot, mapping, renderedConversation });
  }
  if (!valid.length) return null;

  const firstMapping = valid[0].mapping;
  if (valid.some(candidate => candidate.mapping !== firstMapping)) return null;
  const currentNodeValues = valid
    .map(candidate => ({ present: Object.prototype.hasOwnProperty.call(candidate.renderedConversation, 'current_node'), value: ownValue(candidate.renderedConversation, 'current_node') }))
    .filter(candidate => candidate.present);
  if (currentNodeValues.some(candidate => !Object.is(candidate.value, currentNodeValues[0].value))) return null;
  return { mapping: firstMapping };
}

function getSemanticUnit(turn, role) {
  return turn.querySelector(`[data-chatgpt-search-unit-key$=":${role}"][data-chatgpt-search-message-ids]`);
}

function getUnitMessageIds(unit) {
  const value = unit?.getAttribute('data-chatgpt-search-message-ids') || '';
  return [...new Set(value.trim().split(/\s+/).filter(Boolean))];
}

function getTypedItemIds(item, role) {
  const keys = role === 'user' ? ['messageId', 'serverMessageId'] : ['messageId', 'latestMessageId'];
  return [...new Set(keys.map(key => ownValue(item, key)).filter(id => typeof id === 'string' && id))];
}

function getMessageTimestamp(mapping, id, role) {
  const node = ownValue(mapping, id);
  const message = ownValue(node, 'message');
  if (ownValue(node, 'id') !== id || ownValue(message, 'id') !== id ||
      ownValue(ownValue(message, 'author'), 'role') !== role) return null;
  return normalizeTimestamp(ownValue(message, 'create_time'));
}

function resolveTurnTimestamp(unit, turnInfo, mapping, role) {
  if (!unit) return null;
  const unitIds = getUnitMessageIds(unit);
  if (!unitIds.length) return null;

  let typedItems;
  if (role === 'user') {
    typedItems = [turnInfo.userItem];
  } else {
    typedItems = turnInfo.items.filter(item => ownValue(item, 'type') === 'assistant-message');
  }
  const selectionId = role === 'assistant'
    ? unit.querySelector('[data-chatgpt-selection-message-id]')
      ?.getAttribute('data-chatgpt-selection-message-id')
    : null;
  const usableSelectionId = selectionId && unitIds.includes(selectionId) ? selectionId : null;

  const candidates = [];
  for (const item of typedItems) {
    const matchingIds = getTypedItemIds(item, role).filter(id => unitIds.includes(id));
    for (const id of matchingIds) {
      candidates.push({
        id,
        finalAnswer: ownValue(item, 'phase') === 'final_answer',
        selected: id === usableSelectionId
      });
    }
  }
  if (!candidates.length) return null;

  const resolved = candidates
    .map(candidate => ({ ...candidate, timestamp: getMessageTimestamp(mapping, candidate.id, role) }))
    .filter(candidate => candidate.timestamp != null);
  if (!resolved.length) return null;
  const finalAnswers = resolved.filter(candidate => candidate.finalAnswer);
  const preferred = role === 'assistant' && finalAnswers.length ? finalAnswers : resolved;
  const selected = preferred.filter(candidate => candidate.selected);
  const chosen = selected.length ? selected : preferred;
  const ids = [...new Set(chosen.map(candidate => candidate.id))];
  return ids.length === 1 ? chosen[0].timestamp : null;
}

function addNewShellTimestamp(surface, role, timestamp) {
  const marker = role === 'user' ? 'timestampUserAdded' : 'timestampAssistantAdded';
  if (surface.querySelector(':scope > .chatgpt-timestamp')) {
    surface.dataset[marker] = 'true';
    return;
  }
  delete surface.dataset[marker];
  if (useUserOnlyTimestamps && role !== 'user') return;
  surface.insertBefore(createTimestampSpan(timestamp), surface.firstChild);
  surface.dataset[marker] = 'true';
}

function inspectNewShellTurn(turn, conversationId) {
  const result = {
    committedFiberFound: false,
    entryFound: false,
    liveSnapshotFound: false,
    userTimestamp: null,
    assistantTimestamp: null
  };
  const committedFiber = getCommittedFiber(turn);
  if (!committedFiber) return result;
  result.committedFiberFound = true;

  const turnInfo = getTurnEntry(committedFiber, conversationId);
  if (!turnInfo) return result;
  result.entryFound = true;

  const userItems = turnInfo.items.filter(item => ownValue(item, 'type') === 'user-message');
  if (userItems.length !== 1) return result;
  turnInfo.userItem = userItems[0];
  turnInfo.userId = ownValue(turnInfo.userItem, 'messageId') || ownValue(turnInfo.userItem, 'serverMessageId');
  if (typeof turnInfo.userId !== 'string' || !turnInfo.userId) return result;

  const liveMapping = findLiveSnapshot(committedFiber, turnInfo);
  if (!liveMapping) return result;
  result.liveSnapshotFound = true;

  result.userTimestamp = resolveTurnTimestamp(
    getSemanticUnit(turn, 'user'), turnInfo, liveMapping.mapping, 'user'
  );
  result.assistantTimestamp = resolveTurnTimestamp(
    getSemanticUnit(turn, 'assistant'), turnInfo, liveMapping.mapping, 'assistant'
  );
  return result;
}

function getNewShellTurns() {
  return document.querySelectorAll(
    '[data-app-shell-main-surface] [data-thread-find-target="conversation"] [data-turn-key]'
  );
}

function addNewShellTimestamps() {
  const conversationId = getCurrentConversationId();
  if (!conversationId) return;

  getNewShellTurns().forEach(turn => {
    const result = inspectNewShellTurn(turn, conversationId);
    if (result.userTimestamp != null) {
      const userSurface = turn.querySelector('[data-user-message-bubble]');
      if (userSurface) addNewShellTimestamp(userSurface, 'user', result.userTimestamp);
    }
    if (!useUserOnlyTimestamps && result.assistantTimestamp != null) {
      const assistantSurface = turn.querySelector('[data-markdown-text-style="assistant-message"]');
      if (assistantSurface) addNewShellTimestamp(assistantSurface, 'assistant', result.assistantTimestamp);
    }
  });
}

function addTimestamps() {
  const turnContainers = document.querySelectorAll('section[data-turn-id]');

  if (turnContainers.length > 0) {
    turnContainers.forEach(section => {
      if (section.dataset.timestampAdded) return;

      const messageDiv = section.querySelector('div[data-message-id]');
      if (!messageDiv) return;

      addTimestamp(section, messageDiv);
    });
    addNewShellTimestamps();
    return;
  }

  document.querySelectorAll('div[data-message-id]').forEach(div => {
    addTimestamp(div, div);
  });
  addNewShellTimestamps();
}

function updateTimestamps() {
  document.querySelectorAll('.chatgpt-timestamp').forEach(span => span.remove());
  document.querySelectorAll('section[data-turn-id]').forEach(section => {
    delete section.dataset.timestampAdded;
  });
  document.querySelectorAll('div[data-message-id]').forEach(div => {
    delete div.dataset.timestampAdded;
  });
  document.querySelectorAll(
    '[data-user-message-bubble], [data-markdown-text-style="assistant-message"]'
  ).forEach(surface => {
    delete surface.dataset.timestampUserAdded;
    delete surface.dataset.timestampAssistantAdded;
  });
  addTimestamps();
}

// Listen for storage changes
window.addEventListener('storage', (e) => {
  if (e.key === 'chatgpt-timestamps-24h-format') {
    use24HourFormat = e.newValue !== 'false';
    updateTimestamps();
    return;
  }
  if (e.key === 'chatgpt-timestamps-user-only') {
    useUserOnlyTimestamps = e.newValue === 'true';
    updateTimestamps();
  }
});

// Wait for page to fully load
setTimeout(() => {
  addTimestamps();
}, 3000);

const observer = new MutationObserver(() => {
  setTimeout(addTimestamps, 500);
});

observer.observe(document.body, {
  childList: true,
  subtree: true
});

// Also run periodically to catch any missed messages
setInterval(addTimestamps, 5000);
})();
