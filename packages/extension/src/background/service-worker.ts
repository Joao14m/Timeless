import type { BlockedSite } from '../types';

function getCurrentMinutes(): number {
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes();
}

function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

function isSiteBlocked(site: BlockedSite): boolean {
  if (!site.enabled) return false;
  // Temporarily paused
  if (site.pausedUntil && Date.now() < site.pausedUntil) return false;
  const current = getCurrentMinutes();
  const start = timeToMinutes(site.startTime);
  const end = timeToMinutes(site.endTime);
  // Handle overnight blocks (e.g. 22:00–06:00)
  if (start <= end) {
    return current >= start && current < end;
  }
  return current >= start || current < end;
}

async function getBlockedSites(): Promise<BlockedSite[]> {
  const result = await chrome.storage.local.get('blockedSites');
  return (result.blockedSites as BlockedSite[]) ?? [];
}

async function updateBlockRules(): Promise<void> {
  const sites = await getBlockedSites();

  // Remove all existing dynamic rules
  const existingRules = await chrome.declarativeNetRequest.getDynamicRules();
  const removeRuleIds = existingRules.map((r) => r.id);

  // Build new rules for currently active blocks
  const addRules: chrome.declarativeNetRequest.Rule[] = [];
  let ruleId = 1;

  for (const site of sites) {
    if (isSiteBlocked(site)) {
      const blockedUrl =
        chrome.runtime.getURL('blocked.html') +
        `?site=${encodeURIComponent(site.hostname)}&until=${encodeURIComponent(site.endTime)}`;

      addRules.push({
        id: ruleId++,
        priority: 1,
        action: {
          type: chrome.declarativeNetRequest.RuleActionType.REDIRECT,
          redirect: { url: blockedUrl },
        },
        condition: {
          urlFilter: `||${site.hostname}^`,
          resourceTypes: [chrome.declarativeNetRequest.ResourceType.MAIN_FRAME],
        },
      });
    }
  }

  await chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds,
    addRules,
  });
}

// Apply rules on service worker start
updateBlockRules();

// Re-evaluate every minute to handle time window boundaries
chrome.alarms.create('update-block-rules', { periodInMinutes: 1 });

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'update-block-rules') {
    // Clear expired pauses
    const sites = await getBlockedSites();
    const now = Date.now();
    const cleaned = sites.map((s) =>
      s.pausedUntil && now >= s.pausedUntil ? { ...s, pausedUntil: undefined } : s
    );
    if (cleaned.some((s, i) => s !== sites[i])) {
      await chrome.storage.local.set({ blockedSites: cleaned });
    }
    updateBlockRules();
  }
});

// Immediately re-evaluate when the user modifies the site list
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && 'blockedSites' in changes) {
    updateBlockRules();
  }
});
